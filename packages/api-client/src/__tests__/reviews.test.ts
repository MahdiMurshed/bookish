import { createReviewSchema, reviewFormSchema } from '@repo/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface CapturedInsert {
  table: string;
  values: Record<string, unknown>;
}

const captured: {
  insert: CapturedInsert | null;
  authUserId: string | null;
  insertError: { message: string } | null;
} = {
  insert: null,
  authUserId: 'user-me',
  insertError: null,
};

// Same builder pattern as markMessagesAsRead.test.ts: a Proxy that records
// chained calls and resolves to the captured shape on `single()`.
function makeBuilder(table: string) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'insert') {
        return (values: Record<string, unknown>) => {
          captured.insert = { table, values };
          return new Proxy({}, handler);
        };
      }
      if (prop === 'select') {
        return () => new Proxy({}, handler);
      }
      if (prop === 'single') {
        return async () => {
          if (captured.insertError) {
            return { data: null, error: captured.insertError };
          }
          return {
            data: {
              id: 'review-1',
              ...(captured.insert?.values ?? {}),
              created_at: '2026-04-25T10:00:00Z',
            },
            error: null,
          };
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

import { createReview } from '../reviews.js';

describe('createReview', () => {
  beforeEach(() => {
    captured.insert = null;
    captured.authUserId = 'user-me';
    captured.insertError = null;
  });

  it('inserts the review with reviewer_id pulled from auth, not the input', async () => {
    const review = await createReview({
      book_id: 'book-1',
      borrow_request_id: 'req-1',
      rating: 5,
      content: 'Great read.',
    });

    expect(captured.insert).not.toBeNull();
    expect(captured.insert!.table).toBe('reviews');
    expect(captured.insert!.values).toEqual({
      book_id: 'book-1',
      reviewer_id: 'user-me',
      borrow_request_id: 'req-1',
      rating: 5,
      content: 'Great read.',
    });
    expect(review.id).toBe('review-1');
  });

  it('trims whitespace-only content to null', async () => {
    await createReview({
      book_id: 'book-1',
      borrow_request_id: 'req-1',
      rating: 4,
      content: '   ',
    });
    expect(captured.insert!.values.content).toBeNull();
  });

  it('coerces missing content to null', async () => {
    await createReview({
      book_id: 'book-1',
      borrow_request_id: 'req-1',
      rating: 3,
    });
    expect(captured.insert!.values.content).toBeNull();
  });

  it('throws when the user is not authenticated', async () => {
    captured.authUserId = null;
    await expect(createReview({ book_id: 'b', borrow_request_id: 'r', rating: 4 })).rejects.toThrow(
      /authenticated/,
    );
    expect(captured.insert).toBeNull();
  });

  it('surfaces supabase errors (eg RLS denial) to the caller', async () => {
    captured.insertError = {
      message: 'new row violates row-level security policy for table "reviews"',
    };
    await expect(
      createReview({ book_id: 'b', borrow_request_id: 'r', rating: 4 }),
    ).rejects.toMatchObject({ message: expect.stringContaining('row-level security') });
  });
});

describe('createReviewSchema', () => {
  // zod 4's uuid() enforces version + variant nibbles, so the UUIDs here use
  // the conventional 4xxx (version) / 8xxx (variant) groups.
  const valid = {
    book_id: '11111111-1111-4111-8111-111111111111',
    borrow_request_id: '22222222-2222-4222-8222-222222222222',
    rating: 4,
    content: 'Loved it.',
  };

  it('accepts a well-formed payload', () => {
    expect(() => createReviewSchema.parse(valid)).not.toThrow();
  });

  it('accepts empty content (optional)', () => {
    expect(() => createReviewSchema.parse({ ...valid, content: '' })).not.toThrow();
  });

  it('rejects ratings outside 1–5', () => {
    expect(() => createReviewSchema.parse({ ...valid, rating: 0 })).toThrow();
    expect(() => createReviewSchema.parse({ ...valid, rating: 6 })).toThrow();
    expect(() => createReviewSchema.parse({ ...valid, rating: 3.5 })).toThrow();
  });

  it('rejects non-uuid book_id / borrow_request_id', () => {
    expect(() => createReviewSchema.parse({ ...valid, book_id: 'not-a-uuid' })).toThrow();
    expect(() => createReviewSchema.parse({ ...valid, borrow_request_id: 'not-a-uuid' })).toThrow();
  });

  it('rejects content over 1000 chars', () => {
    expect(() => createReviewSchema.parse({ ...valid, content: 'x'.repeat(1001) })).toThrow();
  });
});

describe('reviewFormSchema', () => {
  it('omits book_id and borrow_request_id (those come from page context)', () => {
    expect(() => reviewFormSchema.parse({ rating: 4, content: '' })).not.toThrow();
    expect(() => reviewFormSchema.parse({ rating: 4 })).not.toThrow();
  });

  it('still enforces the rating range', () => {
    expect(() => reviewFormSchema.parse({ rating: 0 })).toThrow();
    expect(() => reviewFormSchema.parse({ rating: 6 })).toThrow();
  });
});
