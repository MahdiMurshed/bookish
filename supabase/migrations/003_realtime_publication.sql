-- Phase 4: enable Supabase Realtime for messages and notifications.
--
-- Realtime is built on Postgres logical replication. Tables only emit change
-- events if they're members of the `supabase_realtime` publication. The
-- publication is created empty by Supabase's local setup, so neither
-- subscribeToMessages (Phase 4) nor subscribeToNotifications (Phase 3) actually
-- delivered events — Phase 3 only "worked" because useUnreadCount has a 30s
-- polling fallback that masked the silent failure.
--
-- Adding both tables here fixes Phase 4 chat realtime AND retroactively fixes
-- the Phase 3 notification subscription, so the unread badge no longer waits
-- up to 30 seconds.
--
-- We only subscribe to INSERT events, so REPLICA IDENTITY DEFAULT is sufficient
-- (INSERTs always log all columns regardless of replica identity).

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
