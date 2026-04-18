import type { MessageWithSender } from '@repo/api-client';
import {
  getMessagesByRequest,
  markMessagesAsRead,
  sendMessage,
  subscribeToMessages,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { notificationKeys } from './useNotifications';
import { threadKeys } from './useThreads';

export const messageKeys = {
  all: ['messages'] as const,
  thread: (requestId: string) => [...messageKeys.all, 'thread', requestId] as const,
};

export function useMessages(requestId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.thread(requestId ?? ''),
    queryFn: () => getMessagesByRequest(requestId!),
    enabled: !!requestId,
  });
}

interface SendMessageContext {
  previous: MessageWithSender[] | undefined;
  optimisticId: string | null;
}

export function useSendMessage(requestId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Awaited<ReturnType<typeof sendMessage>>, Error, string, SendMessageContext>({
    mutationFn: (content: string) => {
      if (!requestId) throw new Error('Request ID is required');
      return sendMessage(requestId, content);
    },
    onMutate: async (content) => {
      if (!requestId || !user) {
        return { previous: undefined, optimisticId: null };
      }

      const key = messageKeys.thread(requestId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<MessageWithSender[]>(key);

      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: MessageWithSender = {
        id: optimisticId,
        borrow_request_id: requestId,
        sender_id: user.id,
        content: content.trim(),
        read: false,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          email: user.email ?? '',
          display_name:
            (user.user_metadata?.display_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
          avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        },
      };

      queryClient.setQueryData<MessageWithSender[]>(key, (old) => [...(old ?? []), optimistic]);

      return { previous, optimisticId };
    },
    onError: (_err, _content, context) => {
      if (requestId && context?.previous) {
        queryClient.setQueryData(messageKeys.thread(requestId), context.previous);
      }
    },
    onSuccess: (newMessage, _content, context) => {
      if (!requestId || context?.optimisticId == null) return;
      const optimisticId = context.optimisticId;

      // Replace the optimistic row with the real one. The Realtime subscription
      // may also add it — dedupe by id.
      queryClient.setQueryData<MessageWithSender[]>(messageKeys.thread(requestId), (old) => {
        const withoutOptimistic = (old ?? []).filter((m) => m.id !== optimisticId);
        const alreadyPresent = withoutOptimistic.some((m) => m.id === newMessage.id);
        if (alreadyPresent) return withoutOptimistic;
        // Build a MessageWithSender from the returned Message + current user as sender.
        const withSender: MessageWithSender = {
          ...newMessage,
          sender: {
            id: user?.id ?? newMessage.sender_id,
            email: user?.email ?? '',
            display_name:
              (user?.user_metadata?.display_name as string | undefined) ??
              (user?.user_metadata?.name as string | undefined) ??
              null,
            avatar_url: (user?.user_metadata?.avatar_url as string | undefined) ?? null,
          },
        };
        return [...withoutOptimistic, withSender];
      });
    },
  });
}

/**
 * Subscribe to realtime INSERTs on this thread and merge them into the cache.
 */
export function useMessageSubscription(requestId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;

    const unsubscribe = subscribeToMessages(requestId, (message) => {
      if (!mounted) return;
      queryClient.setQueryData<MessageWithSender[]>(messageKeys.thread(requestId), (old) => {
        const exists = old?.some((m) => m.id === message.id);
        if (exists) return old;
        return [...(old ?? []), message];
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [requestId, queryClient]);
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (requestId: string) => markMessagesAsRead(requestId),
    onSuccess: (_data, requestId) => {
      // Update the cache in place — the server already flipped these rows to
      // read: true. Avoids a refetch round-trip + "Loading messages..." flicker.
      if (!user) return;
      queryClient.setQueryData<MessageWithSender[]>(messageKeys.thread(requestId), (old) => {
        if (!old) return old;
        return old.map((m) => (m.sender_id === user.id || m.read ? m : { ...m, read: true }));
      });

      // markMessagesAsRead now clears matching new_chat_message notifications
      // server-side too. Invalidate notifications + threads so both badges and
      // the inbox unread count refresh.
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: threadKeys.all });
    },
  });
}
