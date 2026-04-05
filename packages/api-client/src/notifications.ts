/**
 * Notifications abstraction layer
 *
 * Notifications are auto-created by Postgres trigger (notify_borrow_status_change).
 * This module provides read/update + Supabase Realtime subscription.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from './supabaseClient.js';
import type { Notification } from './types.js';

/**
 * Get all notifications for the current user, newest first.
 */
export async function getNotifications(): Promise<Notification[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Notification[];
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .eq('read', false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);

  if (error) throw error;
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userData.user.id)
    .eq('read', false);

  if (error) throw error;
}

/**
 * Subscribe to new notifications via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
