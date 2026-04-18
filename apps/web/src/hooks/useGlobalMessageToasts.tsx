import type { Notification } from '@repo/api-client';
import { getThread, subscribeToNotifications } from '@repo/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { NewMessageToast } from '@/components/Toast/NewMessageToast';
import { useAuth } from '@/contexts/AuthContext';

import { threadKeys } from './useThreads';

// Subscribes to the authenticated user's notifications and fires a custom
// sonner toast on new_chat_message events. Suppresses when the user is
// actively viewing the matching thread — otherwise a brand-new arrival
// would race the mark-read + toast for the same message. Navigation to
// the thread happens on toast click.
export function useGlobalMessageToasts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, async (notification: Notification) => {
      if (notification.type !== 'new_chat_message' || !notification.reference_id) return;

      const requestId = notification.reference_id;

      if (typeof window !== 'undefined' && window.location.pathname === `/messages/${requestId}`) {
        // User is looking at this thread — the live message already
        // appeared via the messages subscription, no toast needed.
        return;
      }

      try {
        const thread = await queryClient.fetchQuery({
          queryKey: threadKeys.detail(requestId),
          queryFn: () => getThread(requestId, user.id),
          staleTime: 0,
        });
        if (!thread) return;

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
      } catch (err) {
        console.error('[messages] failed to build toast for new message:', err);
      }
    });

    return unsubscribe;
  }, [user, navigate, queryClient]);
}
