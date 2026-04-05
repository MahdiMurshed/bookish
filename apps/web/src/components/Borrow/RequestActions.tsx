import { Button } from '@repo/ui/components/button';
import { Textarea } from '@repo/ui/components/textarea';
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
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);

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
          (action ? (
            <div className="space-y-2">
              <Textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Message to requester (optional)"
                rows={2}
              />
              <div className="flex gap-2">
                {action === 'approve' && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() =>
                      approve.mutate({
                        id: requestId,
                        input: { response_message: responseMessage },
                      })
                    }
                    disabled={isLoading}
                  >
                    Confirm Approve
                  </Button>
                )}
                {action === 'deny' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => deny.mutate({ id: requestId, message: responseMessage })}
                    disabled={isLoading}
                  >
                    Confirm Deny
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => setAction(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => setAction('approve')}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setAction('deny')}
              >
                Deny
              </Button>
            </div>
          ))}

        {status === 'approved' && (
          <Button
            type="button"
            size="sm"
            onClick={() => handOver.mutate({ id: requestId })}
            disabled={isLoading}
          >
            {handOver.isPending ? 'Marking...' : 'Mark as Handed Over'}
          </Button>
        )}

        {status === 'handed_over' && (
          <Button
            type="button"
            size="sm"
            onClick={() => markReturned.mutate({ id: requestId })}
            disabled={isLoading}
          >
            {markReturned.isPending ? 'Marking...' : 'Mark as Returned'}
          </Button>
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => cancel.mutate(requestId)}
          disabled={isLoading}
        >
          {cancel.isPending ? 'Cancelling...' : 'Cancel Request'}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Action failed'}
        </p>
      )}
    </div>
  );
}
