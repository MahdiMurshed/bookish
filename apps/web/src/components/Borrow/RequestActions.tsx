import { useState } from 'react';

import {
  useApproveBorrowRequest,
  useCancelBorrowRequest,
  useDenyBorrowRequest,
  useHandOverBook,
  useMarkReturned,
} from '@/hooks/useBorrowRequests';

interface RequestActionsProps {
  requestId: string;
  status: string;
  role: 'owner' | 'requester';
}

export function RequestActions({ requestId, status, role }: RequestActionsProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const approve = useApproveBorrowRequest();
  const deny = useDenyBorrowRequest();
  const cancel = useCancelBorrowRequest();
  const handOver = useHandOverBook();
  const markReturned = useMarkReturned();

  const isLoading =
    approve.isPending ||
    deny.isPending ||
    cancel.isPending ||
    handOver.isPending ||
    markReturned.isPending;

  const error = approve.error || deny.error || cancel.error || handOver.error || markReturned.error;

  if (role === 'owner') {
    return (
      <div className="space-y-2">
        {status === 'pending' &&
          (showResponse ? (
            <div className="space-y-2">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Message to requester (optional)"
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    approve.mutate({
                      id: requestId,
                      input: { response_message: responseMessage },
                    })
                  }
                  disabled={isLoading}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Confirm Approve
                </button>
                <button
                  type="button"
                  onClick={() => deny.mutate({ id: requestId, message: responseMessage })}
                  disabled={isLoading}
                  className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  Confirm Deny
                </button>
                <button
                  type="button"
                  onClick={() => setShowResponse(false)}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResponse(true)}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setShowResponse(true)}
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                Deny
              </button>
            </div>
          ))}

        {status === 'approved' && (
          <button
            type="button"
            onClick={() => handOver.mutate({ id: requestId })}
            disabled={isLoading}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {handOver.isPending ? 'Marking...' : 'Mark as Handed Over'}
          </button>
        )}

        {status === 'handed_over' && (
          <button
            type="button"
            onClick={() => markReturned.mutate({ id: requestId })}
            disabled={isLoading}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {markReturned.isPending ? 'Marking...' : 'Mark as Returned'}
          </button>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Action failed'}
          </p>
        )}
      </div>
    );
  }

  // Requester actions
  return (
    <div className="space-y-2">
      {(status === 'pending' || status === 'approved') && (
        <button
          type="button"
          onClick={() => cancel.mutate(requestId)}
          disabled={isLoading}
          className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        >
          {cancel.isPending ? 'Cancelling...' : 'Cancel Request'}
        </button>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Action failed'}
        </p>
      )}
    </div>
  );
}
