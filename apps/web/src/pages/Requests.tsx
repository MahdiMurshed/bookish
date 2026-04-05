import type { BorrowRequestWithDetails } from '@repo/api-client';
import { Badge } from '@repo/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';

import { BorrowRequestCard } from '@/components/Borrow/BorrowRequestCard';
import { useIncomingRequests, useOutgoingRequests } from '@/hooks/useBorrowRequests';

export default function Requests() {
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();

  const pendingCount = incoming.data?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Borrow Requests</h1>
        <p className="text-muted-foreground">Manage incoming and outgoing borrow requests</p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="w-full">
          <TabsTrigger value="incoming">
            Incoming
            {pendingCount > 0 && <Badge className="ml-1.5">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <RequestList
            data={incoming.data}
            isLoading={incoming.isLoading}
            error={incoming.error}
            userRole="owner"
            emptyMessage="No incoming borrow requests yet."
          />
        </TabsContent>

        <TabsContent value="outgoing">
          <RequestList
            data={outgoing.data}
            isLoading={outgoing.isLoading}
            error={outgoing.error}
            userRole="requester"
            emptyMessage="You haven't made any borrow requests yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestList({
  data,
  isLoading,
  error,
  userRole,
  emptyMessage,
}: {
  data: BorrowRequestWithDetails[] | undefined;
  isLoading: boolean;
  error: Error | null;
  userRole: 'owner' | 'requester';
  emptyMessage: string;
}) {
  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading requests...</div>;
  }

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">
        {error instanceof Error ? error.message : 'Failed to load requests'}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-3 pt-4">
      {data.map((request) => (
        <BorrowRequestCard key={request.id} request={request} role={userRole} />
      ))}
    </div>
  );
}
