// Auth
export {
  signUp,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  onAuthStateChange,
  resetPassword,
  updatePassword,
} from './auth.js';

// Types
export type {
  User,
  Book,
  BorrowRequest,
  Message,
  Review,
  Notification,
  AuthUser,
  Session,
  SignUpCredentials,
  SignInCredentials,
  CreateBookInput,
  UpdateBookInput,
  BookWithOwner,
  BorrowRequestWithDetails,
  BookCondition,
  BorrowRequestStatus,
  NotificationType,
} from './types.js';

export {
  BOOK_CONDITIONS,
  BORROW_REQUEST_STATUSES,
  BOOK_GENRES,
  NOTIFICATION_TYPES,
} from './types.js';
