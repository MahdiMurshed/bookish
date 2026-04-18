import type { BorrowRequest, MessageSender, MessageWithSender } from '@repo/api-client';
import { describe, expect, it } from 'vitest';

import { buildThreadTimeline } from '../threadTimeline';

const ME: MessageSender = {
  id: 'me',
  email: 'me@bookshare.io',
  display_name: 'Me',
  avatar_url: null,
};
const THEM: MessageSender = {
  id: 'them',
  email: 'them@bookshare.io',
  display_name: 'Them',
  avatar_url: null,
};

function request(overrides: Partial<BorrowRequest> = {}): BorrowRequest {
  return {
    id: 'req-1',
    book_id: 'book-1',
    requester_id: 'them',
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
    requested_at: '2026-04-10T09:00:00Z',
    responded_at: null,
    returned_at: null,
    ...overrides,
  };
}

function msg(overrides: Partial<MessageWithSender>): MessageWithSender {
  return {
    id: 'm',
    borrow_request_id: 'req-1',
    sender_id: 'them',
    content: '',
    read: false,
    created_at: '2026-04-10T09:05:00Z',
    sender: THEM,
    ...overrides,
  };
}

describe('buildThreadTimeline', () => {
  it('returns an empty list when there are no messages, no system events, and no opening note', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({ message: null }),
      messages: [],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });
    expect(out).toEqual([]);
  });

  it('renders the synthetic opening bubble from borrow_request.message', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({ message: 'Can I borrow this?', requester_id: 'them' }),
      messages: [],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const bubbles = out.filter((i) => i.kind === 'bubble');
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toMatchObject({
      content: 'Can I borrow this?',
      isMe: false,
      isSynthetic: true,
      senderId: 'them',
    });
  });

  it('places the synthetic opening bubble in chronological order with later messages', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({
        message: 'Hi!',
        requester_id: 'me',
        requested_at: '2026-04-10T09:00:00Z',
      }),
      messages: [
        msg({ id: 'm1', content: 'Ok!', sender_id: 'them', created_at: '2026-04-10T09:10:00Z' }),
      ],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const bubbles = out.filter((i) => i.kind === 'bubble');
    expect(bubbles.map((b) => ('content' in b ? b.content : ''))).toEqual(['Hi!', 'Ok!']);
    expect(bubbles[0]!.kind === 'bubble' && bubbles[0].isMe).toBe(true); // synthetic is from me
    expect(bubbles[1]!.kind === 'bubble' && bubbles[1].isMe).toBe(false);
  });

  it('marks showTimestamp on the last bubble in each sender run', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({ message: null }),
      messages: [
        msg({ id: 'm1', sender_id: 'me', content: 'Hey', created_at: '2026-04-10T09:00:00Z' }),
        msg({
          id: 'm2',
          sender_id: 'me',
          content: 'You there?',
          created_at: '2026-04-10T09:01:00Z',
        }),
        msg({ id: 'm3', sender_id: 'them', content: 'Yes', created_at: '2026-04-10T09:02:00Z' }),
        msg({ id: 'm4', sender_id: 'me', content: 'Cool', created_at: '2026-04-10T09:03:00Z' }),
      ],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const bubbles = out.filter((i) => i.kind === 'bubble');
    expect(bubbles).toHaveLength(4);
    // m1 → no timestamp (next is same sender), m2 → yes (next is different),
    // m3 → yes (next is different), m4 → yes (last overall).
    expect(bubbles.map((b) => ('showTimestamp' in b ? b.showTimestamp : null))).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });

  it('interleaves system events in chronological order', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({
        message: null,
        status: 'handed_over',
        responded_at: '2026-04-10T09:30:00Z',
        handover_date: '2026-04-11T14:00:00Z',
      }),
      messages: [
        msg({ id: 'm1', sender_id: 'me', content: 'Sure', created_at: '2026-04-10T09:40:00Z' }),
      ],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const kinds = out.map((i) => i.kind);
    // date_header for day 2026-04-10, approved event, date_header for day 2026-04-11, handed over...
    // actually: day1 header, approved event, bubble m1, day2 header, handed_over event
    expect(kinds).toEqual(['date_header', 'system_event', 'bubble', 'date_header', 'system_event']);
  });

  it('inserts a date header before the first entry and only when the day changes', () => {
    // Use noon UTC so day boundaries are unambiguous across timezones —
    // startOfDayKey uses local time to match how a user experiences "today".
    const out = buildThreadTimeline({
      borrowRequest: request({ message: null }),
      messages: [
        msg({ id: 'm1', created_at: '2026-04-10T12:00:00Z' }),
        msg({ id: 'm2', created_at: '2026-04-10T18:00:00Z' }),
        msg({ id: 'm3', created_at: '2026-04-12T12:00:00Z' }),
      ],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const headers = out.filter((i) => i.kind === 'date_header');
    expect(headers).toHaveLength(2);
  });

  it('attributes the synthetic bubble to me when I am the requester', () => {
    const out = buildThreadTimeline({
      borrowRequest: request({ message: 'Please?', requester_id: 'me' }),
      messages: [],
      currentUserId: 'me',
      counterparty: THEM,
      me: ME,
    });

    const bubble = out.find((i) => i.kind === 'bubble');
    expect(bubble && bubble.kind === 'bubble' && bubble.sender?.id).toBe('me');
    expect(bubble && bubble.kind === 'bubble' && bubble.isMe).toBe(true);
  });
});
