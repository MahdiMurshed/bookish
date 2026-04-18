import type { Notification, NotificationType } from '@repo/api-client';
import {
  getNotifications,
  getThread,
  getUnreadCount,
  getUnreadCountByTypes,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { NewMessageToast } from '@/components/Toast/NewMessageToast';
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
 * Single realtime subscription to the current user's notifications. One
 * handler does both jobs:
 *   1. Invalidate thread + message + notification caches so the UI stays live.
 *   2. Fire a cross-page NewMessageToast for `new_chat_message` events that
 *      didn't originate on the thread the user is already viewing.
 *
 * This used to be split across two hooks that each called
 * subscribeToNotifications, which failed at runtime — Supabase channels with
 * the same name can only register postgres_changes callbacks once (before
 * subscribe()). Merging into one hook gives us one channel, one connection,
 * one source of truth for "something arrived for me".
 *
 * Race fix for new_chat_message: when the user is actively viewing the
 * matching thread, skip BOTH the notification-cache invalidation (badge
 * won't flash up-and-back in the narrow window between the server write
 * and the realtime arrival) and the toast (they're already reading it).
 */
export function useNotificationSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, async (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: threadKeys.all });

      if (notification.type === 'new_chat_message' && notification.reference_id) {
        const requestId = notification.reference_id;
        queryClient.invalidateQueries({ queryKey: messageKeys.thread(requestId) });

        const currentlyViewingThisThread =
          typeof window !== 'undefined' && window.location.pathname === `/messages/${requestId}`;
        if (currentlyViewingThisThread) return;

        queryClient.invalidateQueries({ queryKey: notificationKeys.all });

        try {
          const thread = await queryClient.fetchQuery({
            queryKey: threadKeys.detail(requestId),
            queryFn: () => getThread(requestId, user.id),
            staleTime: 0,
          });
          if (thread) {
            toast.custom(
              (toastId: string | number) => (
                <NewMessageToast
                  toastId={toastId}
                  thread={thread}
                  onClick={() => {
                    toast.dismiss(toastId);
                    navigate(`/messages/${requestId}`);
                  }}
                />
              ),
              { duration: 6000 },
            );
          }
        } catch (err) {
          console.error('[messages] failed to build toast for new message:', err);
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return unsubscribe;
  }, [user, navigate, queryClient]);
}
