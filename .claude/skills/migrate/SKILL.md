---
name: migrate
description: Run unapplied SQL migrations against the Supabase project. Reads supabase/migrations/, tracks what's been applied, and runs new ones in order.
user-invocable: true
---

# /migrate

Apply SQL migrations to your Supabase project.

## How it works

1. Read all `.sql` files in `supabase/migrations/` sorted by filename (numeric prefix order)
2. Check `.supabase-migrations-applied` for already-applied migrations
3. Show the user which migrations are pending
4. For each pending migration, read the SQL and apply it via `supabase db execute` or the Management API
5. Record applied migrations

## Steps

### Step 1: Detect Supabase project

```bash
# Check for Supabase CLI
which supabase 2>/dev/null && echo "SUPABASE_CLI=true" || echo "SUPABASE_CLI=false"

# Check for project ref in env or config
grep -r "SUPABASE_URL" apps/web/.env.local 2>/dev/null | head -1
```

If Supabase CLI is not installed, fall back to asking the user to paste the SQL
into the Supabase Dashboard SQL Editor. Show the SQL content and a clear instruction.

### Step 2: List migrations

```bash
ls -1 supabase/migrations/*.sql 2>/dev/null | sort
```

### Step 3: Check applied state

Read `.supabase-migrations-applied` if it exists. This is a simple text file with
one migration filename per line.

```bash
cat .supabase-migrations-applied 2>/dev/null || echo "NO_TRACKING_FILE"
```

### Step 4: Identify pending migrations

Compare the migration files against the applied list. Show the user:

```
MIGRATIONS:
  [APPLIED] 001_initial_schema.sql
  [PENDING] 002_add_book_covers.sql
  [PENDING] 003_add_communities.sql
```

If no pending migrations, say "All migrations applied." and stop.

### Step 5: Apply pending migrations

Use AskUserQuestion to confirm before applying:

> "Found N pending migration(s). Apply them now?"
> A) Apply all pending migrations
> B) Show SQL first, then apply
> C) Cancel

If Supabase CLI is available and linked:
```bash
supabase db execute --file supabase/migrations/{filename}.sql
```

If Supabase CLI is NOT available:
Read each pending migration file and display the SQL to the user with instructions:
"Copy this SQL and run it in your Supabase Dashboard > SQL Editor"

After each migration is applied (or confirmed by user), append the filename to
`.supabase-migrations-applied`:

```bash
echo "{filename}" >> .supabase-migrations-applied
```

### Step 6: Verify

After all migrations are applied, show a summary:

```
MIGRATION COMPLETE:
  Applied: N migration(s)
  Total:   M migration(s)
  All up to date.
```

## Notes

- Migrations run in filename order (001, 002, 003...)
- Each migration should be idempotent where possible (use IF NOT EXISTS, CREATE OR REPLACE)
- `.supabase-migrations-applied` is gitignored (local tracking only, each developer tracks their own state)
- If a migration fails, STOP immediately and show the error. Do not continue with subsequent migrations.
- Do NOT record a failed migration in `.supabase-migrations-applied`. Only record successful ones.
- If a migration fails partially (some statements succeeded, some failed), warn the user:
  "Migration {filename} partially failed. You may need to manually clean up in the Supabase
  SQL Editor before retrying. Check which tables/columns were created and drop them if needed."
- Offer rollback guidance: show the user which tables/functions/policies were created by the
  failed migration so they know what to clean up manually.
