import { Inbox } from 'lucide-react';

export function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Select a conversation to start reading.</p>
      <p className="text-[11px] text-muted-foreground">
        All your borrow-request chats, in one place.
      </p>
    </div>
  );
}
