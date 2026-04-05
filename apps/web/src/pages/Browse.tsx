import { useState } from 'react';
import { BookFilters } from '@/components/Books/BookFilters';
import { BookGrid } from '@/components/Books/BookGrid';
import { useAvailableBooks } from '@/hooks/useBooks';
import { useDebounce } from '@/hooks/useDebounce';

export default function Browse() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(genre && { genre }),
  };

  const { data: books = [], isLoading } = useAvailableBooks(
    Object.keys(filters).length > 0 ? filters : undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Bookshelf</h1>
        <p className="text-muted-foreground">Books available to borrow from the community</p>
      </div>

      <BookFilters
        search={search}
        genre={genre}
        onSearchChange={setSearch}
        onGenreChange={setGenre}
      />

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading books...</div>
      ) : (
        <BookGrid
          books={books}
          showOwner
          emptyMessage="No books available yet. Be the first to share a book!"
        />
      )}
    </div>
  );
}
