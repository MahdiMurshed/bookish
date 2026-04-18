import type { AuthUser, MessageWithSender, Thread } from '@repo/api-client';
import { format, isToday, isYesterday } from 'date-fns';
import { useEffect, useRef } from 'react';

import { buildThreadTimeline, type TimelineItem } from '@/lib/threadTimeline';

import { MessageBubble } from './MessageBubble';
import { SystemEvent } from './SystemEvent';

interface MessagesListProps {
  thread: Thread;
  messages: MessageWithSender[];
  currentUser: AuthUser;
}

export function MessagesList({ thread, messages, currentUser }: MessagesListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const timeline = buildThreadTimeline({
    borrowRequest: thread.borrow_request,
    messages,
    currentUserId: currentUser.id,
    counterparty: thread.counterparty,
    me: {
      id: currentUser.id,
      email: currentUser.email ?? '',
      display_name:
        (currentUser.user_metadata?.display_name as string | undefined) ??
        (currentUser.user_metadata?.name as string | undefined) ??
        null,
      avatar_url: (currentUser.user_metadata?.avatar_url as string | undefined) ?? null,
    },
  });

  // Auto-scroll to the bottom when messages or system events arrive. Using
  // `timeline.length` as the trigger covers new incoming messages + new
  // status events without re-running when the thread id is stable.
  useEffect(() => {
    if (timeline.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [timeline.length]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="flex flex-col gap-3">
        {timeline.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No messages yet. Start the conversation.
          </p>
        )}
        {timeline.map((item) => renderItem(item))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function renderItem(item: TimelineItem) {
  switch (item.kind) {
    case 'date_header':
      return <DateHeader key={item.id} date={item.date} />;
    case 'system_event':
      return <SystemEvent key={item.id} label={item.label} at={item.at} />;
    case 'bubble':
      return (
        <MessageBubble
          key={item.id}
          content={item.content}
          createdAt={item.createdAt}
          isMe={item.isMe}
          showTimestamp={item.showTimestamp}
        />
      );
  }
}

function DateHeader({ date }: { date: string }) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  else label = format(d, 'EEEE, MMM d');

  return (
    <div className="flex justify-center py-1">
      <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.04em]">
        {label}
      </span>
    </div>
  );
}
