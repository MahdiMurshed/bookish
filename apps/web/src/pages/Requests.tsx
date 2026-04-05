import { useState } from 'react';

import { BorrowRequestCard } from '@/components/Borrow/BorrowRequestCard';
import { useIncomingRequests, useOutgoingRequests } from '@/hooks/useBorrowRequests';

type Tab = 'incoming' | 'outgoing';

export default function Requests() {
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();

  const requests = activeTab === 'incoming' ? incoming : outgoing;
  const role = activeTab === 'incoming' ? 'owner' : 'requester';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Borrow Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'incoming'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Incoming
          {incoming.data && incoming.data.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {incoming.data.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'outgoing'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Outgoing
        </button>
      </div>

      {/* Content */}
      {requests.isLoading && (
        <div className="py-12 text-center text-muted-foreground">Loading requests...</div>
      )}

      {requests.error && (
        <div className="py-12 text-center text-destructive">
          {requests.error instanceof Error ? requests.error.message : 'Failed to load requests'}
        </div>
      )}

      {requests.data && requests.data.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {activeTab === 'incoming'
            ? 'No incoming borrow requests yet.'
            : "You haven't made any borrow requests yet."}
        </div>
      )}

      {requests.data && requests.data.length > 0 && (
        <div className="space-y-3">
          {requests.data.map((request) => (
            <BorrowRequestCard key={request.id} request={request} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
