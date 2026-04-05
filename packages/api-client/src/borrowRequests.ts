/**
 * Borrow Requests abstraction layer
 *
 * Handles the full borrow lifecycle: create, approve, deny, cancel, handOver, markReturned.
 * State machine enforced by Postgres trigger (validate_borrow_transition).
 */

import { supabase } from './supabaseClient.js';
import type { BorrowRequest, BorrowRequestWithDetails } from './types.js';

export interface CreateBorrowRequestInput {
  book_id: string;
  message?: string;
  due_date?: string;
}

export interface ApproveBorrowRequestInput {
  response_message?: string;
  due_date?: string;
}

export interface HandOverInput {
  handover_method?: string;
  handover_location?: string;
  handover_notes?: string;
}

const DETAILS_SELECT = `
  *,
  book:books!book_id (id, title, author, cover_url, genre, condition, is_lendable, owner_id),
  requester:users!requester_id (id, email, display_name, avatar_url)
`;

/**
 * Create a borrow request for a book.
 * RLS enforces: can't request own book, book must be lendable.
 */
export async function createBorrowRequest(input: CreateBorrowRequestInput): Promise<BorrowRequest> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  // Check for existing active request to prevent duplicates
  const { data: existing } = await supabase
    .from('borrow_requests')
    .select('id, status')
    .eq('book_id', input.book_id)
    .eq('requester_id', userData.user.id)
    .in('status', ['pending', 'approved', 'handed_over'])
    .maybeSingle();

  if (existing) {
    throw new Error(`You already have a ${existing.status} request for this book`);
  }

  const { data, error } = await supabase
    .from('borrow_requests')
    .insert({
      book_id: input.book_id,
      requester_id: userData.user.id,
      message: input.message || null,
      due_date: input.due_date || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}

/**
 * Get incoming requests (for books the current user owns).
 */
export async function getIncomingRequests(): Promise<BorrowRequestWithDetails[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  // First get book IDs owned by user
  const { data: ownedBooks, error: booksError } = await supabase
    .from('books')
    .select('id')
    .eq('owner_id', userData.user.id);

  if (booksError) throw booksError;
  if (!ownedBooks || ownedBooks.length === 0) return [];

  const bookIds = ownedBooks.map((b) => b.id);

  const { data, error } = await supabase
    .from('borrow_requests')
    .select(DETAILS_SELECT)
    .in('book_id', bookIds)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as BorrowRequestWithDetails[];
}

/**
 * Get outgoing requests (requests made by the current user).
 */
export async function getOutgoingRequests(): Promise<BorrowRequestWithDetails[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('borrow_requests')
    .select(DETAILS_SELECT)
    .eq('requester_id', userData.user.id)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as BorrowRequestWithDetails[];
}

/**
 * Get a single borrow request with details.
 */
export async function getBorrowRequest(id: string): Promise<BorrowRequestWithDetails> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(DETAILS_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BorrowRequestWithDetails;
}

/**
 * Get active borrow request for a book by the current user (pending or approved).
 */
export async function getActiveRequestForBook(bookId: string): Promise<BorrowRequest | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('borrow_requests')
    .select('*')
    .eq('book_id', bookId)
    .eq('requester_id', userData.user.id)
    .in('status', ['pending', 'approved', 'handed_over'])
    .maybeSingle();

  if (error) throw error;
  return data as BorrowRequest | null;
}

/**
 * Approve a pending borrow request (book owner action).
 * Trigger validates: pending -> approved is valid.
 */
export async function approveBorrowRequest(
  id: string,
  input?: ApproveBorrowRequestInput,
): Promise<BorrowRequest> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({
      status: 'approved',
      response_message: input?.response_message || null,
      due_date: input?.due_date || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}

/**
 * Deny a pending borrow request (book owner action).
 */
export async function denyBorrowRequest(
  id: string,
  responseMessage?: string,
): Promise<BorrowRequest> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({
      status: 'denied',
      response_message: responseMessage || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}

/**
 * Cancel a borrow request (requester action, valid from pending or approved).
 */
export async function cancelBorrowRequest(id: string): Promise<BorrowRequest> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}

/**
 * Mark a request as handed over (book owner confirms book given to borrower).
 */
export async function handOverBook(id: string, input?: HandOverInput): Promise<BorrowRequest> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({
      status: 'handed_over',
      handover_method: input?.handover_method || null,
      handover_location: input?.handover_location || null,
      handover_date: new Date().toISOString(),
      handover_notes: input?.handover_notes || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}

/**
 * Mark a book as returned (book owner confirms return).
 */
export async function markReturned(id: string, returnNotes?: string): Promise<BorrowRequest> {
  const { data, error } = await supabase
    .from('borrow_requests')
    .update({
      status: 'returned',
      return_notes: returnNotes || null,
      returned_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BorrowRequest;
}
