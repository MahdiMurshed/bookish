import type { BorrowRequestStatus, Thread } from '@repo/api-client';
import { Button } from '@repo/ui/components/button';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import {
  useApproveBorrowRequest,
  useDenyBorrowRequest,
  useHandOverBook,
  useMarkReturned,
} from '@/hooks/useBorrowRequests';
import { threadKeys } from '@/hooks/useThreads';

export type QuickActionKind = 'approve-deny' | 'hand-over' | 'mark-returned';

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

  const { borrow_request, book } = thread;
  const requestId = borrow_request.id;
  const isOwner = book.owner_id === currentUserId;
  const isRequester = borrow_request.requester_id === currentUserId;

  const action = pickQuickAction(borrow_request.status, isOwner, isRequester);
  if (!action) return null;

  const invalidateTimeline = () => {
    queryClient.invalidateQueries({ queryKey: threadKeys.all });
  };

  const pending =
    approve.isPending || deny.isPending || handOver.isPending || markReturned.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-[color-mix(in_oklch,var(--primary)_4%,var(--background))] px-5 py-2.5 dark:bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)]">
      <span className="text-muted-foreground text-xs">{action.label}</span>

      {action.kind === 'approve-deny' && (
        <>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              approve.mutate({ id: requestId, input: undefined }, { onSuccess: invalidateTimeline })
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
            onClick={() => deny.mutate({ id: requestId }, { onSuccess: invalidateTimeline })}
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
            handOver.mutate({ id: requestId, input: undefined }, { onSuccess: invalidateTimeline })
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
              { onSuccess: invalidateTimeline },
            )
          }
        >
          Mark Returned
        </Button>
      )}
    </div>
  );
}
