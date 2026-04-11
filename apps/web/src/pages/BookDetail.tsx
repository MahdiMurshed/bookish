import { Badge } from '@repo/ui/components/badge';
import { BookOpen } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { BorrowRequestForm } from '@/components/Borrow/BorrowRequestForm';
import { ChatThread } from '@/components/Messages/ChatThread';
import { useAuth } from '@/contexts/AuthContext';
import { useBookDetail } from '@/hooks/useBooks';
import { useActiveRequestForBook } from '@/hooks/useBorrowRequests';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: book, isLoading, error } = useBookDetail(id);
  const { data: activeRequest, error: activeRequestError } = useActiveRequestForBook(id);

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading book...</div>;
  }

  if (error || !book) {
    return <div className="py-12 text-center text-destructive">Book not found.</div>;
  }

  const isOwner = user?.id === book.owner_id;
  const canRequest = !isOwner && book.is_lendable && !activeRequest && !activeRequestError;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-lg text-muted-foreground">{book.author}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
            {book.condition && (
              <Badge variant="secondary" className="capitalize">
                {book.condition}
              </Badge>
            )}
            {book.is_lendable ? (
              <Badge className="bg-success text-success-foreground">Available to borrow</Badge>
            ) : (
              <Badge variant="outline">Not available</Badge>
            )}
          </div>

          {book.description && <p className="text-sm leading-relaxed">{book.description}</p>}

          {book.isbn && <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>}

          {/* Owner info */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Owned by</p>
            <p className="font-medium">
              {isOwner ? 'You' : book.owner.display_name || book.owner.email}
            </p>
          </div>

          {/* Active request notice + chat thread */}
          {activeRequest && (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium">
                  You have a{' '}
                  <span className="font-semibold">{activeRequest.status.replaceAll('_', ' ')}</span>{' '}
                  request for this book.
                </p>
              </div>
              <ChatThread requestId={activeRequest.id} />
            </div>
          )}

          {activeRequestError && !activeRequest && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                Could not check your request status. Please refresh the page.
              </p>
            </div>
          )}

          {canRequest && <BorrowRequestForm bookId={book.id} />}

          {isOwner && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                This is your book. Manage borrow requests from the{' '}
                <Link to="/requests" className="text-primary underline">
                  Requests
                </Link>{' '}
                page.
              </p>
            </div>
          )}

          {!isOwner && !book.is_lendable && !activeRequest && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                This book is not currently available for borrowing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
