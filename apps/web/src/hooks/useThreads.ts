import type { Thread } from '@repo/api-client';
import { getThread, getThreads } from '@repo/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';

export const threadKeys = {
  all: ['threads'] as const,
  list: () => [...threadKeys.all, 'list'] as const,
  detail: (requestId: string) => [...threadKeys.all, 'detail', requestId] as const,
};

export function useThreads() {
  const { user } = useAuth();

  return useQuery<Thread[]>({
    queryKey: threadKeys.list(),
    queryFn: () => getThreads(user!.id),
    enabled: !!user,
  });
}

export function useThread(requestId: string | undefined) {
  const { user } = useAuth();

  return useQuery<Thread | null>({
    queryKey: threadKeys.detail(requestId ?? ''),
    queryFn: () => getThread(requestId!, user!.id),
    enabled: !!requestId && !!user,
  });
}
