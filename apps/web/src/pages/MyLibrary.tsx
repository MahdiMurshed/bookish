import type { CreateBookInput } from '@repo/api-client';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddBookForm } from '@/components/Books/AddBookForm';
import { BookCard } from '@/components/Books/BookCard';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useCreateBook, useDeleteBook, useUpdateBook } from '@/hooks/useBooks';

export default function MyLibrary() {
  const { user } = useAuth();
  const { data: books = [], isLoading } = useBooks(user?.id);
  const createBook = useCreateBook(user?.id);
  const deleteBook = useDeleteBook(user?.id);
  const updateBook = useUpdateBook(user?.id);

  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBook = async (input: CreateBookInput) => {
    setError(null);
    try {
      await createBook.mutateAsync(input);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
    }
  };

  const handleToggleLendable = async (bookId: string, currentValue: boolean) => {
    setError(null);
    try {
      await updateBook.mutateAsync({ id: bookId, data: { is_lendable: !currentValue } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book');
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Delete this book?')) return;
    setError(null);
    try {
      await deleteBook.mutateAsync(bookId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading your library...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <button type="button" onClick={() => setError(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Library</h1>
          <p className="text-muted-foreground">
            {books.length} book{books.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Book
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-lg font-medium">Add a Book</h2>
          <AddBookForm
            onSubmit={handleAddBook}
            onCancel={() => setShowAddForm(false)}
            loading={createBook.isPending}
          />
        </div>
      )}

      {books.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <div key={book.id} className="group relative">
              <BookCard book={book} />
              <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between border-t bg-card/90 px-3 py-1.5 backdrop-blur-sm">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={book.is_lendable}
                    onChange={() => handleToggleLendable(book.id, book.is_lendable)}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  Lendable
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(book.id);
                  }}
                  className="text-xs text-destructive opacity-0 hover:underline group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Your library is empty.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Add your first book
            </button>
          </div>
        )
      )}
    </div>
  );
}
