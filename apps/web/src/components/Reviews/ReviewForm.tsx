import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateReviewFormValues, reviewFormSchema } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useCreateReview } from '@/hooks/useReviews';

interface ReviewFormProps {
  bookId: string;
  borrowRequestId: string;
  bookTitle: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function ReviewForm({
  bookId,
  borrowRequestId,
  bookTitle,
  onCancel,
  onSuccess,
}: ReviewFormProps) {
  const createReview = useCreateReview();
  const [hover, setHover] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, content: '' },
  });

  const rating = watch('rating');

  const onSubmit = (values: CreateReviewFormValues) => {
    createReview.mutate(
      {
        book_id: bookId,
        borrow_request_id: borrowRequestId,
        rating: values.rating,
        content: values.content || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Review posted.');
          onSuccess?.();
        },
        onError: (err) => {
          const detail = err instanceof Error ? err.message : 'Please try again.';
          toast.error(`Couldn't post your review. ${detail}`);
        },
      },
    );
  };

  return (
    <Card className="space-y-4 border-primary/20 bg-primary/5 p-4">
      <div>
        <h3 className="font-medium text-sm">Review {bookTitle}</h3>
        <p className="text-muted-foreground text-xs">
          Tell the community how it went. You can review each book once.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('rating', { valueAsNumber: true })} />

        <fieldset className="space-y-1">
          <legend className="font-medium text-sm">Rating</legend>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = (hover || rating) >= value;
              return (
                <button
                  type="button"
                  key={value}
                  aria-pressed={rating === value}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  className="rounded p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() =>
                    setValue('rating', value, { shouldValidate: true, shouldDirty: true })
                  }
                >
                  <Star
                    className={`h-6 w-6 ${
                      filled ? 'fill-primary text-primary' : 'text-muted-foreground/40'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
          {errors.rating && <p className="text-destructive text-xs">Pick a rating from 1 to 5.</p>}
        </fieldset>

        <div className="space-y-1">
          <Label htmlFor="review-content" className="text-sm">
            Notes <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="review-content"
            rows={3}
            placeholder="What stood out? Anything other borrowers should know?"
            {...register('content')}
          />
          {errors.content && <p className="text-destructive text-xs">{errors.content.message}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={createReview.isPending}>
            {createReview.isPending ? 'Posting…' : 'Post review'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={createReview.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
