import { zodResolver } from '@hookform/resolvers/zod';
import type { SendMessageFormValues } from '@repo/shared';
import { sendMessageSchema } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Textarea } from '@repo/ui/components/textarea';
import { Send } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '@/contexts/AuthContext';
import {
  useMarkMessagesRead,
  useMessageSubscription,
  useMessages,
  useSendMessage,
} from '@/hooks/useMessages';

import { MessageBubble } from './MessageBubble';

interface ChatThreadProps {
  requestId: string;
}

export function ChatThread({ requestId }: ChatThreadProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, error } = useMessages(requestId);
  const sendMessageMutation = useSendMessage(requestId);
  const markRead = useMarkMessagesRead();
  useMessageSubscription(requestId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: '' },
  });

  // Mark thread as read when it mounts (or when we switch to a different request).
  // Using a ref avoids re-running the effect when the mutation object identity changes.
  const markReadRef = useRef(markRead.mutate);
  markReadRef.current = markRead.mutate;
  useEffect(() => {
    markReadRef.current(requestId);
  }, [requestId]);

  // Auto-scroll to bottom when messages arrive.
  const messageCount = messages?.length ?? 0;
  useEffect(() => {
    if (messageCount === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageCount]);

  const onSubmit = (data: SendMessageFormValues) => {
    sendMessageMutation.mutate(data.content, { onSuccess: () => reset() });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/30 px-4 py-2">
        <h3 className="text-sm font-medium">Messages</h3>
      </div>

      <div className="flex max-h-80 min-h-32 flex-col gap-3 overflow-y-auto px-4 py-4">
        {isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading messages...</p>
        )}

        {error && (
          <p className="py-6 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load messages'}
          </p>
        )}

        {!isLoading && !error && messages && messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages?.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.sender_id === user?.id}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-end gap-2 border-t bg-background px-4 py-3"
      >
        <div className="flex-1 space-y-1">
          <Textarea
            {...register('content')}
            placeholder="Type a message..."
            rows={2}
            maxLength={2000}
            disabled={sendMessageMutation.isPending}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />
          {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          {sendMessageMutation.error && (
            <p className="text-xs text-destructive">
              {sendMessageMutation.error instanceof Error
                ? sendMessageMutation.error.message
                : 'Failed to send message'}
            </p>
          )}
        </div>

        <Button type="submit" size="sm" disabled={sendMessageMutation.isPending}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
