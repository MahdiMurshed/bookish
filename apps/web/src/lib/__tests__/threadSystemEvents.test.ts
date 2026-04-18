import type { BorrowRequest } from '@repo/api-client';
import { describe, expect, it } from 'vitest';

import { deriveSystemEvents } from '../threadSystemEvents';

function request(overrides: Partial<BorrowRequest> = {}): BorrowRequest {
  return {
    id: 'req-1',
    book_id: 'book-1',
    requester_id: 'user-1',
    status: 'pending',
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
    ...overrides,
  };
}

describe('deriveSystemEvents', () => {
  it('produces no events when status is pending', () => {
    expect(deriveSystemEvents(request({ status: 'pending' }))).toEqual([]);
  });

  it('produces an Approved event when responded_at is set and status is approved', () => {
    const events = deriveSystemEvents(
      request({ status: 'approved', responded_at: '2026-04-11T09:00:00Z' }),
    );
    expect(events).toHaveLength(1);
    expect(events[0]!.label).toBe('Status changed to Approved');
    expect(events[0]!.at).toBe('2026-04-11T09:00:00Z');
  });

  it('produces a Denied event when status is denied', () => {
    const events = deriveSystemEvents(
      request({ status: 'denied', responded_at: '2026-04-11T09:00:00Z' }),
    );
    expect(events[0]!.label).toBe('Status changed to Denied');
  });

  it('produces three events for a full lifecycle up to returned', () => {
    const events = deriveSystemEvents(
      request({
        status: 'returned',
        responded_at: '2026-04-11T09:00:00Z',
        handover_date: '2026-04-12T14:00:00Z',
        returned_at: '2026-04-25T18:00:00Z',
      }),
    );
    expect(events.map((e) => e.label)).toEqual([
      'Status changed to Approved',
      'Status changed to Handed Over',
      'Status changed to Returned',
    ]);
  });

  it('sorts events chronologically even when timestamps are out of field order', () => {
    const events = deriveSystemEvents(
      request({
        status: 'returned',
        returned_at: '2026-04-25T18:00:00Z',
        responded_at: '2026-04-11T09:00:00Z',
        handover_date: '2026-04-12T14:00:00Z',
      }),
    );
    const timestamps = events.map((e) => e.at);
    expect(timestamps).toEqual([...timestamps].sort());
  });
});
