import type { Notification, NotificationType } from '@repo/api-client';
import {
  getNotifications,
  getUnreadCount,
  getUnreadCountByTypes,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { messageKeys } from './useMessages';
import { threadKeys } from './useThreads';

// Notification-type partitions. Messages and Requests each count their own
// notifications rather than sharing a single "unread" bucket.
const MESSAGE_TYPES: NotificationType[] = ['new_chat_message'];
const REQUEST_TYPES: NotificationType[] = [
  'borrow_requested',
  'borrow_approved',
  'borrow_denied',
  'borrow_handed_over',
  'borrow_returned',
];

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  unreadByTypes: (types: readonly NotificationType[]) =>
    [...notificationKeys.all, 'unreadByTypes', [...types].sort()] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 30_000, // poll every 30s as fallback
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: notificationKeys.unreadByTypes(MESSAGE_TYPES),
    queryFn: () => getUnreadCountByTypes(MESSAGE_TYPES),
    refetchInterval: 30_000,
  });
}

export function useUnreadRequestCount() {
  return useQuery({
    queryKey: notificationKeys.unreadByTypes(REQUEST_TYPES),
    queryFn: () => getUnreadCountByTypes(REQUEST_TYPES),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Subscribe to realtime notifications. Invalidates queries on new notification.
 *
 * Race fix for `new_chat_message`: if the user is actively viewing the
 * messages route for the same thread that produced the notification, skip the
 * notification invalidation. The thread component's markMessagesAsRead is
 * responsible for clearing both the message AND notification in a single
 * server call — letting this subscription invalidate would trigger a refetch
 * in the narrow window between the server write and the realtime arrival,
 * briefly flashing the badge up and back. Thread + message caches still
 * invalidate normally so the bubble appears live.
 */
export function useNotificationSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: threadKeys.all });

      if (notification.type === 'new_chat_message' && notification.reference_id) {
        const requestId = notification.reference_id;
        queryClient.invalidateQueries({ queryKey: messageKeys.thread(requestId) });

        if (typeof window !== 'undefined') {
          const currentlyViewingThisThread = window.location.pathname.startsWith(
            `/messages/${requestId}`,
          );
          if (currentlyViewingThisThread) return;
        }
      }

      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return unsubscribe;
  }, [user, queryClient]);
}
