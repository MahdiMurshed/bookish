import { describe, expect, it } from 'vitest';

import { projectThread, type ThreadRow } from '../messages.js';
import type { BorrowRequest, MessageSender } from '../types.js';

const ME = 'user-me';
const THEM = 'user-them';

const meSender: MessageSender = {
  id: ME,
  email: 'me@bookshare.io',
  display_name: 'Me',
  avatar_url: null,
};
const themSender: MessageSender = {
  id: THEM,
  email: 'them@bookshare.io',
  display_name: 'Them',
  avatar_url: null,
};

function baseRequest(overrides: Partial<BorrowRequest> = {}): BorrowRequest {
  return {
    id: 'req-1',
    book_id: 'book-1',
    requester_id: ME,
    status: 'pending',
    message: 'Hello',
    response_message: null,
    due_date: null,
    handover_method: null,
    handover_location: null,
    handover_date: null,
    handover_notes: null,
    return_method: null,
    return_location: null,
    return_notes: null,
    requested_at: '2026-04-15T10:00:00Z',
    responded_at: null,
    returned_at: null,
    ...overrides,
  };
}

function baseRow(overrides: Partial<ThreadRow> = {}): ThreadRow {
  return {
    ...baseRequest(),
    book: {
      id: 'book-1',
      owner_id: THEM,
      title: 'Piranesi',
      author: 'Susanna Clarke',
      cover_url: null,
      owner: themSender,
    },
    requester: meSender,
    messages: [],
    ...overrides,
  };
}

describe('projectThread', () => {
  it('picks the last message by created_at (desc) and keeps full messages for aggregation', () => {
    const row = baseRow({
      messages: [
        {
          id: 'm1',
          sender_id: THEM,
          content: 'Hi',
          read: true,
          created_at: '2026-04-15T10:00:00Z',
        },
        {
          id: 'm2',
          sender_id: ME,
          content: 'Hey',
          read: true,
          created_at: '2026-04-15T10:05:00Z',
        },
        {
          id: 'm3',
          sender_id: THEM,
          content: 'Sure',
          read: false,
          created_at: '2026-04-15T10:10:00Z',
        },
      ],
    });

    const thread = projectThread(row, ME);

    expect(thread.last_message?.id).toBe('m3');
    expect(thread.last_activity_at).toBe('2026-04-15T10:10:00Z');
  });

  it('counts only unread messages sent by the other party', () => {
    const row = baseRow({
      messages: [
        // I sent this, unread by them. Does NOT count for me.
        {
          id: 'm1',
          sender_id: ME,
          content: 'Hi',
          read: false,
          created_at: '2026-04-15T10:00:00Z',
        },
        // They sent, unread — counts.
        {
          id: 'm2',
          sender_id: THEM,
          content: 'Yo',
          read: false,
          created_at: '2026-04-15T10:01:00Z',
        },
        // They sent, already read — does NOT count.
        {
          id: 'm3',
          sender_id: THEM,
          content: 'Later',
          read: true,
          created_at: '2026-04-15T10:02:00Z',
        },
      ],
    });

    expect(projectThread(row, ME).unread_count).toBe(1);
  });

  it('resolves counterparty = book owner when I am the requester', () => {
    const row = baseRow({ requester_id: ME });
    const thread = projectThread(row, ME);
    expect(thread.counterparty.id).toBe(THEM);
  });

  it('resolves counterparty = requester when I am the book owner', () => {
    const row = baseRow({
      requester_id: THEM,
      requester: themSender,
      book: { ...baseRow().book, owner_id: ME, owner: meSender },
    });
    const thread = projectThread(row, ME);
    expect(thread.counterparty.id).toBe(THEM);
  });

  it('falls back to requested_at for last_activity_at when no messages exist', () => {
    const row = baseRow({
      requested_at: '2026-04-10T08:00:00Z',
      messages: [],
    });
    expect(projectThread(row, ME).last_activity_at).toBe('2026-04-10T08:00:00Z');
    expect(projectThread(row, ME).last_message).toBeNull();
    expect(projectThread(row, ME).unread_count).toBe(0);
  });

  it('projects borrow_request without the embedded relational fields', () => {
    const row = baseRow();
    const thread = projectThread(row, ME);
    // book, requester, messages must NOT be inside borrow_request
    expect(thread.borrow_request).not.toHaveProperty('book');
    expect(thread.borrow_request).not.toHaveProperty('requester');
    expect(thread.borrow_request).not.toHaveProperty('messages');
    expect(thread.borrow_request.id).toBe('req-1');
  });

  it('projects book without its embedded owner field', () => {
    const row = baseRow();
    const thread = projectThread(row, ME);
    expect(thread.book).not.toHaveProperty('owner');
    expect(thread.book.owner_id).toBe(THEM);
  });
});
