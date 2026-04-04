---
name: phase
description: Start the next build phase. Reads PROGRESS.md, creates a feature branch, sets up tasks, and shows what to build.
user-invocable: true
---

# /phase

Start the next build phase from PROGRESS.md.

## Usage

- `/phase` — start the next uncompleted phase
- `/phase 3` — start a specific phase
- `/phase complete` — mark the current phase as done, update PROGRESS.md, commit, and prepare for the next one

## Steps

### Step 1: Read current state

```bash
cat PROGRESS.md
```

Parse the phases list. Identify:
- Which phases are checked `[x]` (completed)
- Which is the next unchecked `[ ]` phase
- Current status line

If the user specified a phase number, use that instead.

### Step 2: Starting a phase

When starting a new phase:

1. **Ensure clean working tree:**
   ```bash
   git status --porcelain
   ```
   If dirty, ask the user to commit or stash first.

2. **Switch to master and pull latest:**
   ```bash
   git checkout master
   git pull origin master
   ```

3. **Create feature branch:**
   Branch naming: `phase-{N}/{kebab-case-name}`
   Examples: `phase-2/books-and-bookshelf`, `phase-3/borrowing`
   ```bash
   git checkout -b phase-{N}/{name}
   ```

4. **Show the phase scope:**
   Read the phase description from PROGRESS.md and the plan file at
   `~/.claude/plans/frolicking-snuggling-swing.md` (if it exists).

   Display:
   ```
   STARTING PHASE {N}: {Title}
   Branch: phase-{N}/{name}

   Scope:
   - {bullet points from PROGRESS.md and plan}

   Files to create/modify:
   - {list from plan}
   ```

5. **Update PROGRESS.md status line:**
   Change "Current Status" to show the active phase:
   ```
   **Phase {N} IN PROGRESS.** Working on {title}.
   ```

6. **Commit the status update:**
   ```bash
   git add PROGRESS.md
   git commit -m "chore: start phase {N} - {title}"
   ```

### Step 3: Completing a phase (`/phase complete`)

When completing the current phase:

1. **Check for uncommitted changes:**
   ```bash
   git status --porcelain
   ```
   If there are uncommitted changes, STOP and ask the user:
   "You have uncommitted changes. Commit them before marking the phase complete?"
   - A) Commit all changes with a descriptive message, then continue
   - B) Abort — I'll clean up manually
   Do not mark a phase complete with uncommitted work.

2. **Verify build passes:**
   ```bash
   pnpm build --filter web
   pnpm lint
   ```
   If either fails, show the error and stop.

3. **Update PROGRESS.md:**
   - Check off the completed phase: `[x]`
   - Update status line with deliverables summary
   - Note the branch and commit range

4. **Commit the update:**
   ```bash
   git add PROGRESS.md
   git commit -m "chore: complete phase {N} - {title}"
   ```

5. **Push the branch:**
   ```bash
   git push origin phase-{N}/{name}
   ```

6. **Show next steps:**
   ```
   PHASE {N} COMPLETE: {Title}
   Branch: phase-{N}/{name}

   Next steps:
   - Create PR: gh pr create --title "Phase {N}: {Title}"
   - Or merge to master: git checkout master && git merge phase-{N}/{name}
   - Then run /phase to start Phase {N+1}
   ```

## Notes

- Always branch from latest master
- One phase = one branch = one PR
- PROGRESS.md is the source of truth for phase status
- The plan file provides detailed scope for each phase
- If the user says "start phase 2" without using /phase, this skill should still activate
