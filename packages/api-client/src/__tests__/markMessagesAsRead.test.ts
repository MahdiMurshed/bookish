import { beforeEach, describe, expect, it, vi } from 'vitest';

// The order of these mocks matters: the supabase client has to be mocked
// BEFORE the module under test is imported, or the real createClient() runs
// and blows up on missing env vars.

interface CapturedUpdate {
  table: string;
  set: Record<string, unknown>;
  filters: Array<{ op: string; column: string; value: unknown }>;
}

const captured: { updates: CapturedUpdate[]; authUserId: string | null } = {
  updates: [],
  authUserId: 'user-me',
};

// Supabase's PostgrestBuilder is thenable — callers `await` it to get the
// resolved result. We mimic that with a Proxy so every chained method call
// tracks state and the final await resolves to { error: null }. Avoids
// defining a bare `then` method on an object (biome's noThenProperty rule).
function makeBuilder(table: string) {
  const current: CapturedUpdate = { table, set: {}, filters: [] };
  const result = Promise.resolve({ error: null });
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') return result.then.bind(result);
      if (prop === 'catch') return result.catch.bind(result);
      if (prop === 'finally') return result.finally.bind(result);
      if (prop === 'update') {
        return (set: Record<string, unknown>) => {
          current.set = set;
          captured.updates.push(current);
          return new Proxy({}, handler);
        };
      }
      if (prop === 'eq' || prop === 'neq') {
        return (column: string, value: unknown) => {
          current.filters.push({ op: prop as string, column, value });
          return new Proxy({}, handler);
        };
      }
      return undefined;
    },
  };
  return new Proxy({}, handler);
}

vi.mock('../supabaseClient.js', () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
    auth: {
      getUser: async () => ({
        data: captured.authUserId ? { user: { id: captured.authUserId } } : { user: null },
        error: null,
      }),
    },
  },
}));

import { markMessagesAsRead } from '../messages.js';

describe('markMessagesAsRead — dual write to messages + notifications', () => {
  beforeEach(() => {
    captured.updates = [];
    captured.authUserId = 'user-me';
  });

  it('updates BOTH messages and new_chat_message notifications in lockstep', async () => {
    await markMessagesAsRead('req-xyz');

    expect(captured.updates).toHaveLength(2);

    const messagesUpdate = captured.updates.find((u) => u.table === 'messages');
    expect(messagesUpdate).toBeDefined();
    expect(messagesUpdate!.set).toEqual({ read: true });
    expect(messagesUpdate!.filters).toContainEqual({
      op: 'eq',
      column: 'borrow_request_id',
      value: 'req-xyz',
    });
    expect(messagesUpdate!.filters).toContainEqual({
      op: 'neq',
      column: 'sender_id',
      value: 'user-me',
    });
    expect(messagesUpdate!.filters).toContainEqual({ op: 'eq', column: 'read', value: false });

    const notificationsUpdate = captured.updates.find((u) => u.table === 'notifications');
    expect(notificationsUpdate).toBeDefined();
    expect(notificationsUpdate!.set).toEqual({ read: true });
    expect(notificationsUpdate!.filters).toContainEqual({
      op: 'eq',
      column: 'user_id',
      value: 'user-me',
    });
    expect(notificationsUpdate!.filters).toContainEqual({
      op: 'eq',
      column: 'type',
      value: 'new_chat_message',
    });
    expect(notificationsUpdate!.filters).toContainEqual({
      op: 'eq',
      column: 'reference_id',
      value: 'req-xyz',
    });
  });

  it('throws when the user is not authenticated', async () => {
    captured.authUserId = null;
    await expect(markMessagesAsRead('req-xyz')).rejects.toThrow(/authenticated/);
    expect(captured.updates).toHaveLength(0);
  });
});
