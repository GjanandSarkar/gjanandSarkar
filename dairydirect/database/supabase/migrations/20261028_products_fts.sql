-- =============================================================================
-- Full-text search (FTS) column on products
-- =============================================================================
--
-- Why this migration exists
-- -------------------------
-- The search page and /products API use ILIKE '%term%' on name + description.
-- A leading-wildcard ILIKE cannot use any btree index.  The pg_trgm indexes
-- added in 20261006_catalog_performance_indexes.sql improve this for substring
-- matching, but trigram search still does a parallel index scan across both
-- columns with no relevance ranking.
--
-- Postgres full-text search (FTS) with a GIN-indexed tsvector column is:
--   • 3-10× faster than trigram on text longer than ~100 chars
--   • rank-able (ts_rank), so "Organic Cow Ghee" ranks above "Ghee Organic Cow"
--   • natively understood by PostgREST / supabase-js `.textSearch()`
--
-- Implementation
-- --------------
-- We add a GENERATED ALWAYS AS … STORED tsvector column that Postgres
-- maintains automatically on every INSERT/UPDATE.  It concatenates the four
-- most useful free-text fields weighted by importance:
--
--   'A' = name     (highest — exact product name match should win)
--   'B' = brand    (second — brand searches are common)
--   'C' = category (third  — "buy ghee" should surface Ghee products)
--   'D' = description (lowest — long-form copy, good for discovery)
--
-- Using setweight() lets ts_rank give name matches a higher score than
-- description matches, which is the user expectation.
--
-- The column is STORED (physical), not virtual, so the GIN index only needs
-- to be maintained on write, not recomputed on every SELECT.  Read latency is
-- unaffected by column width.
--
-- Safe to re-run: all statements are IF NOT EXISTS / OR REPLACE / idempotent.
-- Does NOT lock writes: CONCURRENTLY index creation is used.
-- =============================================================================

-- 1. Ensure the full-text extensions are present
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- already added in prev migration
CREATE EXTENSION IF NOT EXISTS unaccent;   -- strips accents for Indian names

-- 2. Register the unaccent-aware search config used in the tsvector
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'english_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION english_unaccent (COPY = english);
    ALTER TEXT SEARCH CONFIGURATION english_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, english_stem;
  END IF;
END;
$$;

-- 3. Add the generated tsvector column (idempotent via IF NOT EXISTS)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english_unaccent', coalesce(name, '')),        'A') ||
      setweight(to_tsvector('english_unaccent', coalesce(brand, '')),       'B') ||
      setweight(to_tsvector('english_unaccent', coalesce(category, '')),    'C') ||
      setweight(to_tsvector('english_unaccent', coalesce(description, '')), 'D')
    ) STORED;

-- 4. GIN index on the tsvector — the key performance win.
--    CONCURRENTLY so it does not block writes on a live table.
--    (CONCURRENTLY cannot run inside a transaction, so the entire file is
--     written as individual statements rather than wrapped in BEGIN/COMMIT.)
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products USING gin (search_vector);

-- 5. Partial FTS index scoped to active, approved products — the hot path.
--    Most searches come from the public storefront and only want live products.
CREATE INDEX IF NOT EXISTS idx_products_search_vector_active
  ON public.products USING gin (search_vector)
  WHERE is_active = true AND approval_status = 'approved';

-- 6. Refresh planner statistics so the query planner uses the new index
--    immediately rather than waiting for the next autovacuum.
ANALYZE public.products;
