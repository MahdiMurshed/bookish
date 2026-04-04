---
name: pickup
description: Start-of-session context recovery. Shows what happened last session, current phase status, and what to work on next.
user-invocable: true
---

# /pickup

Show what happened last session and where to pick up.

## Steps

1. **Read current phase status:**
   ```bash
   cat PROGRESS.md
   ```

2. **Read last session log (if exists):**
   ```bash
   cat .claude/session-log.md 2>/dev/null || echo "NO_SESSION_LOG"
   ```

3. **Read recent git history:**
   ```bash
   git log --oneline -15
   git branch --show-current
   git status --short
   ```

4. **Check for uncommitted work:**
   ```bash
   git status --porcelain
   git stash list
   ```

5. **Summarize for the user:**

   Display a briefing:
   ```
   PICKUP SUMMARY
   ══════════════════════════════════
   Branch:        {current branch}
   Phase:         {current phase from PROGRESS.md}
   Last session:  {summary from session-log.md or inferred from git log}

   What was done last time:
   - {bullet points from session log or recent commits}

   What's next:
   - {from session log or PROGRESS.md}

   ⚠ Uncommitted work: {yes/no — list files if yes}
   ⚠ Stashed work: {yes/no — list stashes if yes}

   💬 Suggested prompt from last session:
   > {show the "Prompt for next session" from session-log.md if it exists}
   ══════════════════════════════════
   ```

   If no session log exists, infer from git log: group recent commits by
   topic and summarize what they accomplished.

6. **Ask what to do:**

   If a "Prompt for next session" exists in the session log, use it as
   the default option:

   Use AskUserQuestion:
   > "Ready to continue. Last session suggested this prompt:"
   > "{the prompt from session log}"

   Options (show only applicable ones):
   - A) Run that prompt — pick up exactly where I left off
   - B) Start next phase (run /phase)
   - C) Something else — I'll tell you what I need
