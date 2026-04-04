## Last Session — 2026-04-04
Branch: local-first-dev
Phase: Phase 1 complete, ready for Phase 2

### What was done
- Set up local Supabase development environment (`supabase init` + `supabase start`)
- Created `supabase/seed.sql` with realistic test data (3 users, 7 books, 4 borrow requests, messages, review, notifications)
- Fixed seed to include `auth.identities` so login/signup works locally
- Updated `apps/web/.env.local` to point at local Supabase (with JWT anon key)
- Fixed `supabase/config.toml` auth redirect port from 3000 to 5173 (Vite port)
- Added `dev:local` script to package.json (opens Docker, waits, starts Supabase + Vite)
- PR #4 open on `local-first-dev` branch with all changes

### What's next
- Merge PR #4 (local-first-dev) to master
- Start Phase 2: Books + Bookshelf
- Phase 2 scope: api-client books CRUD + Google Books search, shared schemas, useBooks hooks, MyLibrary page, Browse page, BookCard/BookGrid/AddBookForm

### Open issues
- PR #4 needs merge before starting Phase 2
- Production `.env.local` values are commented out — remember to swap when deploying
- Supabase CLI is outdated (v2.62.10 vs v2.84.2) — consider upgrading with `brew upgrade supabase`

### Prompt for next session
> I'm working on BookShare V2. Local Supabase dev environment is set up on branch local-first-dev (PR #4). Merge PR #4 to master first, then start Phase 2: Books + Bookshelf. Run /pickup first to see full context, then run /phase to create the phase-2 branch. Phase 2 scope: api-client books.ts (CRUD + getUserBooks + getAvailableBooks), bookSearch.ts (Google Books API), shared book schemas, useBooks hooks with TanStack Query key factory pattern, MyLibrary page, Browse page. Use `pnpm dev:local` to run with local Supabase. Reference ../bookshare for patterns.
