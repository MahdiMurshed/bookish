---
name: pr-review
description: |
  Create PR, trigger @claude review via GitHub Action, poll for response, triage
  findings, and fix issues. Runs polling in background while you work. Use when
  asked to "review this PR", "get a PR review", "run pr-review", or after finishing
  a phase of work and wanting external review before merging.
user-invocable: true
---

# /pr-review

Push, create PR, trigger Claude GitHub review, triage findings, and fix them.

## Usage

- `/pr-review` — push current branch, create PR, trigger review, poll in background
- `/pr-review https://github.com/.../pull/5` — use existing PR, trigger review on it
- `/pr-review 5` — use PR #5 directly
- `/pr-review address` — read the saved task list and fix remaining items
- `/pr-review re-review` — trigger a fresh review after fixes have been pushed

## Step 1: Determine PR

Detect the repo owner/repo from git:
```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
BRANCH=$(git branch --show-current)
```

**If a PR URL or number is given** (e.g. `/pr-review https://github.com/.../pull/5` or `/pr-review 5`):
Extract the PR number. Use that PR directly. Skip push and creation.

**If `address` is given:**
Jump to Step 5.

**If `re-review` is given:**
Push the branch, find the existing PR number, then jump to Step 2.

**If no argument given:**

1. Push the current branch:
   ```bash
   git push origin $BRANCH
   ```

2. Check if PR already exists:
   ```bash
   gh pr view --json number --jq .number 2>/dev/null
   ```

3. If no PR exists, create one with scope context from PROGRESS.md:
   - Read `PROGRESS.md` to find the current phase, its scope, and what's deferred
   - Read the commit log: `git log origin/master..HEAD --oneline`
   - Build the PR body using the `.github/PULL_REQUEST_TEMPLATE.md` structure:
     - **Scope section:** list what this phase implements (from PROGRESS.md)
     - **NOT in scope section:** list items from later phases that reviewers
       should NOT flag (especially Phase 5 items like tests, polish, deploy)
     - Include the "For reviewers" note so the Claude bot knows what to skip
   - Create the PR:
     ```bash
     gh pr create --title "Phase {N}: {Title}" --body "$BODY" --base master
     ```

4. If PR already exists, check if its body is still the blank template. If so,
   update it with scope context using:
   ```bash
   gh api repos/$REPO/pulls/$PR_NUMBER -X PATCH -f body="$BODY"
   ```
   This gives the Claude bot reviewer the context it needs to avoid flagging
   intentionally deferred work.

## Step 2: Verify Claude bot and trigger review

Before triggering, verify the Claude GitHub App can respond. Check for prior
bot comments or just proceed — if the comment gets no response after polling,
the skill will inform the user.

```bash
PR_NUMBER={number}
gh pr comment $PR_NUMBER --body "@claude review"
```

Tell the user: **"Claude review triggered on PR #$PR_NUMBER. I'll notify you when it's ready. Keep working."**

## Step 3: Poll in background

Launch a background agent that polls for the review response. The background
agent only polls and saves the raw review — it does NOT triage (triage needs
full codebase context from the main conversation).

The background agent should:

1. Poll every 30 seconds for up to 8 minutes (16 attempts). Large diffs can
   take several minutes for Claude to review.
   ```bash
   gh api repos/$REPO/issues/$PR_NUMBER/comments \
     --jq '.[] | select(.user.login == "claude[bot]") | .body' 2>/dev/null
   ```

2. A review is complete when the response contains "### Summary" or
   "### What's Good" or a substantial multi-section response (more than
   a few lines).

3. When complete, save the full review to `.claude/pr-reviews/pr-{number}-review.md`.

4. Return the review text so the main conversation can triage it.

If 8 minutes pass without a complete review, save whatever partial response
exists and return a message:
"Claude review for PR #$PR_NUMBER is still in progress. Partial review saved.
Run `/pr-review address` later to check."

