import type { Thread } from '@repo/api-client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { initialsFor, paletteFor } from '@/lib/avatarPalette';

interface NewMessageToastProps {
  toastId: string | number;
  thread: Thread;
  onClick: () => void;
}

export function NewMessageToast({ toastId, thread, onClick }: NewMessageToastProps) {
  const { counterparty, book, last_message } = thread;
  const palette = paletteFor(book.id);
  const initials = initialsFor(counterparty.display_name, counterparty.email);
  const name = counterparty.display_name ?? counterparty.email;
  const preview = last_message?.content ?? book.title;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[340px] items-start gap-2.5 rounded-[var(--radius-lg)] border bg-card p-3.5 text-left shadow-[var(--shadow-md)] transition-shadow hover:shadow-[0_8px_20px_rgb(0_0_0/0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        aria-hidden="true"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-semibold text-[13px]"
        style={{ background: palette.bg, color: palette.fg }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[13px]">New message from {name}</p>
        <p className="truncate text-muted-foreground text-xs">{preview}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          toast.dismiss(toastId);
        }}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </button>
  );
}
