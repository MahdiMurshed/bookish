import type { ReviewWithReviewer } from '@repo/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Star } from 'lucide-react';

import { useReviewsForBook } from '@/hooks/useReviews';
import { initialsFor } from '@/lib/avatarPalette';

interface ReviewListProps {
  bookId: string;
}

export function averageRating(reviews: ReviewWithReviewer[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((acc, r) => acc + r.rating, 0);
  return total / reviews.length;
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${cls} ${
            value <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const day = 1000 * 60 * 60 * 24;
  const days = Math.floor(diffMs / day);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ReviewList({ bookId }: ReviewListProps) {
  const { data: reviews, isLoading, error } = useReviewsForBook(bookId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading reviews…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">Could not load reviews.</p>;
  }

  const list = reviews ?? [];
  const avg = averageRating(list);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-lg">Reviews</h2>
        {avg !== null && (
          <div className="flex items-center gap-2">
            <StarRow rating={Math.round(avg)} size="md" />
            <span className="font-medium text-sm">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">
              ({list.length} review{list.length === 1 ? '' : 's'})
            </span>
          </div>
        )}
      </header>

      {list.length === 0 ? (
        <p className="rounded-lg border bg-card p-4 text-muted-foreground text-sm">
          No reviews yet. Be the first borrower to leave one.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const name = r.reviewer.display_name || r.reviewer.email;
            return (
              <li key={r.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Avatar size="sm">
                    {r.reviewer.avatar_url ? (
                      <AvatarImage src={r.reviewer.avatar_url} alt={name} />
                    ) : null}
                    <AvatarFallback>
                      {initialsFor(r.reviewer.display_name, r.reviewer.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatRelativeDate(r.created_at)}
                      </span>
                    </div>
                    <StarRow rating={r.rating} />
                    {r.content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
