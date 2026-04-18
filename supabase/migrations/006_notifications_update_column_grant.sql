-- Narrow the notifications UPDATE grant to the `read` column only. Mirrors
-- migration 005's pattern for public.messages.
--
-- Background: notifications has a row-level policy (notif_update, from 001)
-- scoped to the row owner via user_id = auth.uid(). But the default table-
-- level UPDATE grant for `authenticated` still allowed any column of a user's
-- own notifications to be rewritten via a raw PostgREST call — type,
-- reference_id, created_at. Our client only ever toggles `read`
-- (markNotificationRead, markAllNotificationsRead, and the dual-write inside
-- markMessagesAsRead), so restricting the column grant matches the floor to
-- the ceiling.

REVOKE UPDATE ON notifications FROM authenticated;
GRANT UPDATE (read) ON notifications TO authenticated;
