import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateBorrowRequestFormValues } from '@repo/shared';
import { createBorrowRequestSchema } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useCreateBorrowRequest } from '@/hooks/useBorrowRequests';

interface BorrowRequestFormProps {
  bookId: string;
}

export function BorrowRequestForm({ bookId }: BorrowRequestFormProps) {
  const createRequest = useCreateBorrowRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBorrowRequestFormValues>({
    resolver: zodResolver(createBorrowRequestSchema),
    defaultValues: {
      book_id: bookId,
      message: '',
      due_date: '',
    },
  });

  const onSubmit = (data: CreateBorrowRequestFormValues) => {
    createRequest.mutate(
      {
        book_id: data.book_id,
        message: data.message || undefined,
        due_date: data.due_date || undefined,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="font-medium">Request to Borrow</h3>

      <div className="space-y-2">
        <Label htmlFor="borrow-message">Message to owner (optional)</Label>
        <Textarea
          id="borrow-message"
          {...register('message')}
          placeholder="Let the owner know why you'd like to borrow this book..."
          maxLength={500}
          rows={3}
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date">Preferred return date (optional)</Label>
        <Input
          id="due-date"
          type="date"
          {...register('due_date')}
          min={new Date().toISOString().split('T')[0]}
          className="w-fit"
        />
        {errors.due_date && <p className="text-sm text-destructive">{errors.due_date.message}</p>}
      </div>

      {createRequest.error && (
        <p className="text-sm text-destructive">
          {createRequest.error instanceof Error
            ? createRequest.error.message
            : 'Failed to create request'}
        </p>
      )}

      <Button type="submit" disabled={createRequest.isPending}>
        <Send />
        {createRequest.isPending ? 'Sending...' : 'Send Request'}
      </Button>
    </form>
  );
}
