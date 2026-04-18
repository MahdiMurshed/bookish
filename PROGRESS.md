# BookShare V2 — Build Progress

Plan: `~/.claude/plans/frolicking-snuggling-swing.md`
Design doc: `~/.gstack/projects/bookish/mahdimurshed-unknown-design-20260404-054643.md`

## Phases

- [x] **Phase 1: Scaffold + Auth** — Turborepo init, packages config, Supabase migration (6 tables + RLS + triggers), auth (signUp/signIn/signOut/resetPassword), AuthContext, ProtectedRoute/PublicRoute, SignIn/SignUp/ResetPassword pages, Header + dark mode
- [x] **Phase 2: Books + Bookshelf** — api-client books CRUD + Google Books search, shared schemas, useBooks hooks, MyLibrary page, Browse page, BookCard/BookGrid/AddBookForm
- [x] **Phase 3: Borrowing** — api-client borrowRequests + notifications, useBorrowRequests hooks, BookDetail page (request form), Requests inbox page
- [x] **Phase 4: Chat** — per-request chat (messages), Realtime delivery, optimistic updates, mark-read, notifications. Reviews/profile/home moved to Phase 4.5.
- [ ] **Phase 4.5: Reviews + Profile + Home** — reviews (create after return + getForBook), Profile page (edit + stats), Home landing page (hero + community stats)
- [x] **Phase 5: Messages & Notifications UX** — dedicated `/messages` route (inbox + thread + composer) replacing the per-book embedded chat, header Mail nav + typed unread-message badge, cross-page sonner toast, role-aware quick-action bar, mobile single-column layout, plus two RLS fixes (messages_update policy + column-scoped UPDATE grants on messages and notifications).
- [ ] **Phase 6: Polish + Deploy** — loading/error/empty states polish, auth error handler, book delete guard, Vercel SPA rewrites, api-client unit tests, CLAUDE.md. (Was "Phase 5: Polish + Deploy" in the original plan; responsive design landed with Phase 5's mobile pass.)

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
**Phase 5 COMPLETE.** Branch: phase-5/messages (PR #9, two rounds of Claude review verified).

### Phase 5 Deliverables (Messages & Notifications UX)
- Plan: `~/.claude/plans/spicy-prancing-wadler.md`. Handoff: `~/Downloads/design_handoff_messages 2/`.
- 8 implementation phases (A–H) shipped as separate commits with approval between each, plus 2 review rounds and 1 dogfooding fix batch.
- api-client: `getThreads` + `getThread` client-side projection over `borrow_requests × books × users × messages` (single PostgREST embed call, RLS-scoped, no DB migration for the projection itself). Extended `markMessagesAsRead` to dual-write `messages.read` + matching `new_chat_message` `notifications.read`. Added `getUnreadCountByTypes` helper. New `Thread` / `ThreadBook` / `ThreadLastMessage` types.
- hooks: `useThreads` / `useThread`. Refactored `useNotifications.tsx` — typed `useUnreadMessageCount` / `useUnreadRequestCount`, consolidated subscription handler that invalidates threads + messages + notifications AND fires the cross-page toast from a single realtime channel (merged from a broken two-channel setup that crashed /messages at mount).
- lib helpers: `avatarPalette.ts` (deterministic book-id → bg/fg pair, 10-pair palette mirrored from handoff), `threadSystemEvents.ts` (derive "Status changed to …" events from `borrow_requests` timestamps without a schema change), `threadTimeline.ts` (merge synthetic opening bubble + real messages + system events, chronological sort, date headers on day boundaries, showTimestamp precomputation).
- UI primitives: added shadcn `avatar`, `card`, `scroll-area`, `separator`, `sonner` to `@repo/ui`.
- pages: `/messages` and `/messages/:threadId` routes (React Router, under existing `ProtectedRoute`). Mounted `<Toaster />` at App root.
- components: `Messages/Inbox/{InboxList,ConversationRow,statusBadge}` — unread-tinted rows, search filter, avatars with book-derived palette + green unread dot, status badges, unread count pills. `Messages/Thread/{ThreadPanel,ThreadHeader,MessagesList,MessageBubble,Composer,SystemEvent,EmptyThread,QuickActions}` — mini book cover with `BookOpen` fallback, me-vs-them bubble tails, sender-run-aware timestamps, role-aware Approve/Deny/Mark Handed Over/Mark Returned bar wired to existing borrow-request mutations with `toast.error` on failure. `Toast/NewMessageToast` — 340px card with sibling-button layout (no nested interactive elements).
- Mobile ≤768px: two-column grid collapses to single column, ThreadHeader gets a mobile-only `ArrowLeft` back button.
- Header: `Mail` nav item between Requests and Profile driven by `useUnreadMessageCount`; repointed Requests badge to `useUnreadRequestCount` so each surface counts only its own notifications.
- Legacy removed: `ChatThread.tsx` and the old `Messages/MessageBubble.tsx`. `BookDetail` and `BorrowRequestCard` now link to `/messages/<requestId>` instead of embedding chat.
- Migrations: 004 (`messages_update` RLS policy — had been missing since Phase 3, silently broke `markMessagesAsRead` in production), 005 (column-scoped `UPDATE(read)` on messages), 006 (column-scoped `UPDATE(read)` on notifications mirroring 005 after round-2 review). All three applied to remote Supabase; `supabase migration list` shows 001–006 tracked Local | Remote.
- Tests: 48 total. `packages/api-client`: projection shape, markMessagesAsRead dual-write lockstep, auth guard. `apps/web`: palette determinism + initials, system events derivation, timeline builder (synthetic bubble + sender runs + date headers), inbox filter, exhaustive status badge mapping, pickQuickAction role/status matrix. Vitest now configured in both packages.
- TODOS.md: deferred pagination, virtualization, hook-level tests, typing indicators, attachments, archived filter, toast stacking, 99+ badge cap, React Router pathname ref.
- Review history: `/plan-eng-review` ran at plan time (4 issues raised, all resolved in the plan before implementation). Two `/review` passes during implementation (4 auto-fixes + 1 deferred). Two Claude GitHub review rounds on PR #9 (5 findings round 1 → 4 fixed + 1 deferred; 1 nit round 2 → fixed).

### Phase 4 Deliverables (Chat)
- api-client: messages.ts (getMessagesByRequest, sendMessage with createNotification side-effect, subscribeToMessages with refetch fallback, markMessagesAsRead) + createNotification helper on notifications.ts
- shared: sendMessageSchema (Zod, 1-2000 chars) + ACTIVE_BORROW_STATUSES single source of truth
- hooks: useMessages (query + optimistic mutation with rollback + Realtime subscription + in-place mark-read setQueryData)
- components: MessageBubble + ChatThread (shadcn-styled, react-hook-form + Zod composer, Enter-to-send, auto-scroll, mark-read on mount via ref pattern)
- BookDetail: ChatThread inline under active-request notice (requester side)
- BorrowRequestCard: collapsible Chat toggle for active statuses (owner side)
- migrations: 002 notification INSERT RLS policy + 003 supabase_realtime publication (also retroactively fixed Phase 3 notification subscription which had been silently no-op'ing)
- Subscribe error logging on both messages and notifications channels
- Two rounds of PR review: 5 fixed (realtime fallback, in-place mark-read, optimisticId sentinel, shared status constant, subscribe error handling), 2 deferred to Phase 5
- **Scope narrowed mid-phase:** reviews, profile, home landing moved to new Phase 4.5

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
