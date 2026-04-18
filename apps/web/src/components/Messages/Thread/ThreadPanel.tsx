import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMarkMessagesRead, useMessageSubscription, useMessages } from '@/hooks/useMessages';
import { useThread } from '@/hooks/useThreads';

import { EmptyThread } from './EmptyThread';
import { MessagesList } from './MessagesList';
import { ThreadHeader } from './ThreadHeader';

interface ThreadPanelProps {
  threadId: string | undefined;
}

export function ThreadPanel({ threadId }: ThreadPanelProps) {
  const { user } = useAuth();
  const { data: thread, isLoading: threadLoading, error: threadError } = useThread(threadId);
  const { data: messages, isLoading: messagesLoading } = useMessages(threadId);
  useMessageSubscription(threadId);
  const markRead = useMarkMessagesRead();

  // Fire once per thread open — no-op on server if everything is already read.
  const markReadRef = useRef(markRead.mutate);
  markReadRef.current = markRead.mutate;
  useEffect(() => {
    if (threadId) markReadRef.current(threadId);
  }, [threadId]);

  if (!threadId) return <EmptyThread />;
  if (!user) return null;

  if (threadLoading || messagesLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground text-sm">
        Loading conversation…
      </div>
    );
  }

  if (threadError || !thread) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-destructive text-sm">
        Could not load this conversation.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ThreadHeader thread={thread} currentUserId={user.id} />
      <MessagesList thread={thread} messages={messages ?? []} currentUser={user} />
    </div>
  );
}
