-- ============================================================
-- Migration: Fix approve_seller_product & add resulting_product_id
-- Date: 2026-10-28
-- Description:
-- 1. Adds resulting_product_id column to seller_product_approval
-- 2. Updates approve_seller_product stored procedure to set both
--    product_id and resulting_product_id, link category_id,
--    set available_quantity correctly, and record product_status_history.
-- ============================================================

-- 1. Ensure resulting_product_id column exists on seller_product_approval
ALTER TABLE public.seller_product_approval
  ADD COLUMN IF NOT EXISTS resulting_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seller_prod_approval_resulting_prod 
  ON public.seller_product_approval(resulting_product_id);

-- 2. Update approve_seller_product function with complete compatibility
CREATE OR REPLACE FUNCTION public.approve_seller_product(
  p_approval_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_new_product_id UUID;
  v_variant_id UUID;
  v_gallery_arr TEXT[];
  v_var JSONB;
  v_category_id UUID;
BEGIN
  -- 1. Fetch and Lock Pending Approval Request
  SELECT * INTO v_req
  FROM public.seller_product_approval
  WHERE id = p_approval_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval request not found: %', p_approval_id;
  END IF;

  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed with status: %', v_req.status;
  END IF;

  -- 2. Auto-provision category if custom/new category was created by seller
  IF v_req.category IS NOT NULL AND TRIM(v_req.category) != '' THEN
    INSERT INTO public.categories (name, slug, is_active)
    VALUES (
      TRIM(v_req.category),
      LOWER(REGEXP_REPLACE(TRIM(v_req.category), '[^a-zA-Z0-9]+', '-', 'g')),
      true
    )
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_category_id
    FROM public.categories
    WHERE LOWER(name) = LOWER(TRIM(v_req.category))
    LIMIT 1;
  END IF;

  -- Convert JSONB gallery images to text[] array
  IF v_req.gallery_images IS NOT NULL AND jsonb_typeof(v_req.gallery_images) = 'array' AND jsonb_array_length(v_req.gallery_images) > 0 THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[]) INTO v_gallery_arr
    FROM jsonb_array_elements_text(v_req.gallery_images) t(x);
  ELSE
    v_gallery_arr := ARRAY[]::text[];
  END IF;

  -- 3. Insert into products catalog table
  INSERT INTO public.products (
    name,
    category,
    category_id,
    subcategory,
    description,
    image_url,
    gallery_images,
    brand,
    sku,
    tax_rate,
    shipping_details,
    return_policy,
    attributes,
    compliance_documents,
    is_active,
    approval_status,
    seller_id,
    created_by,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at
  ) VALUES (
    v_req.name,
    v_req.category,
    v_category_id,
    v_req.subcategory,
    v_req.description,
    v_req.image_url,
    v_gallery_arr,
    COALESCE(v_req.brand, 'Gjanand Farm Organics'),
    COALESCE(v_req.sku, 'SKU-' || upper(substr(md5(random()::text), 1, 8))),
    COALESCE(v_req.tax_rate, 5.0),
    v_req.shipping_details,
    v_req.return_policy,
    COALESCE(v_req.attributes, '{}'::jsonb),
    COALESCE(v_req.compliance_documents, '[]'::jsonb),
    true,
    'approved',
    v_req.seller_id,
    v_req.seller_user_id,
    p_admin_id,
    now(),
    now(),
    now()
  ) RETURNING id INTO v_new_product_id;

  -- 4. Insert variants: multiple if available, otherwise single fallback
  IF v_req.variants IS NOT NULL AND jsonb_typeof(v_req.variants) = 'array' AND jsonb_array_length(v_req.variants) > 0 THEN
    FOR v_var IN SELECT * FROM jsonb_array_elements(v_req.variants)
    LOOP
      INSERT INTO public.product_variants (
        product_id,
        weight,
        price,
        original_price,
        cost_price,
        stock,
        available_quantity
      ) VALUES (
        v_new_product_id,
        COALESCE(NULLIF(TRIM(v_var->>'weight'), ''), 'Standard'),
        COALESCE((v_var->>'price')::NUMERIC, v_req.price),
        (v_var->>'original_price')::NUMERIC,
        COALESCE((v_var->>'cost_price')::NUMERIC, 0),
        COALESCE((v_var->>'stock')::INT, 0),
        COALESCE((v_var->>'stock')::INT, 0)
      );
    END LOOP;
  ELSE
    INSERT INTO public.product_variants (
      product_id,
      weight,
      price,
      original_price,
      cost_price,
      stock,
      available_quantity
    ) VALUES (
      v_new_product_id,
      COALESCE(v_req.weight, 'Standard'),
      v_req.price,
      v_req.original_price,
      COALESCE(v_req.cost_price, 0),
      COALESCE(v_req.stock, 0),
      COALESCE(v_req.stock, 0)
    ) RETURNING id INTO v_variant_id;
  END IF;

  -- 5. Insert into seller_product junction
  INSERT INTO public.seller_product (
    product_id,
    seller_id,
    name,
    category,
    description,
    image_url,
    price,
    stock,
    status
  ) VALUES (
    v_new_product_id,
    v_req.seller_id,
    v_req.name,
    v_req.category,
    v_req.description,
    v_req.image_url,
    v_req.price,
    COALESCE(v_req.stock, 0),
    'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    status = 'active',
    updated_at = now();

  -- 6. Update staging request status
  UPDATE public.seller_product_approval
  SET
    status = 'approved',
    is_approved = true,
    is_rejected = false,
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    admin_notes = p_notes,
    product_id = v_new_product_id,
    resulting_product_id = v_new_product_id,
    updated_at = now()
  WHERE id = p_approval_id;

  -- 7. Audit log in product_status_history
  INSERT INTO public.product_status_history (
    product_id,
    seller_id,
    previous_status,
    new_status,
    action,
    reason,
    notes,
    changed_by,
    changed_at
  ) VALUES (
    v_new_product_id,
    v_req.seller_id,
    'pending',
    'approved',
    'admin_approved',
    'Product approved and published to marketplace',
    p_notes,
    p_admin_id,
    now()
  );

  RETURN v_new_product_id;
END;
$$;
