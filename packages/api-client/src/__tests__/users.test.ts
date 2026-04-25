import { updateUserSchema } from '@repo/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Same Proxy-builder pattern used by markMessagesAsRead.test.ts and
// reviews.test.ts. Each from(table) call gets its own scope so chained
// state (filters, current update/select) doesn't leak across queries.

interface FilterEntry {
  op: string;
  column: string;
  value: unknown;
}

interface SelectQuery {
  table: string;
  columns: string;
  options?: { count?: string; head?: boolean };
  filters: FilterEntry[];
}

interface UpdateQuery {
  table: string;
  set: Record<string, unknown>;
  filters: FilterEntry[];
}

const captured: {
  selects: SelectQuery[];
  updates: UpdateQuery[];
  rpcs: Array<{ name: string }>;
  countQueue: number[];
  selectRow: Record<string, unknown> | null;
  updateRow: Record<string, unknown> | null;
  updateError: { message: string } | null;
  rpcRow: Record<string, unknown> | null;
  rpcError: { message: string } | null;
} = {
  selects: [],
  updates: [],
  rpcs: [],
  countQueue: [],
  selectRow: null,
  updateRow: null,
  updateError: null,
  rpcRow: null,
  rpcError: null,
};

function makeFromBuilder(table: string) {
  let pendingSelect: SelectQuery | null = null;
  let pendingUpdate: UpdateQuery | null = null;
  // One count is shifted off the queue per from() call (cached here so a
  // runtime that pokes `.then` twice doesn't consume two counts).
  let thenable: Promise<{ data: null; count: number; error: null }> | null = null;

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'select') {
        return (columns: string, options?: { count?: string; head?: boolean }) => {
          // update(...).select() — re-enters select but we don't double-track.
          if (!pendingUpdate) {
            pendingSelect = { table, columns, options, filters: [] };
            captured.selects.push(pendingSelect);
          }
          return new Proxy({}, handler);
        };
      }
      if (prop === 'update') {
        return (set: Record<string, unknown>) => {
          pendingUpdate = { table, set, filters: [] };
          captured.updates.push(pendingUpdate);
          return new Proxy({}, handler);
        };
      }
      if (prop === 'eq') {
        return (column: string, value: unknown) => {
          if (pendingUpdate) {
            pendingUpdate.filters.push({ op: 'eq', column, value });
          } else if (pendingSelect) {
            pendingSelect.filters.push({ op: 'eq', column, value });
          }
          return new Proxy({}, handler);
        };
      }
      if (prop === 'single') {
        return async () => {
          if (pendingUpdate) {
            return { data: captured.updateRow, error: captured.updateError };
          }
          return { data: captured.selectRow, error: null };
        };
      }
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // Thenable resolution path used for count queries
        // (.select(cols, { count: 'exact', head: true }).eq(...) await).
        if (!thenable) {
          const count = captured.countQueue.shift() ?? 0;
          thenable = Promise.resolve({ data: null, count, error: null });
        }
        const fn = thenable[prop as 'then' | 'catch' | 'finally'] as (
          ...args: unknown[]
        ) => unknown;
        return fn.bind(thenable);
      }
      return undefined;
    },
  };
  return new Proxy({}, handler);
}

vi.mock('../supabaseClient.js', () => ({
  supabase: {
    from: (table: string) => makeFromBuilder(table),
    rpc: (name: string) => {
      captured.rpcs.push({ name });
      return {
        single: async () => ({ data: captured.rpcRow, error: captured.rpcError }),
      };
    },
  },
}));

import { getCommunityStats, getUser, getUserStats, updateUser } from '../users.js';

beforeEach(() => {
  captured.selects = [];
  captured.updates = [];
  captured.rpcs = [];
  captured.countQueue = [];
  captured.selectRow = null;
  captured.updateRow = null;
  captured.updateError = null;
  captured.rpcRow = null;
  captured.rpcError = null;
});

describe('getUser', () => {
  it('selects the row by id and returns it', async () => {
    captured.selectRow = {
      id: 'user-1',
      email: 'a@b.io',
      display_name: 'Alice',
      avatar_url: null,
      bio: 'reads a lot',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };
    const user = await getUser('user-1');
    expect(user.id).toBe('user-1');
    expect(captured.selects[0]?.table).toBe('users');
    expect(captured.selects[0]?.filters).toContainEqual({
      op: 'eq',
      column: 'id',
      value: 'user-1',
    });
  });
});

describe('updateUser', () => {
  it('only sends fields that were explicitly provided', async () => {
    captured.updateRow = { id: 'user-1', display_name: 'Alice', bio: 'hi', avatar_url: null };
    await updateUser('user-1', { display_name: 'Alice', bio: 'hi' });

    expect(captured.updates).toHaveLength(1);
    expect(captured.updates[0]!.table).toBe('users');
    expect(captured.updates[0]!.set).toEqual({ display_name: 'Alice', bio: 'hi' });
    expect(captured.updates[0]!.filters).toContainEqual({
      op: 'eq',
      column: 'id',
      value: 'user-1',
    });
  });

  it('allows nulling bio explicitly', async () => {
    captured.updateRow = { id: 'user-1', display_name: 'Alice', bio: null, avatar_url: null };
    await updateUser('user-1', { display_name: 'Alice', bio: null });
    expect(captured.updates[0]!.set).toEqual({ display_name: 'Alice', bio: null });
  });

  it('surfaces RLS errors to the caller (eg trying to edit another user)', async () => {
    captured.updateError = {
      message: 'new row violates row-level security policy for table "users"',
    };
    await expect(updateUser('user-other', { display_name: 'Mallory' })).rejects.toMatchObject({
      message: expect.stringContaining('row-level security'),
    });
  });
});

