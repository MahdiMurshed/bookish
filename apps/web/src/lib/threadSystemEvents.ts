// Derive inline "system events" for a thread from its borrow_request timestamps.
// These render as centered pills between message bubbles ("Status changed to
// Handed Over · Apr 16, 6:42pm"). We compute them client-side instead of
// storing them so the messages table stays pure text + no schema migration.

import type { BorrowRequest } from '@repo/api-client';

export interface ThreadSystemEvent {
  id: string;
  kind: 'status_change';
  label: string;
  at: string;
}

export function deriveSystemEvents(request: BorrowRequest): ThreadSystemEvent[] {
  const events: ThreadSystemEvent[] = [];

  if (request.responded_at) {
    const label =
      request.status === 'denied' ? 'Status changed to Denied' : 'Status changed to Approved';
    events.push({
      id: `${request.id}-responded`,
      kind: 'status_change',
      label,
      at: request.responded_at,
    });
  }

  if (request.handover_date) {
    events.push({
      id: `${request.id}-handed-over`,
      kind: 'status_change',
      label: 'Status changed to Handed Over',
      at: request.handover_date,
    });
  }

  if (request.returned_at) {
    events.push({
      id: `${request.id}-returned`,
      kind: 'status_change',
      label: 'Status changed to Returned',
      at: request.returned_at,
    });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}
