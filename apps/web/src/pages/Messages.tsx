import { useParams } from 'react-router-dom';

import { InboxList } from '@/components/Messages/Inbox/InboxList';
import { ThreadPanel } from '@/components/Messages/Thread/ThreadPanel';

// Two-column on ≥768px. Below that, the two columns stack and exactly one
// is visible at a time: inbox when no thread is selected, thread when one
// is. The ThreadHeader renders a back-arrow on mobile that navigates back
// to /messages (clearing the threadId).
export default function Messages() {
  const { threadId } = useParams<{ threadId?: string }>();
  const hasThread = !!threadId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Read and reply to borrow-request conversations — all in one place.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 overflow-hidden rounded-lg border bg-background md:grid-cols-[360px_1fr]">
        <aside
          className={`h-[calc(100vh-14rem)] md:border-r md:border-b-0 ${
            hasThread ? 'hidden md:block' : 'block border-b'
          }`}
        >
          <InboxList activeThreadId={threadId} />
        </aside>

        <section className={`h-[calc(100vh-14rem)] ${hasThread ? 'block' : 'hidden md:block'}`}>
          <ThreadPanel threadId={threadId} />
        </section>
      </div>
    </div>
  );
}
