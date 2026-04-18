/**
 * Messages abstraction layer
 *
 * Per-borrow-request chat threads with Supabase Realtime subscriptions.
 * RLS (messages_select/messages_insert) enforces that only the requester
 * and the book owner can read or write messages for a given borrow_request_id.
 */

import { createNotification } from './notifications.js';
import { supabase } from './supabaseClient.js';
import type { BorrowRequest, Message, MessageSender, MessageWithSender, Thread } from './types.js';

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
 * Mark all messages in this thread as read for the current user, AND mark the
 * corresponding `new_chat_message` notifications read so the header badge stays
 * in lockstep. The two stores both back unread counts; drifting them is what
 * causes "badge won't clear" bugs.
 */
export async function markMessagesAsRead(requestId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error: messagesError } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('borrow_request_id', requestId)
    .neq('sender_id', userData.user.id)
    .eq('read', false);

  if (messagesError) throw messagesError;

  // new_chat_message notifications store the borrow_request_id in reference_id
  // (see sendMessage above). Clear them in the same logical operation.
  const { error: notificationsError } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userData.user.id)
    .eq('type', 'new_chat_message')
    .eq('reference_id', requestId)
    .eq('read', false);

  if (notificationsError) throw notificationsError;
}

// ---------------------------------------------------------------------------
// Thread projection — not a stored entity. Joins borrow_requests × books ×
// users × messages and computes last_message + unread_count client-side.
// RLS on borrow_requests already scopes to threads I'm a participant in, so
// one query with embedding is enough — no filter needed, no migration needed.
// ---------------------------------------------------------------------------

const THREAD_PROJECTION = `
  *,
  book:books!book_id (
    id,
    owner_id,
    title,
    author,
    cover_url,
    owner:users!owner_id (id, email, display_name, avatar_url)
  ),
  requester:users!requester_id (id, email, display_name, avatar_url),
  messages (id, sender_id, content, read, created_at)
`;

export interface ThreadRow extends BorrowRequest {
  book: {
    id: string;
    owner_id: string;
    title: string;
    author: string;
    cover_url: string | null;
    owner: MessageSender;
  };
  requester: MessageSender;
  messages: Array<{
    id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
  }>;
}

export function projectThread(row: ThreadRow, currentUserId: string): Thread {
  const messages = row.messages ?? [];
  const lastMessage = messages.length
    ? [...messages].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    : null;

  const unread_count = messages.reduce(
    (acc, m) => (!m.read && m.sender_id !== currentUserId ? acc + 1 : acc),
    0,
  );

  const amRequester = row.requester_id === currentUserId;
  const counterparty = amRequester ? row.book.owner : row.requester;

  const { book, requester: _requester, messages: _messages, ...borrow_request } = row;
  const { owner: _owner, ...bookProjection } = book;

  return {
    borrow_request,
    book: bookProjection,
    counterparty,
    last_message: lastMessage
      ? {
          id: lastMessage.id,
          sender_id: lastMessage.sender_id,
          content: lastMessage.content,
          created_at: lastMessage.created_at,
        }
      : null,
    unread_count,
    last_activity_at: lastMessage?.created_at ?? row.requested_at,
  };
}

/**
 * Get all threads the current user participates in, newest activity first.
 */
export async function getThreads(currentUserId: string): Promise<Thread[]> {
  const { data, error } = await supabase.from('borrow_requests').select(THREAD_PROJECTION);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ThreadRow[];
  return rows
    .map((row) => projectThread(row, currentUserId))
    .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at));
}

/**
 * Get a single thread by its borrow_request id.
 */
export async function getThread(requestId: string, currentUserId: string): Promise<Thread | null> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(THREAD_PROJECTION)
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return projectThread(data as unknown as ThreadRow, currentUserId);
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
        // Realtime payload has the base row but not the joined sender. Try to
        // fetch the joined sender, but if that fails (network blip, brief
        // downtime) deliver the base row anyway with a placeholder sender so
        // the recipient still sees the message in real time. The real sender
        // joins next time the query refetches.
        const newRow = payload.new as Message;
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(SENDER_SELECT)
            .eq('id', newRow.id)
            .single();

          if (error) throw error;
          if (data) {
            onMessage(data as MessageWithSender);
            return;
          }
        } catch (refetchError) {
          console.warn('[messages] sender refetch failed, using payload fallback:', refetchError);
        }

        onMessage({
          ...newRow,
          sender: {
            id: newRow.sender_id,
            email: '',
            display_name: null,
            avatar_url: null,
          },
        });
      },
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error(`[messages] subscription ${status} for request ${requestId}:`, err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
