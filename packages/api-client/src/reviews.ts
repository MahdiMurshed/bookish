/**
 * Reviews abstraction layer
 *
 * Reviews are written by the borrower (requester) after a borrow has been
 * marked returned. RLS enforces:
 *   - reviews_select: any authenticated user can read.
 *   - reviews_insert: reviewer_id = auth.uid() AND the borrow_request must
 *     have status='returned' AND requester_id = auth.uid().
 *   - reviews_unique_per_borrow: one review per (reviewer_id, borrow_request_id).
 */

import { supabase } from './supabaseClient.js';
import type { Review, ReviewWithReviewer } from './types.js';

export interface CreateReviewInput {
  book_id: string;
  borrow_request_id: string;
  rating: number;
  content?: string;
}

const REVIEWER_SELECT = `
  *,
  reviewer:users!reviewer_id (id, email, display_name, avatar_url)
`;

/**
 * Create a review for a returned borrow.
 * RLS rejects the insert if status != 'returned' or reviewer is not the requester.
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const trimmed = input.content?.trim() || null;

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      book_id: input.book_id,
      reviewer_id: userData.user.id,
      borrow_request_id: input.borrow_request_id,
      rating: input.rating,
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Get all reviews for a book, newest first, with reviewer info embedded.
 */
export async function getReviewsForBook(bookId: string): Promise<ReviewWithReviewer[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEWER_SELECT)
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ReviewWithReviewer[];
}

/**
 * Get the current user's review for a specific borrow request, if it exists.
 * Used to gate the "Write a review" CTA so we don't prompt twice.
 */
export async function getMyReviewForRequest(borrowRequestId: string): Promise<Review | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('borrow_request_id', borrowRequestId)
    .eq('reviewer_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Review | null;
}

/**
 * Get all reviews written by a user, newest first. Used on Profile.
 */
export async function getReviewsByReviewer(reviewerId: string): Promise<ReviewWithReviewer[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEWER_SELECT)
    .eq('reviewer_id', reviewerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ReviewWithReviewer[];
}