**If no response at all after 8 minutes**, it likely means the Claude GitHub App
is not installed on this repo. Tell the user:
"No response from @claude after 8 minutes. The Claude GitHub App may not be
installed on this repo. Check https://github.com/apps/claude and install it,
then retry with `/pr-review $PR_NUMBER`."

## Step 4: Triage the review

This step runs in the **main conversation** (not the background agent) after
the raw review is saved. The main agent has full codebase context, which is
needed to make good FIX/DEFER/SKIP decisions.

1. Read `.claude/pr-reviews/pr-{number}-review.md`

2. Parse each finding/issue from the review.

3. For each finding, classify as:
   - **FIX** — real bug, security issue, or clear improvement. Worth fixing now.
   - **DEFER** — valid point but not blocking this PR. Note for later.
   - **SKIP** — false positive, stylistic preference, or already handled in the diff.

   When classifying, actually check the codebase. A finding that says "missing X"
   might already be handled in a file the reviewer didn't see. Grep for it before
   classifying as FIX.

4. For FIX items, note:
   - Which file and what to change
   - Estimated effort (S = <5 min, M = 5-15 min, L = 15+ min)

5. **Handle existing task files from prior rounds.** If `.claude/pr-reviews/pr-{number}-tasks.md`
   already exists (from a previous review round), rename it to
   `pr-{number}-tasks-round-{N}.md` before writing the new one. This preserves
   history and avoids confusion.

6. Write the triage to `.claude/pr-reviews/pr-{number}-tasks.md`:

```markdown
# PR #{number} Review Tasks
Generated from Claude GitHub review on {date}

## FIX (do now)
- [ ] {file}: {description} — {effort}
- [ ] {file}: {description} — {effort}

## DEFER (add to TODOS)
- {description} — {reason for deferring}

## SKIP (not actionable)
- {description} — {reason for skipping}
```

7. Tell the user: "Review triaged. {N} items to fix, {M} deferred, {K} skipped. Fixing now."

8. **Automatically proceed to Step 5.** Do NOT wait for `/pr-review address`.

## Step 5: Address review

This step runs automatically after triage, or manually via `/pr-review address`.

1. Find the most recent task file: `.claude/pr-reviews/pr-*-tasks.md`

2. Read it and show the unchecked FIX items. If all items are already checked,
   tell the user "All review items already addressed" and stop.

3. Work through each FIX item:
   - Make the fix
   - Mark the item as `[x]` in the tasks file

4. **Batch commits by scope.** Don't create one commit per tiny fix. Group
   related small fixes (S-effort items touching the same area) into a single
   commit. Larger fixes (M/L) get their own commit. Use this message format:
   ```
   fix: address PR review — {summary of what changed}
   ```

5. After all FIX items are done:
   - Push the branch:
     ```bash
     git push origin $BRANCH
     ```
   - Reply on the PR with a summary of what was addressed:
     ```bash
     gh pr comment $PR_NUMBER --body "## Review fixes applied

     {For each FIX item:}
     - ✅ **{description}** — {what was done} ({commit SHA})

     {For each DEFER item:}
     - ⏳ **{description}** — deferred: {reason}

     {For each SKIP item:}
     - ⏭️ **{description}** — skipped: {reason}

     ---
     {N} fixed, {M} deferred, {K} skipped."
     ```
   - Show summary to the user.
   - **Offer re-review:** "Fixes pushed. Want me to trigger a re-review to
     verify? Run `/pr-review re-review`."

## Notes

- `.claude/pr-reviews/` is gitignored (local only).
- The background poll uses the Agent tool with `run_in_background: true`.
- Triage always runs in the main conversation, not the background agent,
  because it needs codebase context to distinguish real issues from false positives.
- Uses `gh api` REST endpoint (not `gh pr edit`) to avoid the GraphQL classic
  projects deprecation error on repos with classic project boards.
- If a fix fails or the session ends mid-way through Step 5, running
  `/pr-review address` picks up where you left off — it reads the task file
  and works on unchecked items only.
