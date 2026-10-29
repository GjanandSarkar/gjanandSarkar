-- Handmade category: rename guard + a real "Purse" product.
--
-- The UI category list now calls this category "Handmade" (it was
-- "Handicrafts & Decor"). products.category stores that display NAME, not the
-- key, so any row saved under the old name would drop out of the category
-- page. Step 1 fixes those rows; it is safe to run when there are none.
--
-- Run the whole file in the Supabase SQL editor. It is idempotent: running it
-- twice does not create a second purse.

BEGIN;

-- 1. Migrate any products stored under the old display name.
UPDATE products
   SET category = 'Handmade'
 WHERE category = 'Handicrafts & Decor';

-- 2. Create the product, but only if it does not already exist.
--    approval_status is set explicitly to 'approved' because this is a
--    first-party seed row; products created through the seller flow must
--    still go through the normal pending -> approved review.
INSERT INTO products (name, category, description, brand, is_active, approval_status)
SELECT
  'Hand Embroidered Cotton Purse',
  'Handmade',
  'Hand embroidered cotton purse made by artisan partners.',
  'Gjanand Sarkar',
  true,
  'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = 'Hand Embroidered Cotton Purse'
);

-- 3. Price it. A product with no priced variant is filtered out of every
--    customer surface by the sellable guard, so it would be invisible
--    without this step.
INSERT INTO product_variants (product_id, weight, price, original_price, stock)
SELECT p.id, 'Small', 649, 899, 12
  FROM products p
 WHERE p.name = 'Hand Embroidered Cotton Purse'
   AND NOT EXISTS (
     SELECT 1 FROM product_variants v
      WHERE v.product_id = p.id AND v.weight = 'Small'
   );

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
SELECT p.id, 'Large', 899, NULL, 4
  FROM products p
 WHERE p.name = 'Hand Embroidered Cotton Purse'
   AND NOT EXISTS (
     SELECT 1 FROM product_variants v
      WHERE v.product_id = p.id AND v.weight = 'Large'
   );

COMMIT;

-- Verify:
-- SELECT p.name, p.category, p.approval_status, v.weight, v.price
--   FROM products p JOIN product_variants v ON v.product_id = p.id
--  WHERE p.category = 'Handmade';
