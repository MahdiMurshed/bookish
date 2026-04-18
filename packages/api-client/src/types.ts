/**
 * Core data models for BookShare V2
 * These types represent the database schema and are shared across all apps
 */

export type {
  BookCondition,
  BorrowRequestStatus,
  NotificationType,
} from '@repo/shared';
export {
  ACTIVE_BORROW_STATUSES,
  BOOK_CONDITIONS,
  BOOK_GENRES,
  BORROW_REQUEST_STATUSES,
  NOTIFICATION_TYPES,
} from '@repo/shared';

import type { BookCondition, BorrowRequestStatus, NotificationType } from '@repo/shared';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  genre: string | null;
  condition: BookCondition | null;
  description: string | null;
  google_books_id: string | null;
  is_lendable: boolean;
  created_at: string;
  updated_at: string;
}

export interface BorrowRequest {
  id: string;
  book_id: string;
  requester_id: string;
  status: BorrowRequestStatus;
  message: string | null;
  response_message: string | null;
  due_date: string | null;
  handover_method: string | null;
  handover_location: string | null;
  handover_date: string | null;
  handover_notes: string | null;
  return_method: string | null;
  return_location: string | null;
  return_notes: string | null;
  requested_at: string;
  responded_at: string | null;
  returned_at: string | null;
}

export interface Message {
  id: string;
  borrow_request_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export type MessageSender = Pick<User, 'id' | 'email' | 'display_name' | 'avatar_url'>;

export interface MessageWithSender extends Message {
  sender: MessageSender;
}

export interface Review {
  id: string;
  book_id: string;
  reviewer_id: string;
  borrow_request_id: string;
  rating: number;
  content: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// Input types for mutations
export interface CreateBookInput {
  title: string;
  author: string;
  isbn?: string;
  cover_url?: string;
  genre?: string;
  condition?: BookCondition;
  description?: string;
  google_books_id?: string;
  is_lendable?: boolean;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {}

export interface BookWithOwner extends Book {
  owner: User;
}

export interface BorrowRequestWithDetails extends BorrowRequest {
  book: Book;
  requester: User;
}

// Thread = client-side projection over borrow_requests + books + users + messages.
// Not a stored entity. Produced by getThreads/getThread.
export type ThreadBook = Pick<Book, 'id' | 'owner_id' | 'title' | 'author' | 'cover_url'>;

export interface ThreadLastMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Thread {
  borrow_request: BorrowRequest;
  book: ThreadBook;
  counterparty: MessageSender;
  last_message: ThreadLastMessage | null;
  unread_count: number;
  last_activity_at: string;
}
