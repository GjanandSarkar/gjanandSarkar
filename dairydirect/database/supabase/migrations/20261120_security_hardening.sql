-- ============================================================================
-- 20261120_security_hardening.sql
--
-- Closes the two data-exposure findings from the November 2026 audit:
--
--   1. `profiles` had `FOR SELECT USING (true)` and the `anon` role held
--      GRANT ALL. Because the anon key ships to every browser, any visitor
--      could enumerate every customer's name, phone, email, address, role,
--      loyalty balance and referral code.
--
--   2. `orders` allowed INSERT with `auth.uid() IS NULL`, so an
--      unauthenticated caller could create arbitrary orders.
--
-- Design notes
-- ------------
-- * `is_admin(uuid)` is SECURITY DEFINER, so it can still read profiles
--   while the caller's own RLS is restricted.
-- * The application's server routes use the service-role key, which bypasses
--   RLS. Tightening these policies therefore does not break checkout, admin
--   or seller server actions.
-- * `authenticated` keeps its grants; browser-side reads for a signed-in
--   Supabase user continue to work, scoped to their own rows.
-- * This migration is idempotent. Run it in the Supabase SQL editor or via
--   the CLI, then verify with the queries at the bottom.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES: self-or-admin only
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: public read"    ON public.profiles;
DROP POLICY IF EXISTS "Profiles: service insert" ON public.profiles;

-- A signed-in user may read their own profile; an admin may read any.
-- There is deliberately no policy granting anonymous access.
CREATE POLICY "Profiles: own read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR is_admin(auth.uid()));

-- Profile creation happens server-side with the service-role key. A client
-- may only ever insert a row for itself (kept for local/dev parity).
CREATE POLICY "Profiles: own insert" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- (The existing "Profiles: own update" and "Profiles: admin all" policies
-- remain in place. 003 created both.)

-- Remove the public API role entirely from this table.
REVOKE ALL ON TABLE public.profiles FROM anon;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ORDERS: no anonymous inserts
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders: own insert" ON public.orders;
CREATE POLICY "Orders: own insert" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. REVOKE ANON FROM PERSONAL / FINANCIAL TABLES
--
-- The base migration ran:
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
--
-- That is convenient for local setup and wrong for production. Anonymous
-- visitors have no legitimate reason to read any of these tables; the
-- storefront renders through server components and the service role.
-- Revoking from `anon` does not affect `authenticated` or `service_role`.
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  sensitive text[] := ARRAY[
    'profiles',
    'user_addresses',
    'orders',
    'order_items',
    'cart_items',
    'subscriptions',
    'modification_reports',
    'wishlists',
    'notifications',
    'return_requests',
    'refunds',
    'seller_payouts',
    'seller_inquiries',
    'support_tickets',
    'otp_store',
    'audit_logs',
    'inventory_transactions',
    'inventory_reservations',
    'razorpay_pending_orders'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    END IF;
  END LOOP;
END $$;

-- Future tables should not inherit a public grant by default. New tables
-- must be explicitly exposed (products, categories, reviews, …) if a
-- browser needs them.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

COMMIT;

-- ============================================================================
-- VERIFICATION (run separately; these must all return zero rows / false)
-- ============================================================================
--
-- a) No policy on profiles grants unrestricted reads:
--    SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr
--    FROM pg_policy
--    WHERE polrelid = 'public.profiles'::regclass;
--
-- b) Anonymous access to profiles is impossible:
--    SET ROLE anon;
--    SELECT count(*) FROM public.profiles;   -- expect ERROR: permission denied
--    RESET ROLE;
--
-- c) No anonymous insert policy on orders:
--    SELECT polname FROM pg_policy
--    WHERE polrelid = 'public.orders'::regclass AND polcmd = 'a';
--
-- d) From a browser/anon key, this must return an empty array or 401:
--    GET {SUPABASE_URL}/rest/v1/profiles?select=phone,email&limit=1
--
-- e) The storefront still works end to end (home, PDP, cart, checkout).
-- ============================================================================
