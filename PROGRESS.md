# BookShare V2 — Build Progress

Plan: `~/.claude/plans/frolicking-snuggling-swing.md`
Design doc: `~/.gstack/projects/bookish/mahdimurshed-unknown-design-20260404-054643.md`

## Phases

- [x] **Phase 1: Scaffold + Auth** — Turborepo init, packages config, Supabase migration (6 tables + RLS + triggers), auth (signUp/signIn/signOut/resetPassword), AuthContext, ProtectedRoute/PublicRoute, SignIn/SignUp/ResetPassword pages, Header + dark mode
- [x] **Phase 2: Books + Bookshelf** — api-client books CRUD + Google Books search, shared schemas, useBooks hooks, MyLibrary page, Browse page, BookCard/BookGrid/AddBookForm
- [x] **Phase 3: Borrowing** — api-client borrowRequests + notifications, useBorrowRequests hooks, BookDetail page (request form), Requests inbox page
- [ ] **Phase 4: Social** — per-request chat (messages), reviews, profile page, Home landing page with stats
- [ ] **Phase 5: Polish + Deploy** — responsive design, loading/error/empty states, auth error handler, book delete guard, Vercel deploy, CLAUDE.md

## Key Decisions
- Email/password auth (not magic link)
- Google Books API (not OpenLibrary)
- Per-request chat threads (not community chat)
- Single community model (no clubs, V2 expansion)
- Handover/return tracking included
- Dark mode included
- Password reset included
- Home landing page included

## Current Status
**Phase 3 COMPLETE.** Branch: phase-3/borrowing (PR #6)

### Phase 3 Deliverables
- api-client: borrowRequests.ts (create, approve, deny, cancel, handOver, markReturned, getIncoming/Outgoing, duplicate prevention)
- api-client: notifications.ts (get, getUnreadCount, markRead, markAllRead, Realtime subscribe)
- hooks: useBorrowRequests (7 hooks with key factory), useNotifications (5 hooks + Realtime subscription)
- pages: BookDetail (/books/:id with cover, metadata, borrow request form, active request status, error feedback)
- pages: Requests (shadcn Tabs for incoming/outgoing, pending count badge)
- components: BorrowRequestCard (Badge status, book thumbnail, request actions)
- components: BorrowRequestForm (react-hook-form + Zod, success message)
- components: RequestActions (approve/deny intent tracking, hand over, mark returned, cancel)
- Header: unread notification badge on Requests link, Realtime subscription
- shadcn/ui: installed Button, Badge, Tabs, Input, Textarea, Label components
- E2E: mocked Google Books API, increased CI timeouts, pre-push hook runs tests
- PR template: scope/deferred sections for Claude bot reviewer context
- Two rounds of PR review fixes addressed

### Phase 2 Deliverables
- api-client: books.ts (CRUD, getUserBooks, getAvailableBooks with owner join)
- api-client: bookSearch.ts (Google Books API search, genre mapping, HTTPS fix, optional API key)
- hooks: useBooks.ts (6 hooks with TanStack Query key factory), useDebounce.ts
- pages: MyLibrary (add/edit/delete books, toggle lendable, error feedback), Browse (community grid with debounced search + genre filter)
- components: BookCard, BookGrid, BookFilters, AddBookForm (Google Books search + manual entry)
- E2E tests: 6 Playwright tests (auth, browse, my-library)
- CI pipeline: GitHub Actions (lint + build + Supabase + Playwright)
- Two rounds of PR review fixes addressed

### Phase 1 Deliverables
- Turborepo monorepo with pnpm workspaces
- 5 packages: api-client, shared, ui, eslint-config, typescript-config
- Supabase migration: 6 tables + RLS + 3 triggers + 7 indexes
- api-client: auth module (signUp, signIn, signOut, resetPassword, updatePassword, onAuthStateChange)
- api-client: types (User, Book, BorrowRequest, Message, Review, Notification, AuthUser)
- shared: Zod schemas (book, borrowRequest) + constants (genres, conditions, statuses)
- web app: AuthContext, ProtectedRoute, PublicRoute
- web app: SignIn, SignUp, ResetPassword pages
- web app: Header with nav + ThemeToggle (dark mode)
- TanStack Query + React Router configured
- Placeholder routes for Phase 2+ pages
