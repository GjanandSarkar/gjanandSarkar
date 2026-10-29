-- Make product approval opt-IN instead of opt-OUT.
--
-- 20261010_seller_and_product_approval_workflow.sql added the column as:
--
--   ALTER TABLE products ADD COLUMN approval_status TEXT NOT NULL
--     DEFAULT 'approved';
--
-- 'approved' was the right default at the time, because it stopped the
-- existing catalogue disappearing the moment the column arrived. But it
-- leaves approval as something a writer has to remember to opt out of:
-- any INSERT that does not name approval_status publishes the product
-- immediately. Every insert path in the application does set it correctly
-- today, but the schema should not depend on that staying true -- a new
-- insert path, a manual dashboard insert, a CSV import or a seed script
-- would all silently publish unreviewed products.
--
-- Flipping the default makes the unsafe case the one you have to ask for.
-- This changes NOTHING about existing rows: a DEFAULT only applies to new
-- inserts that omit the column.

BEGIN;

ALTER TABLE public.products
  ALTER COLUMN approval_status SET DEFAULT 'pending';

COMMENT ON COLUMN public.products.approval_status IS
  'pending | approved | rejected | suspended. Defaults to pending: a product '
  'must be explicitly approved before the storefront will list it. Customer '
  'facing queries filter on approval_status = ''approved''.';

COMMIT;


-- ---------------------------------------------------------------------
-- DIAGNOSTICS (read-only -- run these separately, they are not part of
-- the migration above)
-- ---------------------------------------------------------------------
--
-- 1. Which products are live but have no variant a customer could buy?
--    These are the rows that render as ₹0 and put a ₹0 line in the cart.
--    The application now hides them from the storefront, but they should
--    be repaired or deactivated.
--
-- SELECT p.id, p.name, p.category, p.approval_status, p.is_active,
--        p.seller_id, p.created_by, p.created_at,
--        COUNT(v.id)                                   AS variant_count,
--        COUNT(v.id) FILTER (WHERE v.price > 0)        AS priced_variants
-- FROM products p
-- LEFT JOIN product_variants v ON v.product_id = p.id
-- WHERE p.is_active = TRUE
-- GROUP BY p.id
-- HAVING COUNT(v.id) FILTER (WHERE v.price > 0) = 0
-- ORDER BY p.created_at DESC;
--
--
-- 2. Which products went live WITHOUT going through an approval request?
--    This answers how a seller's product reached the storefront: if a row
--    appears here with a seller_id, something inserted it directly into
--    products instead of into seller_product_approval.
--
-- SELECT p.id, p.name, p.seller_id, p.created_by, p.approval_status,
--        p.is_active, p.created_at
-- FROM products p
-- WHERE p.seller_id IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM seller_product_approval a
--     WHERE a.name = p.name AND a.seller_id = p.seller_id
--   )
-- ORDER BY p.created_at DESC;
--
--
-- 3. OPTIONAL WRITE -- deactivate live products that cannot be priced.
--    Review the output of query 1 first. Deactivating is reversible;
--    the row and its data are kept.
--
-- UPDATE products p
-- SET is_active = FALSE
-- WHERE p.is_active = TRUE
--   AND NOT EXISTS (
--     SELECT 1 FROM product_variants v
--     WHERE v.product_id = p.id AND v.price > 0
--   );
