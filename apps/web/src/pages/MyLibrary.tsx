import type { CreateBookInput } from '@repo/api-client';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddBookForm } from '@/components/Books/AddBookForm';
import { BookGrid } from '@/components/Books/BookGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useCreateBook, useDeleteBook, useUpdateBook } from '@/hooks/useBooks';

export default function MyLibrary() {
  const { user } = useAuth();
  const { data: books = [], isLoading } = useBooks(user?.id);
  const createBook = useCreateBook(user?.id);
  const deleteBook = useDeleteBook(user?.id);
  const updateBook = useUpdateBook(user?.id);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddBook = async (input: CreateBookInput) => {
    try {
      await createBook.mutateAsync(input);
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create book:', err);
    }
  };

  const handleToggleLendable = async (bookId: string, currentValue: boolean) => {
    try {
      await updateBook.mutateAsync({ id: bookId, data: { is_lendable: !currentValue } });
    } catch (err) {
      console.error('Failed to update book:', err);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await deleteBook.mutateAsync(bookId);
    } catch (err) {
      console.error('Failed to delete book:', err);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading your library...</div>;
  }

  return (
    <div className="space-y-6">
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

      {/* Lendable toggle + delete for each book */}
      {books.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <div key={book.id} className="group relative">
              <div className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
                <div className="relative aspect-[2/3] bg-muted">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40 text-xs">
                      No cover
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium">{book.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
                  <div className="mt-2 flex items-center justify-between">
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
                      onClick={() => handleDelete(book.id)}
                      className="text-xs text-destructive opacity-0 hover:underline group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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
