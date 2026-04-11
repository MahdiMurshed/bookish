import type { BorrowRequestWithDetails } from '@repo/api-client';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { BookOpen, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ChatThread } from '@/components/Messages/ChatThread';

import { RequestActions } from './RequestActions';

interface BorrowRequestCardProps {
  request: BorrowRequestWithDetails;
  role: 'owner' | 'requester';
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  handed_over: 'secondary',
  returned: 'secondary',
  denied: 'destructive',
  cancelled: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  handed_over: 'Handed Over',
  returned: 'Returned',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

const CHAT_ENABLED_STATUSES = new Set(['pending', 'approved', 'handed_over']);

export function BorrowRequestCard({ request, role }: BorrowRequestCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const book = request.book;
  const requester = request.requester;
  const canChat = CHAT_ENABLED_STATUSES.has(request.status);

  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex gap-4">
        {/* Book thumbnail */}
        <Link to={`/books/${book.id}`} className="shrink-0">
          <div className="h-20 w-14 overflow-hidden rounded bg-muted">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/books/${book.id}`} className="font-medium hover:text-primary">
                {book.title}
              </Link>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>
            <Badge variant={STATUS_VARIANT[request.status] || 'outline'}>
              {STATUS_LABELS[request.status] || request.status}
            </Badge>
          </div>

          {role === 'owner' && (
            <p className="text-sm text-muted-foreground">
              Requested by {requester.display_name || requester.email}
            </p>
          )}

          {request.message && (
            <p className="text-sm italic text-muted-foreground">&ldquo;{request.message}&rdquo;</p>
          )}

          {request.response_message && (
            <p className="text-sm text-muted-foreground">
              Response: &ldquo;{request.response_message}&rdquo;
            </p>
          )}

          {request.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(request.due_date).toLocaleDateString()}
            </p>
          )}

          <div className="text-xs text-muted-foreground">
            {new Date(request.requested_at).toLocaleDateString()}
          </div>

          <RequestActions requestId={request.id} status={request.status} role={role} />

          {canChat && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChatOpen((open) => !open)}
              aria-expanded={chatOpen}
              aria-controls={`chat-thread-${request.id}`}
            >
              <MessageSquare className="h-4 w-4" />
              {chatOpen ? 'Hide chat' : 'Open chat'}
            </Button>
          )}
        </div>
      </div>

      {canChat && chatOpen && (
        <div id={`chat-thread-${request.id}`} className="mt-4">
          <ChatThread requestId={request.id} />
        </div>
      )}
    </div>
  );
}
