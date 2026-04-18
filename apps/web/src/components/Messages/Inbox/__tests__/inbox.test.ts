import type { BorrowRequestStatus, Thread } from '@repo/api-client';
import { describe, expect, it } from 'vitest';

import { filterThreads } from '../InboxList';
import { statusBadgeFor } from '../statusBadge';

function mkThread(partial: {
  id: string;
  counterparty: string;
  email?: string;
  title: string;
  status?: BorrowRequestStatus;
}): Thread {
  return {
    borrow_request: {
      id: partial.id,
      book_id: 'book-1',
      requester_id: 'req-1',
      status: partial.status ?? 'pending',
      message: null,
      response_message: null,
      due_date: null,
      handover_method: null,
      handover_location: null,
      handover_date: null,
      handover_notes: null,
      return_method: null,
      return_location: null,
      return_notes: null,
      requested_at: '2026-04-10T10:00:00Z',
      responded_at: null,
      returned_at: null,
    },
    book: {
      id: 'book-1',
      owner_id: 'user-them',
      title: partial.title,
      author: 'Author',
      cover_url: null,
    },
    counterparty: {
      id: 'user-them',
      email: partial.email ?? `${partial.counterparty.toLowerCase()}@bookshare.io`,
      display_name: partial.counterparty,
      avatar_url: null,
    },
    last_message: null,
    unread_count: 0,
    last_activity_at: '2026-04-10T10:00:00Z',
  };
}

describe('filterThreads', () => {
  const threads: Thread[] = [
    mkThread({ id: 't1', counterparty: 'Rhea', title: 'Piranesi' }),
    mkThread({ id: 't2', counterparty: 'Sam', title: 'The Overstory' }),
    mkThread({ id: 't3', counterparty: 'Maya', title: 'Braiding Sweetgrass' }),
  ];

  it('returns all threads when query is empty or whitespace', () => {
    expect(filterThreads(threads, '').length).toBe(3);
    expect(filterThreads(threads, '   ').length).toBe(3);
  });

  it('matches counterparty name case-insensitively', () => {
    expect(filterThreads(threads, 'rhea').map((t) => t.borrow_request.id)).toEqual(['t1']);
    expect(filterThreads(threads, 'SAM').map((t) => t.borrow_request.id)).toEqual(['t2']);
  });

  it('matches book title case-insensitively', () => {
    expect(filterThreads(threads, 'sweet').map((t) => t.borrow_request.id)).toEqual(['t3']);
    expect(filterThreads(threads, 'PIRANESI').map((t) => t.borrow_request.id)).toEqual(['t1']);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterThreads(threads, 'gatsby')).toEqual([]);
  });

  it('falls back to email when display_name is missing', () => {
    const withoutName = mkThread({
      id: 't4',
      counterparty: 'Leo',
      email: 'leo@bookshare.io',
      title: 'Book',
    });
    withoutName.counterparty.display_name = null;
    expect(filterThreads([withoutName], 'leo@').length).toBe(1);
  });
});

describe('statusBadgeFor', () => {
  it('maps each status to a label + variant', () => {
    expect(statusBadgeFor('pending')).toEqual({ label: 'Pending', variant: 'outline' });
    expect(statusBadgeFor('approved')).toEqual({ label: 'Approved', variant: 'default' });
    expect(statusBadgeFor('handed_over')).toEqual({ label: 'Handed Over', variant: 'secondary' });
    expect(statusBadgeFor('returned')).toEqual({ label: 'Returned', variant: 'secondary' });
    expect(statusBadgeFor('denied')).toEqual({ label: 'Denied', variant: 'destructive' });
    expect(statusBadgeFor('cancelled')).toEqual({ label: 'Cancelled', variant: 'secondary' });
  });
});
