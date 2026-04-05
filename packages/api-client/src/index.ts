// Auth
export {
  getCurrentUser,
  getSession,
  onAuthStateChange,
  resetPassword,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from './auth.js';
export type { BookSearchResult } from './bookSearch.js';
// Book Search
export { mapCategoryToGenre, searchBooks } from './bookSearch.js';
export type { BookFilters } from './books.js';
// Books
export {
  createBook,
  deleteBook,
  getAvailableBooks,
  getBook,
  getBooks,
  getUserBooks,
  updateBook,
} from './books.js';

// Types
export type {
  AuthUser,
  Book,
  BookCondition,
  BookWithOwner,
  BorrowRequest,
  BorrowRequestStatus,
  BorrowRequestWithDetails,
  CreateBookInput,
  Message,
  Notification,
  NotificationType,
  Review,
  Session,
  SignInCredentials,
  SignUpCredentials,
  UpdateBookInput,
  User,
} from './types.js';

export {
  BOOK_CONDITIONS,
  BOOK_GENRES,
  BORROW_REQUEST_STATUSES,
  NOTIFICATION_TYPES,
} from './types.js';
