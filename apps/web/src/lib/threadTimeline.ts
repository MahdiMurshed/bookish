// Merge the thread's message list, derived system events, and the synthetic
// opening bubble (from borrow_requests.message) into a chronologically-sorted
// timeline for rendering. Date headers are inserted between day boundaries.
// Sender-run grouping marks which bubbles show a trailing timestamp.

import type { BorrowRequest, MessageSender, MessageWithSender } from '@repo/api-client';

import { deriveSystemEvents, type ThreadSystemEvent } from './threadSystemEvents';

export type TimelineItem =
  | { kind: 'date_header'; id: string; date: string }
  | {
      kind: 'bubble';
      id: string;
      senderId: string;
      sender: MessageSender | null;
      content: string;
      createdAt: string;
      isMe: boolean;
      isSynthetic: boolean;
      showTimestamp: boolean;
    }
  | { kind: 'system_event'; id: string; label: string; at: string };

type Entry =
  | {
      kind: 'bubble';
      at: string;
      bubble: Omit<Extract<TimelineItem, { kind: 'bubble' }>, 'kind' | 'showTimestamp'>;
    }
  | { kind: 'system_event'; at: string; event: ThreadSystemEvent };

export interface BuildTimelineInput {
  borrowRequest: BorrowRequest;
  messages: MessageWithSender[];
  currentUserId: string;
  /** The opposite-party user, used as the sender when the synthetic opening bubble is from them. */
  counterparty: MessageSender;
  /** Current user's own display metadata for rendering their own synthetic bubble. */
  me: MessageSender | null;
}

export function buildThreadTimeline(input: BuildTimelineInput): TimelineItem[] {
  const { borrowRequest, messages, currentUserId, counterparty, me } = input;
  const entries: Entry[] = [];

  // Synthetic first bubble — the original "Can I borrow this?" text lives in
  // borrow_requests.message, not in the messages table. Render it at the
  // same vertical position as the request was created.
  if (borrowRequest.message && borrowRequest.message.trim()) {
    const amRequester = borrowRequest.requester_id === currentUserId;
    entries.push({
      kind: 'bubble',
      at: borrowRequest.requested_at,
      bubble: {
        id: `synthetic-${borrowRequest.id}`,
        senderId: borrowRequest.requester_id,
        sender: amRequester ? me : counterparty,
        content: borrowRequest.message,
        createdAt: borrowRequest.requested_at,
        isMe: amRequester,
        isSynthetic: true,
      },
    });
  }

  for (const m of messages) {
    entries.push({
      kind: 'bubble',
      at: m.created_at,
      bubble: {
        id: m.id,
        senderId: m.sender_id,
        sender: m.sender ?? null,
        content: m.content,
        createdAt: m.created_at,
        isMe: m.sender_id === currentUserId,
        isSynthetic: false,
      },
    });
  }

  for (const e of deriveSystemEvents(borrowRequest)) {
    entries.push({ kind: 'system_event', at: e.at, event: e });
  }

  entries.sort((a, b) => a.at.localeCompare(b.at));

  // Walk the sorted list, inserting date headers on day boundaries and
  // marking the last bubble in each sender-run as showing its timestamp.
  const out: TimelineItem[] = [];
  let lastDay = '';

  // Precompute showTimestamp by walking ahead: a bubble shows its timestamp
  // when the *next* entry is NOT a bubble from the same sender.
  const showTimestampFor: boolean[] = new Array(entries.length);
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i]!;
    if (current.kind !== 'bubble') {
      showTimestampFor[i] = false;
      continue;
    }
    const next = entries[i + 1];
    if (!next || next.kind !== 'bubble' || next.bubble.senderId !== current.bubble.senderId) {
      showTimestampFor[i] = true;
    } else {
      showTimestampFor[i] = false;
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const day = startOfDayKey(entry.at);
    if (day !== lastDay) {
      out.push({ kind: 'date_header', id: `date-${day}`, date: entry.at });
      lastDay = day;
    }

    if (entry.kind === 'bubble') {
      out.push({
        kind: 'bubble',
        ...entry.bubble,
        showTimestamp: showTimestampFor[i] ?? true,
      });
    } else {
      out.push({
        kind: 'system_event',
        id: entry.event.id,
        label: entry.event.label,
        at: entry.event.at,
      });
    }
  }

  return out;
}

function startOfDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
