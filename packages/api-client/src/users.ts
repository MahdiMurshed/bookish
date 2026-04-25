/**
 * Users abstraction layer
 *
 * Profile reads (getUser), profile writes (updateUser, RLS-scoped to
 * auth.uid() = id via users_update), per-user stat aggregations
 * (getUserStats), and community-wide counters (getCommunityStats, backed by
 * the SECURITY DEFINER community_stats() RPC introduced in migration 007).
 *
 * RLS notes:
 *   - users_select: any authenticated user can read any profile
 *   - users_update: auth.uid() = id (only the user can edit themselves)
 *   - getUserStats: borrow_requests / books filters are clamped through RLS,
 *     so even if the function is called with another user's id the lent_out /
 *     borrowed counts will return 0 for non-participants. The page only ever
 *     calls it for the current user.
 */

import { supabase } from './supabaseClient.js';
import type { User } from './types.js';

export interface UpdateUserInput {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface UserStats {
  books_owned: number;
  books_lent_out: number;
  books_borrowed: number;
  reviews_written: number;
  reviews_received: number;
}

export interface CommunityStats {
  books_count: number;
  members_count: number;
  completed_borrows_count: number;
}

export async function getUser(userId: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
  const patch: Record<string, unknown> = {};
  if (input.display_name !== undefined) patch.display_name = input.display_name;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const [booksOwned, booksLentOut, booksBorrowed, reviewsWritten, reviewsReceived] =
    await Promise.all([
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      // !inner forces the embed to act as an inner join so the books.owner_id
      // filter actually narrows the count rather than being a no-op outer join.
      supabase
        .from('borrow_requests')
        .select('id, books!inner(owner_id)', { count: 'exact', head: true })
        .eq('status', 'handed_over')
        .eq('books.owner_id', userId),
      supabase
        .from('borrow_requests')
        .select('id', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .eq('status', 'handed_over'),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('reviewer_id', userId),
      supabase
        .from('reviews')
        .select('id, books!inner(owner_id)', { count: 'exact', head: true })
        .eq('books.owner_id', userId),
    ]);

  for (const result of [booksOwned, booksLentOut, booksBorrowed, reviewsWritten, reviewsReceived]) {
    if (result.error) throw result.error;
  }

  return {
    books_owned: booksOwned.count ?? 0,
    books_lent_out: booksLentOut.count ?? 0,
    books_borrowed: booksBorrowed.count ?? 0,
    reviews_written: reviewsWritten.count ?? 0,
    reviews_received: reviewsReceived.count ?? 0,
  };
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const { data, error } = await supabase.rpc('community_stats').single();
  if (error) throw error;

  // bigint may come back as number (small) or string (very large). Cast both.
  const row = (data ?? {}) as Partial<{
    books_count: number | string;
    members_count: number | string;
    completed_borrows_count: number | string;
  }>;
  return {
    books_count: Number(row.books_count) || 0,
    members_count: Number(row.members_count) || 0,
    completed_borrows_count: Number(row.completed_borrows_count) || 0,
  };
}
