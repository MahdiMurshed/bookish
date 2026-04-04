# BookShare V2 — Build Progress


## Phases

- [x] **Phase 1: Scaffold + Auth** — Turborepo init, packages config, Supabase migration (6 tables + RLS + triggers), auth (signUp/signIn/signOut/resetPassword), AuthContext, ProtectedRoute/PublicRoute, SignIn/SignUp/ResetPassword pages, Header + dark mode
- [ ] **Phase 2: Books + Bookshelf** — api-client books CRUD + Google Books search, shared schemas, useBooks hooks, MyLibrary page, Browse page, BookCard/BookGrid/AddBookForm
- [ ] **Phase 3: Borrowing** — api-client borrowRequests + notifications, useBorrowRequests hooks, BookDetail page (request form), Requests inbox page
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
**Phase 1 COMPLETE and DEPLOYED.** Live at https://bookish-mauve-beta.vercel.app/

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
