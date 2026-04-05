import type { BorrowRequestWithDetails } from '@repo/api-client';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { RequestActions } from './RequestActions';

interface BorrowRequestCardProps {
  request: BorrowRequestWithDetails;
  role: 'owner' | 'requester';
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  handed_over: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  returned: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  handed_over: 'Handed Over',
  returned: 'Returned',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

export function BorrowRequestCard({ request, role }: BorrowRequestCardProps) {
  const book = request.book;
  const requester = request.requester;

  return (
    <div className="rounded-lg border bg-card p-4">
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
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status] || 'bg-muted'}`}
            >
              {STATUS_LABELS[request.status] || request.status}
            </span>
          </div>

          {role === 'owner' && (
            <p className="text-sm text-muted-foreground">
              Requested by {requester.display_name || requester.email}
            </p>
          )}

          {request.message && (
            <p className="text-sm italic text-muted-foreground">"{request.message}"</p>
          )}

          {request.response_message && (
            <p className="text-sm text-muted-foreground">Response: "{request.response_message}"</p>
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
        </div>
      </div>
    </div>
  );
}