describe('getUserStats', () => {
  it('issues five count queries with the right filters and returns shape', async () => {
    captured.countQueue = [3, 1, 2, 4, 5];

    const stats = await getUserStats('user-me');

    expect(stats).toEqual({
      books_owned: 3,
      books_lent_out: 1,
      books_borrowed: 2,
      reviews_written: 4,
      reviews_received: 5,
    });

    // Q1: books owned by user
    const ownedBooks = captured.selects[0]!;
    expect(ownedBooks.table).toBe('books');
    expect(ownedBooks.options).toMatchObject({ count: 'exact', head: true });
    expect(ownedBooks.filters).toContainEqual({ op: 'eq', column: 'owner_id', value: 'user-me' });

    // Q2: lent-out (handed_over) requests where book.owner_id = me — uses !inner embed
    const lentOut = captured.selects[1]!;
    expect(lentOut.table).toBe('borrow_requests');
    expect(lentOut.columns).toContain('books!inner(owner_id)');
    expect(lentOut.filters).toContainEqual({ op: 'eq', column: 'status', value: 'handed_over' });
    expect(lentOut.filters).toContainEqual({
      op: 'eq',
      column: 'books.owner_id',
      value: 'user-me',
    });

    // Q3: borrowing (handed_over) requests where requester = me
    const borrowed = captured.selects[2]!;
    expect(borrowed.table).toBe('borrow_requests');
    expect(borrowed.filters).toContainEqual({
      op: 'eq',
      column: 'requester_id',
      value: 'user-me',
    });
    expect(borrowed.filters).toContainEqual({ op: 'eq', column: 'status', value: 'handed_over' });

    // Q4: reviews written by me
    const written = captured.selects[3]!;
    expect(written.table).toBe('reviews');
    expect(written.filters).toContainEqual({
      op: 'eq',
      column: 'reviewer_id',
      value: 'user-me',
    });

    // Q5: reviews on books I own
    const received = captured.selects[4]!;
    expect(received.table).toBe('reviews');
    expect(received.columns).toContain('books!inner(owner_id)');
    expect(received.filters).toContainEqual({
      op: 'eq',
      column: 'books.owner_id',
      value: 'user-me',
    });
  });

  it('coerces missing counts to 0', async () => {
    captured.countQueue = []; // every shift returns undefined → 0
    const stats = await getUserStats('user-me');
    expect(stats).toEqual({
      books_owned: 0,
      books_lent_out: 0,
      books_borrowed: 0,
      reviews_written: 0,
      reviews_received: 0,
    });
  });
});

describe('getCommunityStats', () => {
  it('calls the community_stats RPC and casts bigint columns to numbers', async () => {
    captured.rpcRow = {
      books_count: '12',
      members_count: 7,
      completed_borrows_count: '3',
    };

    const stats = await getCommunityStats();

    expect(captured.rpcs).toEqual([{ name: 'community_stats' }]);
    expect(stats).toEqual({
      books_count: 12,
      members_count: 7,
      completed_borrows_count: 3,
    });
  });

  it('coerces a missing row to zeroed counters', async () => {
    captured.rpcRow = null;
    const stats = await getCommunityStats();
    expect(stats).toEqual({ books_count: 0, members_count: 0, completed_borrows_count: 0 });
  });

  it('surfaces RPC errors to the caller', async () => {
    captured.rpcError = { message: 'permission denied for function community_stats' };
    await expect(getCommunityStats()).rejects.toMatchObject({
      message: expect.stringContaining('permission denied'),
    });
  });
});

describe('updateUserSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(() =>
      updateUserSchema.parse({ display_name: 'Alice', bio: 'reads sci-fi' }),
    ).not.toThrow();
  });

  it('treats empty bio as valid (optional)', () => {
    expect(() => updateUserSchema.parse({ display_name: 'Alice', bio: '' })).not.toThrow();
    expect(() => updateUserSchema.parse({ display_name: 'Alice' })).not.toThrow();
  });

  it('rejects empty display_name', () => {
    expect(() => updateUserSchema.parse({ display_name: '   ' })).toThrow();
    expect(() => updateUserSchema.parse({ display_name: '' })).toThrow();
  });

  it('rejects display_name over 80 chars', () => {
    expect(() => updateUserSchema.parse({ display_name: 'x'.repeat(81) })).toThrow();
  });

  it('rejects bio over 280 chars', () => {
    expect(() => updateUserSchema.parse({ display_name: 'Alice', bio: 'x'.repeat(281) })).toThrow();
  });
});
