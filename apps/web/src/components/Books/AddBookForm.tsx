import type { BookSearchResult, CreateBookInput } from '@repo/api-client';
import { BOOK_CONDITIONS, BOOK_GENRES, mapCategoryToGenre, searchBooks } from '@repo/api-client';
import { BookOpen, Search, X } from 'lucide-react';
import { useState } from 'react';

interface AddBookFormProps {
  onSubmit: (input: CreateBookInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AddBookForm({ onSubmit, onCancel, loading }: AddBookFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [genre, setGenre] = useState('');
  const [condition, setCondition] = useState('good');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [googleBooksId, setGoogleBooksId] = useState('');
  const [isLendable, setIsLendable] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
      alert('Book search failed. Try again later.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = (result: BookSearchResult) => {
    setTitle(result.title);
    setAuthor(result.authors.join(', '));
    setIsbn(result.isbn || '');
    setCoverUrl(result.imageUrl || '');
    setGoogleBooksId(result.id);
    setDescription(result.description || '');
    if (result.categories) {
      setGenre(mapCategoryToGenre(result.categories) || '');
    }
    setShowSearch(false);
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      author,
      isbn: isbn || undefined,
      genre: genre || undefined,
      condition: condition as CreateBookInput['condition'],
      description: description || undefined,
      cover_url: coverUrl || undefined,
      google_books_id: googleBooksId || undefined,
      is_lendable: isLendable,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google Books Search */}
      {showSearch && (
        <div className="space-y-2">
          <label htmlFor="book-search" className="text-sm font-medium">
            Search Google Books
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <input
                id="book-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Search by title..."
                className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-md border">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectBook(result)}
                  className="flex w-full items-start gap-3 border-b p-3 text-left hover:bg-muted last:border-b-0"
                >
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="" className="h-16 w-11 rounded object-cover" />
                  ) : (
                    <div className="flex h-16 w-11 items-center justify-center rounded bg-muted">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.authors.join(', ')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSearch(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Or enter details manually
          </button>
        </div>
      )}

      {/* Manual entry / Edit fields */}
      {!showSearch && (
        <>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Search Google Books instead
          </button>

          {coverUrl && (
            <div className="flex items-start gap-3">
              <img src={coverUrl} alt={title} className="h-24 w-16 rounded object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="author" className="text-sm font-medium">
                Author *
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="genre" className="text-sm font-medium">
                Genre
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select genre</option>
                {BOOK_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="condition" className="text-sm font-medium">
                Condition
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {BOOK_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="isbn" className="text-sm font-medium">
                ISBN
              </label>
              <input
                id="isbn"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isLendable}
              onChange={(e) => setIsLendable(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Available to lend</span>
          </label>
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        {!showSearch && (
          <button
            type="submit"
            disabled={loading || !title || !author}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Book'}
          </button>
        )}
      </div>
    </form>
  );
}
