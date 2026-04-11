/**
 * Messages abstraction layer
 *
 * Per-borrow-request chat threads with Supabase Realtime subscriptions.
 * RLS (messages_select/messages_insert) enforces that only the requester
 * and the book owner can read or write messages for a given borrow_request_id.
 */

import { createNotification } from './notifications.js';
import { supabase } from './supabaseClient.js';
import type { Message, MessageWithSender } from './types.js';

const SENDER_SELECT = `
  *,
  sender:users!sender_id (
    id,
    email,
    display_name,
    avatar_url
  )
`;

/**
 * Get all messages in a borrow request thread, oldest first.
 */
export async function getMessagesByRequest(requestId: string): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(SENDER_SELECT)
    .eq('borrow_request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as MessageWithSender[];
}

/**
 * Send a message in a borrow request thread.
 * Also fires a `new_chat_message` notification to the other party.
 */
export async function sendMessage(requestId: string, content: string): Promise<Message> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const trimmed = content.trim();
  if (!trimmed) throw new Error('Message content cannot be empty');

  // Resolve the recipient: the other party on this borrow request.
  const { data: request, error: requestError } = await supabase
    .from('borrow_requests')
    .select('requester_id, book:books!book_id(owner_id)')
    .eq('id', requestId)
    .single<{ requester_id: string; book: { owner_id: string } }>();

  if (requestError) throw requestError;
  if (!request) throw new Error('Borrow request not found');

  const recipientId =
    userData.user.id === request.requester_id ? request.book.owner_id : request.requester_id;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      borrow_request_id: requestId,
      sender_id: userData.user.id,
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;

  // Notify the recipient — don't fail the message send if this fails.
  try {
    await createNotification({
      user_id: recipientId,
      type: 'new_chat_message',
      reference_id: requestId,
    });
  } catch (notifError) {
    console.error('[messages] failed to create notification:', notifError);
  }

  return data as Message;
}

/**
 * Mark all messages in this thread as read for the current user.
 * A message is "read" once the non-sender has seen it.
 */
export async function markMessagesAsRead(requestId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('borrow_request_id', requestId)
    .neq('sender_id', userData.user.id)
    .eq('read', false);

  if (error) throw error;
}

/**
 * Subscribe to INSERT events on messages for a specific borrow request.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  requestId: string,
  onMessage: (message: MessageWithSender) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `borrow_request_id=eq.${requestId}`,
      },
      async (payload) => {
        // Realtime payload doesn't include the joined sender, so refetch.
        const { data } = await supabase
          .from('messages')
          .select(SENDER_SELECT)
          .eq('id', payload.new.id)
          .single();

        if (data) onMessage(data as MessageWithSender);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
