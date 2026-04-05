---
name: pr-review
description: Create PR, trigger @claude review via GitHub Action, poll for response, triage findings, and save actionable task list. Runs in background while you work.
user-invocable: true
---

# /pr-review

Push, create PR, trigger Claude GitHub review, and triage the results.

## Usage

- `/pr-review` — push current branch, create PR, trigger review, poll in background
- `/pr-review address` — read the saved review task list and fix issues one by one

## Steps

### Step 1: Push and create PR

```bash
git push origin $(git branch --show-current)
```

Check if PR already exists:
```bash
gh pr view --json number --jq .number 2>/dev/null
```

If no PR, create one:
```bash
gh pr create --title "{branch description}" --body "..." --base master
```

If PR exists, use the existing one.

### Step 2: Trigger Claude review

```bash
gh pr comment {number} --body "@claude review"
```

### Step 3: Poll in background

Tell the user: "Claude review triggered on PR #{number}. I'll notify you when it's ready. Keep working."

Run a background agent that:
1. Polls every 30 seconds for up to 5 minutes:
   ```bash
   gh api repos/{owner}/{repo}/issues/{number}/comments --jq '.[] | select(.user.login == "claude[bot]") | .body' 2>/dev/null
   ```
2. Checks if the review is complete (look for "### Summary" or "### What's Good" or a completed task list where all items are `[x]`)
3. When complete, save the full review to `.claude/pr-reviews/pr-{number}-review.md`
4. Notify the user: "Claude review for PR #{number} is ready. Run `/pr-review address` to work through it."

If 5 minutes pass without a complete review, save whatever exists and notify:
"Claude review for PR #{number} is still in progress. Partial review saved. Check back later or run `/pr-review address`."

### Step 4: Triage the review

After saving the raw review, automatically triage it:

1. Read `.claude/pr-reviews/pr-{number}-review.md`
2. Parse each finding/issue from the review
3. For each finding, classify as:
   - **FIX** — real bug, security issue, or clear improvement. Worth fixing now.
   - **DEFER** — valid point but not blocking. Add to TODOS.md later.
   - **SKIP** — false positive, stylistic preference, or already handled.
4. For FIX items, note:
   - Which file and what to change
   - Estimated effort (S/M/L)
5. Write the triage to `.claude/pr-reviews/pr-{number}-tasks.md`:

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

6. Notify user: "Review triaged. {N} items to fix, {M} deferred, {K} skipped. Run `/pr-review address` to start fixing."

### Step 5: Address review (`/pr-review address`)

When the user runs `/pr-review address`:

1. Find the most recent task file: `.claude/pr-reviews/pr-*-tasks.md`
2. Read it and show the FIX items
3. Work through each FIX item one by one:
   - Make the fix
   - Commit with message: `fix: address PR review — {description}`
   - Mark the item as `[x]` in the tasks file
4. After all FIX items are done:
   - Push the branch
   - Show summary: "Fixed {N} items from the review. Branch pushed."

## Notes

- `.claude/pr-reviews/` is gitignored (local only)
- The background poll uses the Agent tool with `run_in_background: true`
- The triage agent runs as a sub-agent after the review is fetched
- If no review is found after polling, the user can manually run `/pr-review address` later
- Uses `gh api` REST endpoint (not `gh pr edit`) to avoid the GraphQL classic projects error
