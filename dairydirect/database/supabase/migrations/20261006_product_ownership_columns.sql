-- =============================================================================
-- Product ownership columns + one-company-per-category enforcement
-- =============================================================================
--
-- Part 1 replaces DDL that was being executed at runtime.
--
--   POST /api/products used to run, on every single product creation:
--
--     ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id TEXT;
--     ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT;
--
--   `ALTER TABLE` takes an ACCESS EXCLUSIVE lock on `products` — the strictest
--   lock Postgres has. It blocks every concurrent read and write of the
--   catalogue until it completes. On a live storefront, with admin and seller
--   product creation happening while customers browse, that is a self-inflicted
--   outage waiting for a busy moment.
--
--   Schema belongs in migrations. The columns are created here, once.
--
-- Part 2 encodes the core business rule in the database itself.
-- =============================================================================

-- ─── Part 1: ownership columns ──────────────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.products.seller_id IS
  'Owning seller. NULL means the product was created directly by an admin.';
COMMENT ON COLUMN public.products.created_by IS
  'Profile id of whoever created the row. Set server-side from the authenticated session, never from request input.';

CREATE INDEX IF NOT EXISTS idx_products_created_by_fk
  ON public.products (created_by)
  WHERE created_by IS NOT NULL;

-- ─── Part 2: one company per category ───────────────────────────────────────
--
-- The platform's defining rule is that exactly one company is contracted per
-- product category. Until now that was a convention held only in people's
-- heads — nothing stopped two active sellers being created for 'Electronics',
-- which would quietly break the entire value proposition.
--
-- A partial unique index enforces it for *active* sellers only, so rejected,
-- suspended and deactivated sellers can still sit in the table (and their
-- history is preserved) without blocking a replacement partner for that
-- category.
--
-- Matching is case-insensitive and whitespace-trimmed so that 'Electronics',
-- 'electronics' and ' Electronics ' cannot coexist.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_seller_per_category
  ON public.sellers (lower(trim(category)))
  WHERE status = 'active';

COMMENT ON INDEX public.uniq_active_seller_per_category IS
  'Gjanand Sarkar collaborates with exactly one company per category. Enforces at most one ACTIVE seller per category.';

-- NOTE
-- ----
-- If this index fails to create, you already have duplicate active sellers in
-- a category. Find them with:
--
--   SELECT lower(trim(category)) AS category, count(*), array_agg(store_name)
--   FROM sellers
--   WHERE status = 'active'
--   GROUP BY 1
--   HAVING count(*) > 1;
--
-- Resolve by moving the non-contracted sellers to a non-active status, then
-- re-run this migration.
