import { format } from 'date-fns';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMe: boolean;
  showTimestamp: boolean;
}

export function MessageBubble({ content, createdAt, isMe, showTimestamp }: MessageBubbleProps) {
  const timestamp = showTimestamp ? format(new Date(createdAt), 'h:mm a') : null;

  return (
    <div
      className={`flex max-w-[75%] flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
    >
      <div
        className={`whitespace-pre-wrap px-3 py-2 text-sm leading-[1.4] ${
          isMe
            ? 'rounded-[14px] rounded-tr-[4px] bg-primary text-primary-foreground'
            : 'rounded-[14px] rounded-tl-[4px] bg-secondary text-secondary-foreground'
        }`}
      >
        {content}
      </div>
      {timestamp && (
        <span className="mt-0.5 px-3 text-[10px] text-muted-foreground">{timestamp}</span>
      )}
    </div>
  );
}
