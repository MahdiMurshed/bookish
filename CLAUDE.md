# BookShare V2

A simplified book lending platform. Rebuild of `../bookshare` with the same tech stack but reduced scope.

## Quick Start

```bash
pnpm install
pnpm dev          # starts Vite dev server at localhost:5173
```

Requires `apps/web/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Architecture

Turborepo monorepo with pnpm workspaces.

```
apps/web/              → React 19 + Vite 7 + TypeScript
packages/api-client/   → Supabase abstraction layer (all DB calls go through here)
packages/shared/       → Zod schemas, constants, types
packages/ui/           → shadcn/ui components + Tailwind CSS 4 (Button, Badge, Input, Label, Tabs, Textarea, Avatar, Card, ScrollArea, Separator, Sonner)
packages/typescript-config/
supabase/migrations/   → SQL migrations. Apply remotely with `supabase db push` (project is linked + tracking table synced through 006). Local Supabase runs via `supabase start`.
```

## Rules

### Backend Abstraction
- **Never import Supabase directly in apps.** All calls go through `@repo/api-client`.
- Each resource gets its own file: `books.ts`, `auth.ts`, `borrowRequests.ts`, etc.
- Functions throw on error (not return error objects).
- **When writing api-client functions, use the Supabase MCP skill** (`/supabase` or the `mcp__plugin_supabase_supabase` tools) to verify correct query syntax, RLS behavior, and Supabase JS SDK usage. The Supabase skill knows the current SDK API and can validate queries against the actual schema.

### Components
- Max ~150 lines per component.
- Business logic goes in custom hooks, not components.
- Named exports for components. Default exports for pages.

### Data Fetching
- TanStack Query for all server state.
- Query key factory pattern:
  ```ts
  export const bookKeys = {
    all: ['books'] as const,
    lists: () => [...bookKeys.all, 'list'] as const,
    list: (userId: string) => [...bookKeys.lists(), userId] as const,
  };
  ```
- Invalidate on `onSuccess`, not `onSettled`.

### Forms
- react-hook-form + Zod schemas from `@repo/shared`.

### Types
- Central types in `packages/api-client/src/types.ts`.
- Use `import type` for type-only imports.

### Naming
- Components: `PascalCase.tsx`
- Hooks: `use*.ts`
- API functions: `getBooks()`, `createBook()`, `deleteBook()`
- Constants: `SCREAMING_SNAKE_CASE`

## Database

6 tables: `users`, `books`, `borrow_requests`, `messages`, `reviews`, `notifications`.
Single community model (all users share one space). Multi-club is V2.

Migrations live in `supabase/migrations/`:
- `001_initial_schema.sql` — tables, RLS, triggers, indexes
- `002_notification_insert_policy.sql` — allows clients to insert their own `new_chat_message` notifications
- `003_realtime_publication.sql` — adds `messages` and `notifications` to `supabase_realtime`
- `004_messages_update_policy.sql` — participant-scoped UPDATE on messages (mark-read)
- `005_messages_update_column_grant.sql` — narrow the messages UPDATE grant to `read` column only
- `006_notifications_update_column_grant.sql` — same column-scoping for notifications

Apply via `supabase db push` (project is linked, tracking table is synced through 006). New migrations get a monotonically numbered filename and push with one command.

## Build Phases

See `PROGRESS.md` for current status and what's done/remaining. Deferred work (pagination, typing indicators, hook-level tests, etc.) lives in `TODOS.md` with what/why/context/depends-on per item.

## Testing

```bash
pnpm --filter @repo/api-client test          # api-client unit tests (projection, dual-write, auth)
pnpm --filter @repo/api-client test:coverage  # with coverage
pnpm --filter web test                        # web unit tests (palette, timeline, inbox filter, quick-action role matrix)
pnpm --filter web test:e2e                    # Playwright e2e against local Supabase
```

Framework: Vitest for unit tests (both `packages/api-client/src/__tests__/` and `apps/web/src/**/__tests__/`). Playwright for e2e (`apps/web/e2e/`).

## Session Continuity

**On every new session start:**
1. Read `PROGRESS.md` for phase status
2. Read `.claude/session-log.md` for what the last session did
3. Run `git log --oneline -10` for recent commits
4. Announce what you see: "Last session: [summary]. Current phase: [phase]. Picking up from [where]."

## Reference

The existing app at `../bookshare` is the pattern reference. Same tech stack, same conventions, but this project is intentionally simpler.
