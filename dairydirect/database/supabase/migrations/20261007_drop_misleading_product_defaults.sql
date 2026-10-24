-- ============================================================
-- Migration: remove misleading defaults on products.brand and products.rating
--
-- 001_schema.sql declares:
--     brand  TEXT          DEFAULT 'Gjanand Farm'
--     rating NUMERIC(2,1)  DEFAULT 4.80
--
-- Both date from when this was a single-brand dairy shop. They are now
-- actively harmful:
--
--   brand   Every product inserted without an explicit brand silently claims
--           to be made by "Gjanand Farm". On a multi-category marketplace
--           that means electronics, books and handloom all attributed to a
--           dairy. Listing queries now select brand and render it on the
--           card, so the wrong value is shown to customers rather than just
--           sitting in a column.
--
--   rating  A brand new product with no reviews reads as 4.8 stars. The
--           listing card only shows a rating when reviews_count > 0, so the
--           default is masked there, but any query reading products.rating
--           directly treats a schema default as customer sentiment.
--           Presenting an unearned rating as a real one is the kind of
--           claim the CCPA 2023 dark-patterns guidelines prohibit.
--
-- Ratings must be earned by rows in the reviews table. Brand must be stated
-- by whoever lists the product.
-- ============================================================

-- 1. Drop the defaults so future inserts cannot inherit them silently.
ALTER TABLE products ALTER COLUMN brand  DROP DEFAULT;
ALTER TABLE products ALTER COLUMN rating DROP DEFAULT;

-- 2. rating must be able to say "unrated" rather than being forced to a
--    number. Only drop NOT NULL if it is actually set.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'rating' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE products ALTER COLUMN rating DROP NOT NULL;
  END IF;
END $$;

-- 3. Clear ratings that no review supports. A rating with no reviews behind
--    it cannot be anything other than the old default or a fixture value.
UPDATE products
SET rating = NULL
WHERE COALESCE(reviews_count, 0) = 0
  AND rating IS NOT NULL;

-- 4. Keep products.rating honest from here on: recompute it from the reviews
--    table whenever a review is written, instead of trusting whatever a
--    client sends. reviews_count is maintained alongside it.
CREATE OR REPLACE FUNCTION trg_refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE products p
  SET rating = sub.avg_rating,
      reviews_count = sub.n,
      updated_at = now()
  FROM (
    SELECT
      ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
      COUNT(*)                         AS n
    FROM reviews r
    WHERE r.product_id = v_product_id
      AND r.rating IS NOT NULL
      AND r.rating > 0
  ) sub
  WHERE p.id = v_product_id;

  -- No qualifying reviews left: fall back to "unrated" rather than stale.
  UPDATE products
  SET rating = NULL, reviews_count = 0
  WHERE id = v_product_id
    AND NOT EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.product_id = v_product_id AND r.rating IS NOT NULL AND r.rating > 0
    );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_refresh_product_rating ON reviews;
CREATE TRIGGER trg_reviews_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trg_refresh_product_rating();

-- 5. Backfill once so existing review rows are reflected.
UPDATE products p
SET rating = sub.avg_rating,
    reviews_count = sub.n
FROM (
  SELECT product_id,
         ROUND(AVG(rating)::numeric, 1) AS avg_rating,
         COUNT(*)                       AS n
  FROM reviews
  WHERE rating IS NOT NULL AND rating > 0
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;
