-- =============================================================================
-- Catalogue read-path performance indexes
-- =============================================================================
--
-- Why this migration exists
-- -------------------------
-- Every catalogue surface (homepage, /products, /categories/[slug], /search,
-- /store/[sellerId]) runs variations of:
--
--   SELECT ... FROM products
--   WHERE is_active = true
--     [AND category ILIKE '%...%']
--     [AND (name ILIKE '%...%' OR description ILIKE '%...%')]
--     [AND (seller_id = $1 OR created_by = $1)]
--   ORDER BY created_at DESC
--
-- The existing indexes are single-column btrees on `category` and `is_active`.
-- They do NOT help here:
--
--   1. A leading-wildcard `ILIKE '%foo%'` can never use a btree index, so
--      search and category filtering were doing full sequential scans of
--      `products` plus a per-row lower-case comparison.
--   2. `is_active = true` alone is a low-selectivity predicate (almost every
--      row matches), so Postgres ignores that index and sorts the whole table
--      for `ORDER BY created_at DESC`.
--   3. `seller_id` had no index at all, so the seller dashboard and public
--      store pages scanned the full table too.
--
-- At a few hundred products this is survivable; it degrades linearly and will
-- become the dominant source of latency as the catalogue grows.
--
-- Safe to run more than once. Uses CONCURRENTLY where possible so it does not
-- lock writes on a live table.
-- =============================================================================

-- Trigram support is what makes `ILIKE '%term%'` indexable at all.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Search: name / description substring matching ──────────────────────────
-- GIN + trigram turns the search page's full-table scan into an index lookup.
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON public.products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_description_trgm
  ON public.products USING gin (description gin_trgm_ops);

-- ─── Category filtering (also uses ILIKE '%...%') ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category_trgm
  ON public.products USING gin (category gin_trgm_ops);

-- ─── The actual hot path: active products, newest first ─────────────────────
-- A partial index over only active rows, already ordered the way every
-- listing query asks for. This lets Postgres satisfy the common
-- "WHERE is_active = true ORDER BY created_at DESC LIMIT n" with an index
-- scan and no sort step at all.
CREATE INDEX IF NOT EXISTS idx_products_active_created_at
  ON public.products (created_at DESC)
  WHERE is_active = true;

-- Same shape, but scoped per category for category landing pages.
CREATE INDEX IF NOT EXISTS idx_products_active_category_created_at
  ON public.products (category, created_at DESC)
  WHERE is_active = true;

-- ─── Seller / vendor scoped listings ────────────────────────────────────────
-- `seller_id` was completely unindexed despite being filtered on by the
-- seller dashboard, the public store page and the products API.
CREATE INDEX IF NOT EXISTS idx_products_seller_id
  ON public.products (seller_id)
  WHERE seller_id IS NOT NULL;

-- ─── Variant joins ──────────────────────────────────────────────────────────
-- Every listing embeds product_variants. The existing index covers
-- product_id; this composite also serves "cheapest variant first", which is
-- how the cards pick a display price.
CREATE INDEX IF NOT EXISTS idx_product_variants_product_price
  ON public.product_variants (product_id, price ASC);

-- ─── Order history ──────────────────────────────────────────────────────────
-- The account/orders screens page through a customer's own orders.
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
  ON public.orders (user_id, created_at DESC);

-- Refresh planner statistics so the new indexes are costed correctly straight
-- away rather than after the next autovacuum.
ANALYZE public.products;
ANALYZE public.product_variants;
