-- Public, RLS-bypassing community counters for the Home landing page.
--
-- Why a SECURITY DEFINER RPC instead of three direct counts:
--   - books with is_lendable=true is publicly readable via books_select, so
--     a direct count would work for that one;
--   - users is publicly readable via users_select, same;
--   - borrow_requests is participant-scoped (borrow_select from 001), so an
--     anon visitor or any non-participant cannot count community-wide returns
--     at all. They'd see 0.
--
-- Centralizing all three in one RPC keeps the contract uniform: a single
-- round-trip, three counters, callable by both anon (Home page) and
-- authenticated (anywhere). search_path is pinned to public so the function
-- can't be redirected through a hostile schema.

CREATE OR REPLACE FUNCTION public.community_stats()
RETURNS TABLE (
  books_count bigint,
  members_count bigint,
  completed_borrows_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.books WHERE is_lendable = true)::bigint AS books_count,
    (SELECT count(*) FROM public.users)::bigint AS members_count,
    (SELECT count(*) FROM public.borrow_requests WHERE status = 'returned')::bigint AS completed_borrows_count;
$$;

REVOKE EXECUTE ON FUNCTION public.community_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_stats() TO anon, authenticated;
