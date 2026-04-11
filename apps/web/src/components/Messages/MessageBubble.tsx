import type { MessageWithSender } from '@repo/api-client';
import { cn } from '@repo/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const senderName = message.sender?.display_name || message.sender?.email || 'Unknown';
  const timestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        'flex max-w-[75%] flex-col gap-1 sm:max-w-[70%]',
        isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start',
      )}
    >
      {!isCurrentUser && (
        <span className="px-1 text-xs font-medium text-muted-foreground">{senderName}</span>
      )}

      <div
        className={cn(
          'break-words rounded-2xl px-4 py-2.5',
          isCurrentUser
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
      </div>

      <span className="px-1 text-xs text-muted-foreground">{timestamp}</span>
    </div>
  );
}
