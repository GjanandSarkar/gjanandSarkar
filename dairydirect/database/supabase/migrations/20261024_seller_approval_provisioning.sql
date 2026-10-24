-- ============================================================================
-- Seller approval: let approval actually provision a store
-- ============================================================================
--
-- Symptom reported from production use: an admin approved a seller
-- application (it showed APPROVED, with a decision timestamp), but the seller
-- was still refused with "You do not have an active seller account" when
-- adding a product, and the store never appeared in Seller Lifecycle
-- Management.
--
-- There were two independent causes. The first was in application code and is
-- fixed in src/app/api/sellers/inquiries/route.ts: the approval used
--
--     .upsert({ ... }, { onConflict: 'user_id' })
--
-- but sellers.user_id carries only a PLAIN index (idx_sellers_user_id), not a
-- unique constraint. ON CONFLICT requires a unique or exclusion constraint to
-- arbitrate on, so Postgres rejected every such statement with SQLSTATE 42P10
-- and no seller row was ever created. The error was discarded, so the
-- application was still marked approved.
--
-- The second cause is this index.

-- ─── 1. One company per category becomes an admin decision, not a hard block ─
--
-- uniq_active_seller_per_category (added 20261006) made it impossible to have
-- two active sellers in one category. That matches the business rule, but
-- enforcing it here meant approving a second Dairy partner failed with an
-- opaque database error rather than telling the admin what was wrong.
--
-- The rule is now enforced in the approval API, which names the existing
-- partner and requires an explicit confirmation to proceed. Dropping the index
-- is what makes that override possible.
--
-- NOTE: this intentionally allows more than one active seller per category.
-- The guard rail is the confirmation step in
-- PATCH /api/sellers/inquiries, not the database.

DROP INDEX IF EXISTS public.uniq_active_seller_per_category;

-- ─── 2. One seller store per user ───────────────────────────────────────────
--
-- A user should never own two seller stores: the product APIs all resolve the
-- store with .eq('user_id', ...).maybeSingle(), which errors if a second row
-- ever appears. This was previously only an assumption.
--
-- Added as a partial unique index over non-null user_id so historical rows
-- whose owner was cleared (user_id is ON DELETE SET NULL) do not collide.
--
-- If this fails, two stores already share an owner. Find them with:
--
--   SELECT user_id, count(*), array_agg(store_name)
--   FROM public.sellers
--   WHERE user_id IS NOT NULL
--   GROUP BY user_id HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_seller_per_user
  ON public.sellers (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON INDEX public.uniq_seller_per_user IS
  'A user owns at most one seller store. The product APIs assume this when resolving a store by user_id.';


-- ============================================================================
-- DIAGNOSTICS - run these to find sellers broken by the old upsert
-- ============================================================================

-- 1. Approved applications with NO seller store. These are the accounts stuck
--    on "You do not have an active seller account". Re-approving them in the
--    admin UI now provisions the store correctly.
--
-- SELECT i.id            AS application_id,
--        i.business_name,
--        i.email,
--        i.category,
--        i.user_id,
--        i.reviewed_at
-- FROM public.seller_inquiries i
-- LEFT JOIN public.sellers s ON s.user_id = i.user_id
-- WHERE i.status = 'approved'
--   AND s.id IS NULL
-- ORDER BY i.reviewed_at DESC;

-- 2. Approved applications never linked to a user account. These cannot be
--    provisioned at all: the applicant must sign in with the email they
--    applied with so the account can be matched.
--
-- SELECT id, business_name, email, phone, reviewed_at
-- FROM public.seller_inquiries
-- WHERE status = 'approved'
--   AND user_id IS NULL
-- ORDER BY reviewed_at DESC;

-- 3. Categories that now hold more than one ACTIVE seller. Expected to be
--    empty unless an admin deliberately overrode the one-company-per-category
--    warning; anything here is worth a conscious review.
--
-- SELECT lower(trim(category)) AS category,
--        count(*)              AS active_sellers,
--        array_agg(store_name) AS stores
-- FROM public.sellers
-- WHERE status = 'active'
-- GROUP BY 1
-- HAVING count(*) > 1
-- ORDER BY 2 DESC;

-- 4. Sellers whose owning profile does not carry the 'seller' role. They will
--    fail role-based checks even though the store exists.
--
-- SELECT s.id, s.store_name, s.user_id, p.role
-- FROM public.sellers s
-- JOIN public.profiles p ON p.id = s.user_id
-- WHERE s.status = 'active'
--   AND p.role <> 'seller'
--   AND p.role <> 'admin';
