import { z } from 'zod';

export const bookConditionSchema = z.enum(['mint', 'excellent', 'good', 'fair', 'poor']);
export type BookCondition = z.infer<typeof bookConditionSchema>;
export const BOOK_CONDITIONS = bookConditionSchema.options;

export const borrowRequestStatusSchema = z.enum([
  'pending', 'approved', 'handed_over', 'returned', 'denied', 'cancelled',
]);
export type BorrowRequestStatus = z.infer<typeof borrowRequestStatusSchema>;
export const BORROW_REQUEST_STATUSES = borrowRequestStatusSchema.options;

export const BOOK_GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
  'Thriller', 'Romance', 'Horror', 'Biography', 'History',
  'Science', 'Technology', 'Self-Help', 'Philosophy', 'Poetry',
  'Children', 'Young Adult', 'Comics', 'Art', 'Cooking',
  'Travel', 'Religion', 'Business', 'Education', 'Other',
] as const;

export const NOTIFICATION_TYPES = [
  'borrow_requested', 'borrow_approved', 'borrow_denied',
  'borrow_handed_over', 'borrow_returned', 'new_chat_message',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
