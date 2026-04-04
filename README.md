# BookShare

A book lending platform for friends and book clubs. Add your books, mark them as lendable, and borrow from each other.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, TailwindCSS 4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Data Fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Monorepo:** Turborepo + pnpm

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 10+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone and install
git clone git@github.com:MahdiMurshed/bookish.git
cd bookish
pnpm install

# Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase URL and anon key

# Run the database migration
# Go to Supabase Dashboard > SQL Editor
# Paste and run: supabase/migrations/001_initial_schema.sql

# Start development
pnpm dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

## Project Structure

```
bookish/
├── apps/web/              # React app
├── packages/
│   ├── api-client/        # Supabase abstraction layer
│   ├── shared/            # Zod schemas and constants
│   ├── ui/                # shadcn/ui components
│   ├── eslint-config/     # Shared ESLint rules
│   └── typescript-config/ # Shared TypeScript config
└── supabase/migrations/   # Database schema
```

All database calls go through `@repo/api-client`. Never import Supabase directly in the app.

## Features

- Email/password authentication with password reset
- Personal book library with Google Books search
- Community bookshelf (browse all lendable books)
- Borrow request workflow (request, approve, hand over, return)
- Per-request chat between borrower and owner
- Book reviews and ratings
- Dark mode

## Build Progress

See [PROGRESS.md](./PROGRESS.md) for the current phase and what's been built.
