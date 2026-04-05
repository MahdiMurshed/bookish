import type { Book, BookWithOwner } from '@repo/api-client';
import { BookCard } from '@/components/Books/BookCard';

interface BookGridProps {
  books: (Book | BookWithOwner)[];
  showOwner?: boolean;
  emptyMessage?: string;
}

export function BookGrid({
  books,
  showOwner = false,
  emptyMessage = 'No books found.',
}: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {books.map((book) => (
        <BookCard key={book.id} book={book} showOwner={showOwner} />
      ))}
    </div>
  );
}
