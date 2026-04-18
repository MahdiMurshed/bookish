import { useParams } from 'react-router-dom';

import { InboxList } from '@/components/Messages/Inbox/InboxList';

// Two-column messages surface. Left: inbox (fixed 360px). Right: thread or
// empty state. Wrapped by the app's standard container in App.tsx.
// Thread content lands in Phase D.
export default function Messages() {
  const { threadId } = useParams<{ threadId?: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Read and reply to borrow-request conversations — all in one place.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 overflow-hidden rounded-lg border bg-background md:grid-cols-[360px_1fr]">
        <aside className="h-[calc(100vh-14rem)] border-b md:border-r md:border-b-0">
          <InboxList activeThreadId={threadId} />
        </aside>

        <section className="hidden h-[calc(100vh-14rem)] md:block">
          <div className="flex h-full items-center justify-center p-8 text-muted-foreground text-sm">
            {threadId ? `Thread ${threadId} (Phase D)` : 'Select a conversation to start reading.'}
          </div>
        </section>
      </div>
    </div>
  );
}
