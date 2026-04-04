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
packages/ui/           → shadcn/ui components + Tailwind CSS 4
packages/eslint-config/
packages/typescript-config/
supabase/migrations/   → SQL migrations (run manually in Supabase SQL Editor)
```

## Rules

### Backend Abstraction
- **Never import Supabase directly in apps.** All calls go through `@repo/api-client`.
- Each resource gets its own file: `books.ts`, `auth.ts`, `borrowRequests.ts`, etc.
- Functions throw on error (not return error objects).

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

Migration: `supabase/migrations/001_initial_schema.sql`
Run in Supabase SQL Editor (not automated).

## Build Phases

See `PROGRESS.md` for current status and what's done/remaining.

## Testing

```bash
pnpm --filter @repo/api-client test          # unit tests
pnpm --filter @repo/api-client test:coverage  # with coverage
```

Framework: Vitest. Tests in `packages/api-client/src/__tests__/`.

## Session Continuity

**On every new session start:**
1. Read `PROGRESS.md` for phase status
2. Read `.claude/session-log.md` for what the last session did
3. Run `git log --oneline -10` for recent commits
4. Announce what you see: "Last session: [summary]. Current phase: [phase]. Picking up from [where]."

**Before ending a session (when the user says goodbye, closes the chat, or you finish a task):**
1. Update `.claude/session-log.md` with what was accomplished this session
2. Update `PROGRESS.md` if phase status changed

### Session Log Format (`.claude/session-log.md`)

```markdown
## Last Session — {YYYY-MM-DD}
Branch: {branch name}
Phase: {current phase}

### What was done
- {bullet points of what was accomplished}

### What's next
- {what should be done next}

### Open issues
- {any unresolved problems or decisions}
```

Overwrite the file each session (only the most recent matters, git log has the history).

## Reference

The existing app at `../bookshare` is the pattern reference. Same tech stack, same conventions, but this project is intentionally simpler.
