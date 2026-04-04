-- BookShare V2 - Initial Schema
-- 6 tables, RLS policies, triggers, indexes

-- Users profile (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Books
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  cover_url TEXT,
  genre TEXT,
  condition TEXT CHECK (condition IN ('mint','excellent','good','fair','poor')),
  description TEXT,
  google_books_id TEXT,
  is_lendable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Borrow requests (with handover/return tracking)
CREATE TABLE public.borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','handed_over','returned','denied','cancelled')),
  message TEXT,
  response_message TEXT,
  due_date DATE,
  handover_method TEXT,
  handover_location TEXT,
  handover_date TIMESTAMPTZ,
  handover_notes TEXT,
  return_method TEXT,
  return_location TEXT,
  return_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ
);

-- Messages (per-request chat threads)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrow_request_id UUID NOT NULL REFERENCES public.borrow_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  borrow_request_id UUID NOT NULL REFERENCES public.borrow_requests(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'borrow_requested','borrow_approved','borrow_denied',
    'borrow_handed_over','borrow_returned','new_chat_message'
  )),
  reference_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraints
ALTER TABLE reviews ADD CONSTRAINT reviews_unique_per_borrow
  UNIQUE (reviewer_id, borrow_request_id);

-- Indexes
CREATE INDEX idx_books_owner ON books(owner_id);
CREATE INDEX idx_books_lendable ON books(is_lendable) WHERE is_lendable = true;
CREATE INDEX idx_borrow_requests_book ON borrow_requests(book_id, status);
CREATE INDEX idx_borrow_requests_requester ON borrow_requests(requester_id);
CREATE INDEX idx_messages_request ON messages(borrow_request_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_reviews_book ON reviews(book_id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Borrow state transition validation
--
--   pending --> approved --> handed_over --> returned
--     |            |
--     +--> denied  +--> cancelled
--     +--> cancelled
--
CREATE OR REPLACE FUNCTION validate_borrow_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status NOT IN ('approved','denied','cancelled') THEN
    RAISE EXCEPTION 'Invalid transition from pending to %', NEW.status;
  END IF;
  IF OLD.status = 'approved' AND NEW.status NOT IN ('handed_over','cancelled') THEN
    RAISE EXCEPTION 'Invalid transition from approved to %', NEW.status;
  END IF;
  IF OLD.status = 'handed_over' AND NEW.status != 'returned' THEN
    RAISE EXCEPTION 'Invalid transition from handed_over to %', NEW.status;
  END IF;
  IF OLD.status IN ('returned','denied','cancelled') THEN
    RAISE EXCEPTION 'Cannot transition from terminal status %', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_borrow_transition
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION validate_borrow_transition();

-- Notification trigger for borrow status changes
CREATE OR REPLACE FUNCTION notify_borrow_status_change()
RETURNS TRIGGER AS $$
DECLARE
  book_owner_id UUID;
  notif_type TEXT;
  target_user UUID;
BEGIN
  SELECT owner_id INTO book_owner_id FROM books WHERE id = NEW.book_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, reference_id)
    VALUES (book_owner_id, 'borrow_requested', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN notif_type := 'borrow_approved'; target_user := NEW.requester_id;
      WHEN 'denied' THEN notif_type := 'borrow_denied'; target_user := NEW.requester_id;
      WHEN 'handed_over' THEN notif_type := 'borrow_handed_over'; target_user := NEW.requester_id;
      WHEN 'returned' THEN notif_type := 'borrow_returned'; target_user := book_owner_id;
      ELSE RETURN NEW;
    END CASE;
    INSERT INTO notifications (user_id, type, reference_id)
    VALUES (target_user, notif_type, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_borrow_status_change
  AFTER INSERT OR UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION notify_borrow_status_change();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY books_select ON books FOR SELECT USING (
  owner_id = auth.uid() OR is_lendable = true
);
CREATE POLICY books_insert ON books FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY books_update ON books FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY books_delete ON books FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY borrow_select ON borrow_requests FOR SELECT USING (
  requester_id = auth.uid()
  OR book_id IN (SELECT id FROM books WHERE owner_id = auth.uid())
);
CREATE POLICY borrow_insert ON borrow_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
  AND book_id NOT IN (SELECT id FROM books WHERE owner_id = auth.uid())
  AND book_id IN (SELECT id FROM books WHERE is_lendable = true)
);
CREATE POLICY borrow_update ON borrow_requests FOR UPDATE USING (
  requester_id = auth.uid()
  OR book_id IN (SELECT id FROM books WHERE owner_id = auth.uid())
);

CREATE POLICY messages_select ON messages FOR SELECT USING (
  borrow_request_id IN (
    SELECT id FROM borrow_requests WHERE requester_id = auth.uid()
    UNION
    SELECT br.id FROM borrow_requests br JOIN books b ON br.book_id = b.id WHERE b.owner_id = auth.uid()
  )
);
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND borrow_request_id IN (
    SELECT id FROM borrow_requests WHERE requester_id = auth.uid()
    UNION
    SELECT br.id FROM borrow_requests br JOIN books b ON br.book_id = b.id WHERE b.owner_id = auth.uid()
  )
);

CREATE POLICY reviews_select ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (
  reviewer_id = auth.uid()
  AND borrow_request_id IN (
    SELECT id FROM borrow_requests WHERE requester_id = auth.uid() AND status = 'returned'
  )
);

CREATE POLICY notif_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notif_update ON notifications FOR UPDATE USING (user_id = auth.uid());
