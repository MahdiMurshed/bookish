import type { BorrowRequestStatus, Thread } from '@repo/api-client';
import { Button } from '@repo/ui/components/button';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ReviewForm } from '@/components/Reviews/ReviewForm';
import {
  useApproveBorrowRequest,
  useDenyBorrowRequest,
  useHandOverBook,
  useMarkReturned,
} from '@/hooks/useBorrowRequests';
import { useMyReviewForRequest } from '@/hooks/useReviews';
import { threadKeys } from '@/hooks/useThreads';

export type QuickActionKind = 'approve-deny' | 'hand-over' | 'mark-returned' | 'write-review';

export interface QuickActionDescriptor {
  kind: QuickActionKind;
  label: string;
}

// Pure role-aware action resolver. Exported for testing — returns null when
// the current user has no action to take (either the other party's turn or
// the request is in a terminal state).
export function pickQuickAction(
  status: BorrowRequestStatus,
  isOwner: boolean,
  isRequester: boolean,
  hasReviewed = false,
): QuickActionDescriptor | null {
  if (isOwner && status === 'pending') {
    return { kind: 'approve-deny', label: 'Quick actions:' };
  }
  if (isOwner && status === 'approved') {
    return { kind: 'hand-over', label: 'Quick actions:' };
  }
  if (isRequester && status === 'handed_over') {
    return { kind: 'mark-returned', label: "When you're done:" };
  }
  if (isRequester && status === 'returned' && !hasReviewed) {
    return { kind: 'write-review', label: 'How was it?' };
  }
  return null;
}

interface QuickActionsProps {
  thread: Thread;
  currentUserId: string;
}

export function QuickActions({ thread, currentUserId }: QuickActionsProps) {
  const queryClient = useQueryClient();
  const approve = useApproveBorrowRequest();
  const deny = useDenyBorrowRequest();
  const handOver = useHandOverBook();
  const markReturned = useMarkReturned();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { borrow_request, book } = thread;
  const requestId = borrow_request.id;
  const isOwner = book.owner_id === currentUserId;
  const isRequester = borrow_request.requester_id === currentUserId;

  // Only fetched when it could affect the result (requester + returned).
  // The hook gates on requestId being present and is cheap when never read.
  const reviewLookupEnabled = isRequester && borrow_request.status === 'returned';
  const { data: existingReview } = useMyReviewForRequest(
    reviewLookupEnabled ? requestId : undefined,
  );
  const hasReviewed = !!existingReview;

  const action = pickQuickAction(borrow_request.status, isOwner, isRequester, hasReviewed);
  if (!action) return null;

  const invalidateTimeline = () => {
    queryClient.invalidateQueries({ queryKey: threadKeys.all });
  };

  const onActionError = (verb: string) => (err: unknown) => {
    const detail = err instanceof Error ? err.message : 'Please try again.';
    toast.error(`Couldn't ${verb}. ${detail}`);
  };

  const pending =
    approve.isPending || deny.isPending || handOver.isPending || markReturned.isPending;

  const bar = (
    <div className="flex flex-wrap items-center gap-2 border-b bg-[color-mix(in_oklch,var(--primary)_4%,var(--background))] px-5 py-2.5 dark:bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]">
      <span className="text-muted-foreground text-xs">{action.label}</span>

      {action.kind === 'approve-deny' && (
        <>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              approve.mutate(
                { id: requestId, input: undefined },
                { onSuccess: invalidateTimeline, onError: onActionError('approve this request') },
              )
            }
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              deny.mutate(
                { id: requestId },
                { onSuccess: invalidateTimeline, onError: onActionError('deny this request') },
              )
            }
          >
            Deny
          </Button>
        </>
      )}

      {action.kind === 'hand-over' && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            handOver.mutate(
              { id: requestId, input: undefined },
              { onSuccess: invalidateTimeline, onError: onActionError('mark as handed over') },
            )
          }
        >
          Mark Handed Over
        </Button>
      )}

      {action.kind === 'mark-returned' && (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            markReturned.mutate(
              { id: requestId, notes: undefined },
              { onSuccess: invalidateTimeline, onError: onActionError('mark as returned') },
            )
          }
        >
          Mark Returned
        </Button>
      )}

      {action.kind === 'write-review' && !showReviewForm && (
        <Button type="button" size="sm" onClick={() => setShowReviewForm(true)}>
          <Star className="h-4 w-4" aria-hidden="true" />
          Write a review
        </Button>
      )}
    </div>
  );

  if (action.kind === 'write-review' && showReviewForm) {
    return (
      <>
        {bar}
        <div className="border-b px-5 py-4">
          <ReviewForm
            bookId={book.id}
            borrowRequestId={requestId}
            bookTitle={book.title}
            onCancel={() => setShowReviewForm(false)}
            onSuccess={() => setShowReviewForm(false)}
          />
        </div>
      </>
    );
  }

  return bar;
}
