-- Products are now hidden from the storefront unless approval_status='approved'.
-- Previously the homepage showed any is_active product, while /api/products
-- (which the cart uses to resolve lines) also required approval. That mismatch
-- is why adding a Deal of the Day product did nothing: the item entered the
-- cart but could not be resolved, so the cart reported itself empty.
--
-- STEP 1 -- read-only. See what customers can now see.
SELECT
  approval_status,
  is_active,
  COUNT(*) AS products
FROM products
GROUP BY approval_status, is_active
ORDER BY approval_status, is_active;

-- STEP 2 -- read-only. List what is now hidden but was visible before.
SELECT id, name, category, approval_status, is_active
FROM products
WHERE is_active = TRUE
  AND (approval_status IS DISTINCT FROM 'approved')
ORDER BY name;

-- STEP 3 -- WRITE. Only run this if STEP 2 listed products you want live.
-- It approves existing active products. Review the list first: approving a
-- product makes it publicly purchasable.
--
-- UPDATE products
-- SET approval_status = 'approved'
-- WHERE is_active = TRUE
--   AND (approval_status IS DISTINCT FROM 'approved');
