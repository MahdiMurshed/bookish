-- Narrow the messages UPDATE grant to the `read` column only.
--
-- Migration 004 added a row-level policy (messages_update) scoped to thread
-- participants, but left the default table-level UPDATE privilege intact for
-- the `authenticated` role. That let any participant rewrite any column —
-- content, sender_id, created_at — via a hand-crafted PostgREST call, even
-- though no UI path in the client ever does so.
--
-- Our client only ever updates `read` (via markMessagesAsRead). Restrict the
-- column grant so the floor matches the ceiling: even a malicious authenticated
-- participant can only flip the read flag.
--
-- Row-level policy from migration 004 still applies on top of this — the user
-- can only UPDATE(read) on messages in threads they participate in.

REVOKE UPDATE ON messages FROM authenticated;
GRANT UPDATE (read) ON messages TO authenticated;
