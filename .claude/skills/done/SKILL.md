---
name: done
description: End-of-session wrap-up. Updates session log with what was done, what's next, and open issues. Run before closing a chat.
user-invocable: true
---

# /done

Wrap up the current session and save context for the next one.

## Steps

1. **Gather context:**
   - Read `PROGRESS.md` for current phase
   - Run `git log --oneline -10` for recent commits this session
   - Run `git branch --show-current` for current branch
   - Run `git status --porcelain` to check for uncommitted work

2. **Warn about uncommitted work:**
   If there are uncommitted changes, warn: "You have uncommitted changes. Commit them before ending?"
   - A) Commit with a descriptive message
   - B) Continue without committing

3. **Write `.claude/session-log.md`:**
   Overwrite with the current session's summary using this format:

   ```markdown
   ## Last Session — {YYYY-MM-DD}
   Branch: {current branch}
   Phase: {current phase from PROGRESS.md}

   ### What was done
   - {summarize from git log commits made this session}

   ### What's next
   - {based on PROGRESS.md and what's left in the current phase}

   ### Open issues
   - {any unresolved problems, failing tests, or pending decisions}

   ### Prompt for next session
   > {A ready-to-paste prompt the user can send in the next chat to continue
   > exactly where this session left off. Be specific: include the phase,
   > branch, exact task to start with, and any context the next session
   > needs. Example: "I'm on branch phase-2/books. Continue Phase 2 by
   > building the books CRUD in api-client/src/books.ts and the Google
   > Books search in api-client/src/bookSearch.ts. Run /pickup first to
   > see full context."}
   ```

4. **Commit the session log:**
   ```bash
   git add .claude/session-log.md
   git commit -m "chore: update session log"
   ```

5. **Push if on a feature branch:**
   ```bash
   git push origin {branch}
   ```

6. **Say goodbye:**
   Show a one-line summary: "Session saved. Next time: {what to do next}."
