import type { BorrowRequestStatus } from '@repo/api-client';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';

export interface StatusBadgeDescriptor {
  label: string;
  variant: BadgeVariant;
}

const STATUS_BADGES: Record<BorrowRequestStatus, StatusBadgeDescriptor> = {
  pending: { label: 'Pending', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  handed_over: { label: 'Handed Over', variant: 'secondary' },
  returned: { label: 'Returned', variant: 'secondary' },
  denied: { label: 'Denied', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export function statusBadgeFor(status: BorrowRequestStatus): StatusBadgeDescriptor {
  return STATUS_BADGES[status];
}
