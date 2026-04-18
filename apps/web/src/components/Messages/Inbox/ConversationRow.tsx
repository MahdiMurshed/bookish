import type { Thread } from '@repo/api-client';
import { Badge } from '@repo/ui/components/badge';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen } from 'lucide-react';

import { initialsFor, paletteFor } from '@/lib/avatarPalette';

import { statusBadgeFor } from './statusBadge';

interface ConversationRowProps {
  thread: Thread;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

// Single row in the inbox. Unread state tints the background with a whisper
// of primary; active (selected) row uses the accent token. Keep the tinted
// backgrounds as inline style since Tailwind v4 won't jit color-mix() strings.
export function ConversationRow({
  thread,
  currentUserId,
  isActive,
  onClick,
}: ConversationRowProps) {
  const { counterparty, book, unread_count, last_activity_at, borrow_request } = thread;
  const isUnread = unread_count > 0;
  const status = statusBadgeFor(borrow_request.status);

  const palette = paletteFor(book.id);
  const initials = initialsFor(counterparty.display_name, counterparty.email);

  const previewText = formatPreview(thread, currentUserId);
  const relativeTime = formatDistanceToNow(new Date(last_activity_at), { addSuffix: false });

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive || undefined}
      data-unread={isUnread || undefined}
      className="group flex w-full items-start gap-3 border-b px-3.5 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active]:bg-accent"
      style={
        isUnread
          ? {
              background: isActive
                ? 'color-mix(in oklch, var(--primary) 6%, var(--background))'
                : 'color-mix(in oklch, var(--primary) 3%, var(--background))',
            }
          : undefined
      }
    >
      <div className="relative flex-shrink-0">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-[13px]"
          style={{ background: palette.bg, color: palette.fg }}
        >
          {initials}
        </div>
        {isUnread && (
          <span
            role="status"
            aria-label={`${unread_count} unread`}
            className="absolute top-0 right-0 block h-[9px] w-[9px] rounded-full bg-[var(--availability)] ring-2 ring-background"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium'}`}
          >
            {counterparty.display_name ?? counterparty.email}
          </span>
          <span className="flex-shrink-0 text-[11px] text-muted-foreground">{relativeTime}</span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <BookOpen className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{book.title}</span>
        </div>

        <p
          className={`truncate text-[13px] ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {previewText}
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          <Badge variant={status.variant} className="h-5 px-1.5 text-[10px]">
            {status.label}
          </Badge>
          {isUnread && (
            <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">{unread_count}</Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function formatPreview(thread: Thread, currentUserId: string): string {
  const { last_message, borrow_request } = thread;

  if (last_message) {
    const prefix = last_message.sender_id === currentUserId ? 'You: ' : '';
    return `${prefix}${last_message.content}`;
  }

  // Empty thread — fall back to the opening borrow-request message if any,
  // else a neutral placeholder. Pending requests without a note land here.
  if (borrow_request.message) {
    const prefix = borrow_request.requester_id === currentUserId ? 'You: ' : '';
    return `${prefix}${borrow_request.message}`;
  }

  return 'No messages yet.';
}
