-- Add a missing UPDATE policy on `messages` so the recipient can mark incoming
-- messages read. Before this migration, RLS was enabled on the table but only
-- SELECT and INSERT had policies, so every UPDATE silently affected 0 rows.
-- That left unread counts stuck and made the new Messages inbox appear
-- perpetually unread after opening a thread.

CREATE POLICY messages_update ON messages FOR UPDATE USING (
  borrow_request_id IN (
    SELECT id FROM borrow_requests WHERE requester_id = auth.uid()
    UNION
    SELECT br.id FROM borrow_requests br
    JOIN books b ON br.book_id = b.id
    WHERE b.owner_id = auth.uid()
  )
);
