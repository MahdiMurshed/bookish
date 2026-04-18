/**
 * Notifications abstraction layer
 *
 * Notifications are auto-created by Postgres trigger (notify_borrow_status_change).
 * This module provides read/update + Supabase Realtime subscription.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from './supabaseClient.js';
import type { Notification, NotificationType } from './types.js';

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  reference_id: string;
}

/**
 * Create a notification row directly.
 *
 * Borrow-status notifications are already created by a Postgres trigger
 * (notify_borrow_status_change). Use this helper only for notifications
 * that have no trigger — currently just `new_chat_message`.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    reference_id: input.reference_id,
  });

  if (error) throw error;
}

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
 * Get unread notification count across all types.
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
 * Get unread notification count filtered to a subset of types. Used by the
 * Messages and Requests header badges so each surface counts only its own
 * notifications — no more combined count leaking across features.
 */
export async function getUnreadCountByTypes(types: NotificationType[]): Promise<number> {
  if (types.length === 0) return 0;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .eq('read', false)
    .in('type', types);

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
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`[notifications] subscription ${status} for user ${userId}:`, err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
