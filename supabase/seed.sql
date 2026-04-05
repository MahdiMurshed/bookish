-- BookShare V2 Seed Data
-- Creates test users via auth.users (which triggers handle_new_user for public.users)

-- 3 test users (password: "password123" for all)
-- GoTrue requires all token/change string columns to be '' not NULL
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, aud, role,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, phone_change, phone_change_token
)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'alice@example.com', crypt('password123', gen_salt('bf')), now(), '{"name": "Alice Rahman"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '', '', ''),
  ('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'bob@example.com', crypt('password123', gen_salt('bf')), now(), '{"name": "Bob Chen"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '', '', ''),
  ('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'carol@example.com', crypt('password123', gen_salt('bf')), now(), '{"name": "Carol Santos"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '', '', '', '', '', '', '');

-- Auth identities (required for login to work)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '{"sub": "a1111111-1111-1111-1111-111111111111", "email": "alice@example.com"}'::jsonb, 'email', 'a1111111-1111-1111-1111-111111111111', now(), now(), now()),
  ('b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '{"sub": "b2222222-2222-2222-2222-222222222222", "email": "bob@example.com"}'::jsonb, 'email', 'b2222222-2222-2222-2222-222222222222', now(), now(), now()),
  ('c3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', '{"sub": "c3333333-3333-3333-3333-333333333333", "email": "carol@example.com"}'::jsonb, 'email', 'c3333333-3333-3333-3333-333333333333', now(), now(), now());

-- Update user profiles with bios
UPDATE public.users SET bio = 'Loves sci-fi and fantasy novels', avatar_url = 'https://i.pravatar.cc/150?u=alice' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.users SET bio = 'History and philosophy reader', avatar_url = 'https://i.pravatar.cc/150?u=bob' WHERE id = 'b2222222-2222-2222-2222-222222222222';
UPDATE public.users SET bio = 'Mystery and thriller enthusiast', avatar_url = 'https://i.pravatar.cc/150?u=carol' WHERE id = 'c3333333-3333-3333-3333-333333333333';

-- Books (Alice owns 3, Bob owns 2, Carol owns 2)
INSERT INTO public.books (id, owner_id, title, author, genre, condition, description, is_lendable) VALUES
  ('d4444444-4444-4444-4444-444444444441', 'a1111111-1111-1111-1111-111111111111', 'Dune', 'Frank Herbert', 'Science Fiction', 'excellent', 'Classic sci-fi masterpiece about desert planet Arrakis', true),
  ('d4444444-4444-4444-4444-444444444442', 'a1111111-1111-1111-1111-111111111111', 'The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 'good', 'First book of the Kingkiller Chronicle', true),
  ('d4444444-4444-4444-4444-444444444443', 'a1111111-1111-1111-1111-111111111111', 'Neuromancer', 'William Gibson', 'Science Fiction', 'fair', 'The foundational cyberpunk novel', false),
  ('d4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 'mint', 'A brief history of humankind', true),
  ('d4444444-4444-4444-4444-444444444445', 'b2222222-2222-2222-2222-222222222222', 'Meditations', 'Marcus Aurelius', 'Philosophy', 'good', 'Stoic philosophy from a Roman emperor', true),
  ('d4444444-4444-4444-4444-444444444446', 'c3333333-3333-3333-3333-333333333333', 'Gone Girl', 'Gillian Flynn', 'Thriller', 'excellent', 'A twisting psychological thriller', true),
  ('d4444444-4444-4444-4444-444444444447', 'c3333333-3333-3333-3333-333333333333', 'The Silent Patient', 'Alex Michaelides', 'Mystery', 'mint', 'A woman shoots her husband and never speaks again', true);

-- Borrow requests (various statuses to showcase the flow)
-- Bob requests Alice's "Dune" -> approved -> handed over -> returned
INSERT INTO public.borrow_requests (id, book_id, requester_id, status, message, due_date, requested_at)
VALUES ('e5555555-5555-5555-5555-555555555551', 'd4444444-4444-4444-4444-444444444441', 'b2222222-2222-2222-2222-222222222222', 'pending', 'I have always wanted to read this!', now()::date + 30, now() - interval '5 days');
UPDATE public.borrow_requests SET status = 'approved', response_message = 'Sure, enjoy it!', responded_at = now() - interval '4 days' WHERE id = 'e5555555-5555-5555-5555-555555555551';
UPDATE public.borrow_requests SET status = 'handed_over', handover_method = 'in_person', handover_location = 'Coffee shop on Main St', handover_date = now() - interval '3 days' WHERE id = 'e5555555-5555-5555-5555-555555555551';
UPDATE public.borrow_requests SET status = 'returned', return_method = 'in_person', return_notes = 'Returned in great condition', returned_at = now() - interval '1 day' WHERE id = 'e5555555-5555-5555-5555-555555555551';

-- Carol requests Alice's "Name of the Wind" -> approved
INSERT INTO public.borrow_requests (id, book_id, requester_id, status, message, due_date, requested_at)
VALUES ('e5555555-5555-5555-5555-555555555552', 'd4444444-4444-4444-4444-444444444442', 'c3333333-3333-3333-3333-333333333333', 'pending', 'Heard great things about this series!', now()::date + 21, now() - interval '2 days');
UPDATE public.borrow_requests SET status = 'approved', response_message = 'You will love it!', responded_at = now() - interval '1 day' WHERE id = 'e5555555-5555-5555-5555-555555555552';

-- Alice requests Bob's "Sapiens" -> pending
INSERT INTO public.borrow_requests (id, book_id, requester_id, status, message, due_date, requested_at)
VALUES ('e5555555-5555-5555-5555-555555555553', 'd4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'pending', 'Been on my reading list forever!', now()::date + 14, now() - interval '1 day');

-- Alice requests Carol's "Gone Girl" -> denied
INSERT INTO public.borrow_requests (id, book_id, requester_id, status, message, due_date, requested_at)
VALUES ('e5555555-5555-5555-5555-555555555554', 'd4444444-4444-4444-4444-444444444446', 'a1111111-1111-1111-1111-111111111111', 'pending', 'Love thrillers!', now()::date + 14, now() - interval '3 days');
UPDATE public.borrow_requests SET status = 'denied', response_message = 'Sorry, a friend is borrowing it right now', responded_at = now() - interval '2 days' WHERE id = 'e5555555-5555-5555-5555-555555555554';

-- Messages (chat thread on the Dune borrow)
INSERT INTO public.messages (borrow_request_id, sender_id, content, read, created_at) VALUES
  ('e5555555-5555-5555-5555-555555555551', 'b2222222-2222-2222-2222-222222222222', 'Hey, when works for pickup?', true, now() - interval '4 days'),
  ('e5555555-5555-5555-5555-555555555551', 'a1111111-1111-1111-1111-111111111111', 'How about Saturday at the coffee shop on Main St?', true, now() - interval '3 days 20 hours'),
  ('e5555555-5555-5555-5555-555555555551', 'b2222222-2222-2222-2222-222222222222', 'Perfect, see you there!', true, now() - interval '3 days 18 hours');

-- Review (Bob reviews Dune after returning it)
INSERT INTO public.reviews (book_id, reviewer_id, borrow_request_id, rating, content) VALUES
  ('d4444444-4444-4444-4444-444444444441', 'b2222222-2222-2222-2222-222222222222', 'e5555555-5555-5555-5555-555555555551', 5, 'Absolutely incredible book. The world-building is unmatched.');

-- Clear auto-generated notifications and re-insert clean ones
DELETE FROM public.notifications;
INSERT INTO public.notifications (user_id, type, reference_id, read, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'borrow_requested', 'e5555555-5555-5555-5555-555555555553', false, now() - interval '1 day'),
  ('a1111111-1111-1111-1111-111111111111', 'borrow_returned', 'e5555555-5555-5555-5555-555555555551', true, now() - interval '1 day'),
  ('c3333333-3333-3333-3333-333333333333', 'borrow_approved', 'e5555555-5555-5555-5555-555555555552', false, now() - interval '1 day'),
  ('a1111111-1111-1111-1111-111111111111', 'borrow_denied', 'e5555555-5555-5555-5555-555555555554', true, now() - interval '2 days');
