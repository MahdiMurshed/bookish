import type { Thread } from '@repo/api-client';
import { Badge } from '@repo/ui/components/badge';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { paletteFor } from '@/lib/avatarPalette';

import { statusBadgeFor } from '../Inbox/statusBadge';

interface ThreadHeaderProps {
  thread: Thread;
  currentUserId: string;
}

export function ThreadHeader({ thread, currentUserId }: ThreadHeaderProps) {
  const { book, counterparty, borrow_request } = thread;
  const status = statusBadgeFor(borrow_request.status);
  const palette = paletteFor(book.id);

  const amRequester = borrow_request.requester_id === currentUserId;
  const subLabel = amRequester ? 'Borrowing:' : 'Lending:';

  return (
    <div className="flex items-center gap-3 border-b bg-card px-5 py-3.5">
      {/* Mini book cover — real cover if present, BookOpen fallback on tinted palette. */}
      <div
        className="flex h-12 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-[4px]"
        style={{ background: palette.bg, color: palette.fg }}
      >
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-4 w-4 opacity-80" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[15px]">
          {counterparty.display_name ?? counterparty.email}
        </p>
        <p className="truncate text-muted-foreground text-xs">
          {subLabel}{' '}
          <Link
            to={`/books/${book.id}`}
            className="text-primary underline-offset-2 hover:underline dark:text-foreground dark:underline"
          >
            {book.title}
          </Link>
        </p>
      </div>

      <Badge variant={status.variant} className="h-5 px-2 text-[10px]">
        {status.label}
      </Badge>
    </div>
  );
}
