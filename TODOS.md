# TODOS

Work captured during planning or review that was intentionally deferred. Each
entry states what, why, context, and dependencies so someone picking it up in
three months can continue without re-deriving the rationale.

---

## Messages surface — deferred from Phase A–H (plan: `~/.claude/plans/spicy-prancing-wadler.md`)

### Test coverage: `useUnreadMessageCount` / `useUnreadRequestCount`
- **What:** Unit tests verifying the typed unread-count hooks pass the correct `type` filter array to `getUnreadCountByTypes` and surface the returned count.
- **Why:** Phase A's verify list (#7) enumerated these. They're thin wrappers but the type partition (`MESSAGE_TYPES` vs `REQUEST_TYPES`) is the contract the header badges depend on. A typo here makes Requests show chat counts and vice versa.
- **Context:** Needs a `QueryClientProvider` test wrapper plus a mocked `getUnreadCountByTypes`. React Query's docs cover the pattern. Files: `apps/web/src/hooks/useNotifications.ts`.
- **Depends on:** nothing.

### Message pagination
- **What:** Cursor-based pagination on the thread message list. Inbox-level thread pagination too if inbox grows long.
- **Why:** `getThreads()` currently embeds ALL messages per thread in one PostgREST query. For a thread with hundreds of messages the payload bloats. Inbox query also returns every borrow_request the user participates in with no limit.
- **Context:** Start with per-thread: fetch last 100 messages, "Load earlier" button. Supabase supports `.range()` on both top-level and embedded resources. See `packages/api-client/src/messages.ts` `THREAD_PROJECTION`.
- **Depends on:** nothing. Revisit when a real user hits a thread with 200+ messages or 50+ threads.

### Message-list virtualization
- **What:** Virtualize `Thread/MessagesList.tsx` for threads with 1000+ messages.
- **Why:** After pagination ships this is the next bottleneck. Rendering 1000 bubble divs will jank scroll.
- **Context:** `react-virtuoso` is the pragmatic pick for chat UIs (reverse-scroll + anchored-to-bottom built in). `react-window` is leaner but needs more glue for reverse-scroll.
- **Depends on:** pagination lands first.

### Typing indicators
- **What:** "{name} is typing…" affordance in the thread.
- **Why:** Flagged in the design-handoff open-questions as out-of-scope for v1.
- **Context:** Supabase Realtime broadcast channel (not postgres_changes) keyed per thread. Debounce on the sender (2s idle).
- **Depends on:** nothing.

### Message attachments / images
- **What:** Let users attach images to messages.
- **Why:** Flagged in the design-handoff open-questions as out-of-scope for v1.
- **Context:** Needs a Supabase Storage bucket + upload flow in the composer. `messages` table needs an `attachments jsonb` column or a separate `message_attachments` table.
- **Depends on:** product decision on whether to allow at all — liability + moderation questions.

### Archived-thread filter
- **What:** Hide `returned` / `denied` / `cancelled` threads from the inbox default view (or visually de-emphasize them).
- **Why:** Plan's decision #10 chose "default = show all" but flagged this to revisit if inbox crowds in real use.
- **Context:** Add a toggle in inbox header or filter pill. `Thread.borrow_request.status` is the key. Files: `apps/web/src/components/Messages/Inbox/InboxList.tsx`.
- **Depends on:** real-usage data showing the inbox actually crowds.

### Toast stacking
- **What:** Multiple simultaneous new-message toasts stack vertically with 8px gap instead of replacing each other.
- **Why:** Handoff prototype shows single toast only. Production auto-dismiss (6s) keeps it manageable, but a burst of inbound can still collide.
- **Context:** `sonner` supports multi-toast natively via its `position` + stacking config. Tune `visibleToasts` + `expand`.
- **Depends on:** nothing. Low priority.

### Badge 99+ cap
- **What:** When unread message or request count exceeds 99, render "99+".
- **Why:** Raw three-digit counts break the 16px pill layout.
- **Context:** In `Header.tsx`, clamp `{unreadMessages > 99 ? '99+' : unreadMessages}`.
- **Depends on:** nothing. Ship-it-when-someone-hits-100.
