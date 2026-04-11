## Last Session — 2026-04-11
Branch: phase-4/social
Phase: Phase 4 (chat only) — committed, needs migration 002 applied + PR

### What was done
- Picked up from Phase 3 merge (PR #6 landed on 2026-04-05)
- Scoped Phase 4 down to **chat only**: reviews, profile, home landing page deferred to a future phase
- Built per-request chat with Supabase Realtime:
  - `packages/api-client/src/messages.ts` — getMessagesByRequest, sendMessage, subscribeToMessages, markMessagesAsRead
  - `packages/api-client/src/notifications.ts` — added `createNotification()` helper (the existing code only read/updated; borrow-status notifications come from a SECURITY DEFINER trigger)
  - `packages/shared/src/schemas/message.ts` — sendMessageSchema (Zod, 1-2000 chars)
  - `apps/web/src/hooks/useMessages.ts` — useMessages query, useSendMessage (optimistic w/ rollback), useMessageSubscription, useMarkMessagesRead
  - `apps/web/src/components/Messages/MessageBubble.tsx` — shadcn-styled bubble with sender + timestamp
  - `apps/web/src/components/Messages/ChatThread.tsx` — inline thread (list + composer), react-hook-form + Zod, Enter-to-send, auto-scroll, mark-read on mount via ref pattern
  - `apps/web/src/pages/BookDetail.tsx` — shows ChatThread under activeRequest notice (requester side)
  - `apps/web/src/components/Borrow/BorrowRequestCard.tsx` — collapsible Chat toggle (owner side, on Requests inbox)
- **Caught by advisor:** `notifications` table had no INSERT RLS policy, so `createNotification()` would silently fail. Added `supabase/migrations/002_notification_insert_policy.sql` (permissive auth check, matches existing trigger behavior). ⚠ Needs manual apply in Supabase SQL Editor.
- Commits:
  - `d077af3` chore: start phase 4 - social
  - `5920ac8` feat: per-request chat with realtime messaging
  - `07b25e1` fix: add INSERT RLS policy for notifications
- Build + lint pass. Pre-existing warning in AddBookForm.tsx (comma operator) unchanged — known tech debt.

### What's next
1. **Apply migration 002 in Supabase SQL Editor** before testing chat end-to-end
2. Manually QA chat flow: sign in as 2 users, send messages, verify Realtime delivers the other side without refresh, verify mark-read updates
3. Complete Phase 4 via `/phase complete`, push branch, open PR
4. Deferred from Phase 4 → new follow-up phase: reviews (create/getForBook), profile page, Home landing page with stats. These were explicitly dropped to keep Phase 4 shippable.
5. Phase 5 still owes: fix live Vercel deploy (SPA rewrites), add api-client tests, responsive/polish pass, deploy config

### Open issues
- Migration 002 is committed but not applied (manual step)
- AddBookForm.tsx still exceeds 150 lines + uses useState (deferred from Phase 2)
- No tests for borrowRequests/notifications/messages api-client modules (Phase 5)
- Live Vercel deploy still broken (missing SPA rewrites — Phase 5)
- Chat components don't handle: unread badge anywhere in UI (Phase 4.5+), typing indicators, read receipts
- Optimistic message display_name relies on user_metadata which may be empty — bubble briefly shows email fallback (cosmetic, acceptable)

### Prompt for next session
> I'm on branch phase-4/social in BookShare V2. Phase 4 (chat only) is committed but not yet PR'd. First: apply migration `supabase/migrations/002_notification_insert_policy.sql` in the Supabase SQL Editor — without it chat notifications are silently rejected by RLS. Then manually QA the chat flow with two users (BookDetail for requester, Requests inbox for owner), check Realtime delivery and mark-read. If it works, run `/phase complete` and create PR #7. Deferred from Phase 4: reviews, profile page, Home landing page — these belong in a follow-up phase.
