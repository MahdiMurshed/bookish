import { useState } from 'react';

import { useCreateBorrowRequest } from '@/hooks/useBorrowRequests';

interface BorrowRequestFormProps {
  bookId: string;
}

export function BorrowRequestForm({ bookId }: BorrowRequestFormProps) {
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createRequest = useCreateBorrowRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest.mutate(
      {
        book_id: bookId,
        message: message || undefined,
        due_date: dueDate || undefined,
      },
      {
        onSuccess: () => {
          setMessage('');
          setDueDate('');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Request to Borrow</h3>

      <div>
        <label htmlFor="borrow-message" className="mb-1 block text-sm text-muted-foreground">
          Message to owner (optional)
        </label>
        <textarea
          id="borrow-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Let the owner know why you'd like to borrow this book..."
          maxLength={500}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="due-date" className="mb-1 block text-sm text-muted-foreground">
          Preferred return date (optional)
        </label>
        <input
          id="due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {createRequest.error && (
        <p className="text-sm text-destructive">
          {createRequest.error instanceof Error
            ? createRequest.error.message
            : 'Failed to create request'}
        </p>
      )}

      <button
        type="submit"
        disabled={createRequest.isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {createRequest.isPending ? 'Sending...' : 'Send Request'}
      </button>
    </form>
  );
}
