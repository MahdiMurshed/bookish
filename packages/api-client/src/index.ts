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

// Borrow Requests
export type {
  ApproveBorrowRequestInput,
  CreateBorrowRequestInput,
  HandOverInput,
} from './borrowRequests.js';
export {
  approveBorrowRequest,
  cancelBorrowRequest,
  createBorrowRequest,
  denyBorrowRequest,
  getActiveRequestForBook,
  getBorrowRequest,
  getIncomingRequests,
  getOutgoingRequests,
  handOverBook,
  markReturned,
} from './borrowRequests.js';

// Messages
export {
  getMessagesByRequest,
  markMessagesAsRead,
  sendMessage,
  subscribeToMessages,
} from './messages.js';

// Notifications
export type { CreateNotificationInput } from './notifications.js';
export {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from './notifications.js';

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
  MessageSender,
  MessageWithSender,
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
