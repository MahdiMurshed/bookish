import type { Book, BookWithOwner } from '@repo/api-client';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Book | BookWithOwner;
  showOwner?: boolean;
}

export function BookCard({ book, showOwner = false }: BookCardProps) {
  const owner = 'owner' in book ? book.owner : null;

  return (
    <Link
      to={`/books/${book.id}`}
      className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[2/3] bg-muted">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Availability dot */}
        <div
          className={`absolute top-2 right-2 h-3 w-3 rounded-full ${
            book.is_lendable ? 'bg-green-500' : 'bg-muted-foreground/30'
          }`}
          title={book.is_lendable ? 'Available to lend' : 'Not available'}
        />
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">{book.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
        {book.genre && (
          <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {book.genre}
          </span>
        )}
        {showOwner && owner && (
          <p className="mt-1 text-xs text-muted-foreground">
            by {owner.display_name || owner.email}
          </p>
        )}
      </div>
    </Link>
  );
}
