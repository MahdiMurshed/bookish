-- Phase 4: allow authenticated clients to insert notifications.
--
-- Borrow-status notifications are created by notify_borrow_status_change, which
-- bypasses RLS via SECURITY DEFINER. Chat messages, however, create their
-- notifications directly from the client via createNotification(), which runs
-- under the caller's RLS. Without an INSERT policy every chat notification is
-- silently rejected by Postgres.
--
-- We intentionally allow any authenticated user to insert a notification for any
-- other user, because the existing trigger already does exactly that (e.g. the
-- requester creates a 'borrow_requested' notification for the book owner). The
-- risk surface is limited to notification spam, which is acceptable for V1.

CREATE POLICY notif_insert ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
