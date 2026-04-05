import { BookOpen } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { BorrowRequestForm } from '@/components/Borrow/BorrowRequestForm';
import { useAuth } from '@/contexts/AuthContext';
import { useBookDetail } from '@/hooks/useBooks';
import { useActiveRequestForBook } from '@/hooks/useBorrowRequests';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: book, isLoading, error } = useBookDetail(id);
  const { data: activeRequest } = useActiveRequestForBook(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading book...</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-destructive">Book not found.</div>
      </div>
    );
  }

  const isOwner = user?.id === book.owner_id;
  const canRequest = !isOwner && book.is_lendable && !activeRequest;

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
            {book.genre && (
              <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {book.genre}
              </span>
            )}
            {book.condition && (
              <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground capitalize">
                {book.condition}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                book.is_lendable
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {book.is_lendable ? 'Available to borrow' : 'Not available'}
            </span>
          </div>

          {book.description && <p className="text-sm leading-relaxed">{book.description}</p>}

          {book.isbn && <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>}

          {/* Owner info */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Owned by</p>
            <p className="font-medium">
              {isOwner ? 'You' : book.owner.display_name || book.owner.email}
            </p>
          </div>

          {/* Borrow request section */}
          {activeRequest && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                You have a {activeRequest.status} request for this book.
              </p>
            </div>
          )}

          {canRequest && <BorrowRequestForm bookId={book.id} />}

          {isOwner && (
            <div className="rounded-lg border border-muted p-4">
              <p className="text-sm text-muted-foreground">
                This is your book. Manage borrow requests from the{' '}
                <a href="/requests" className="text-primary underline">
                  Requests
                </a>{' '}
                page.
              </p>
            </div>
          )}

          {!isOwner && !book.is_lendable && !activeRequest && (
            <div className="rounded-lg border border-muted p-4">
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
