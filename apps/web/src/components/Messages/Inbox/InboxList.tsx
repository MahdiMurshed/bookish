import type { Thread } from '@repo/api-client';
import { Badge } from '@repo/ui/components/badge';
import { Input } from '@repo/ui/components/input';
import { Inbox as InboxIcon, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';

import { ConversationRow } from './ConversationRow';

interface InboxListProps {
  activeThreadId?: string;
}

export function InboxList({ activeThreadId }: InboxListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: threads, isLoading, error } = useThreads();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterThreads(threads ?? [], query), [threads, query]);

  const unreadTotal = useMemo(
    () => (threads ?? []).reduce((acc, t) => acc + t.unread_count, 0),
    [threads],
  );

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header block */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <InboxIcon className="h-[18px] w-[18px]" />
          <span className="font-semibold text-[18px]">Inbox</span>
          {unreadTotal > 0 && (
            <Badge className="ml-auto h-4 min-w-4 px-1 text-[10px]">{unreadTotal}</Badge>
          )}
        </div>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {threads ? (
            <>
              {threads.length} {threads.length === 1 ? 'conversation' : 'conversations'} ·{' '}
              {unreadTotal} unread
            </>
          ) : (
            'Loading…'
          )}
        </p>
      </div>

      {/* Search block */}
      <div className="border-b px-3 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people or books…"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="p-6 text-center text-muted-foreground text-sm">Loading conversations…</p>
        )}
        {error && (
          <p className="p-6 text-center text-destructive text-sm">
            Could not load conversations. Please refresh the page.
          </p>
        )}
        {!isLoading && !error && threads && threads.length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">
            No conversations yet. When someone requests to borrow your book, the chat will appear
            here.
          </p>
        )}
        {!isLoading && !error && threads && threads.length > 0 && filtered.length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">
            No conversations match &ldquo;{query}&rdquo;.
          </p>
        )}
        {filtered.map((thread) => (
          <ConversationRow
            key={thread.borrow_request.id}
            thread={thread}
            currentUserId={user.id}
            isActive={thread.borrow_request.id === activeThreadId}
            onClick={() => navigate(`/messages/${thread.borrow_request.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export function filterThreads(threads: Thread[], query: string): Thread[] {
  const q = query.trim().toLowerCase();
  if (!q) return threads;

  return threads.filter((t) => {
    const name = (t.counterparty.display_name ?? t.counterparty.email).toLowerCase();
    const title = t.book.title.toLowerCase();
    return name.includes(q) || title.includes(q);
  });
}
