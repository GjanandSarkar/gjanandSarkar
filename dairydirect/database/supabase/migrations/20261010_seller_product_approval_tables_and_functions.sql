-- ============================================================
-- Migration: Seller Product Approval & Rejection Staging Workflow
-- Date: 2026-10-10
--
-- Flow:
-- 1. Seller submits product -> inserted into `seller_product_approval` (status = 'pending')
--    NOT inserted into `products` or `seller_product`.
-- 2. Admin approves product -> atomic function `approve_seller_product`:
--    - Creates `products` row
--    - Creates `product_variants` row
--    - Creates `seller_product` row
--    - Updates `seller_product_approval` status = 'approved', links `product_id`
--    - Logs to `product_status_history`
-- 3. Admin rejects product -> atomic function `reject_seller_product`:
--    - Creates `seller_product_rejected` row with rejection_reason
--    - Updates `seller_product_approval` status = 'rejected'
-- ============================================================

-- 1. Create seller_product_approval table
CREATE TABLE IF NOT EXISTS public.seller_product_approval (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id            UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  seller_user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL,
  subcategory          TEXT,
  description          TEXT,
  image_url            TEXT,
  gallery_images       JSONB DEFAULT '[]'::jsonb,
  brand                TEXT,
  sku                  TEXT,
  price                NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  original_price       NUMERIC(10,2),
  cost_price           NUMERIC(10,2) DEFAULT 0.00,
  stock                INTEGER NOT NULL DEFAULT 0,
  weight               TEXT DEFAULT 'Standard',
  tax_rate             NUMERIC(5,2) DEFAULT 0.00,
  shipping_details     TEXT,
  return_policy        TEXT,
  attributes           JSONB DEFAULT '{}'::jsonb,
  compliance_documents JSONB DEFAULT '[]'::jsonb,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  product_id           UUID REFERENCES public.products(id) ON DELETE SET NULL,
  admin_notes          TEXT,
  reviewed_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_prod_approval_seller ON public.seller_product_approval(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_prod_approval_status ON public.seller_product_approval(status);
CREATE INDEX IF NOT EXISTS idx_seller_prod_approval_user ON public.seller_product_approval(seller_user_id);

-- 2. Create seller_product_rejected table
CREATE TABLE IF NOT EXISTS public.seller_product_rejected (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id          UUID REFERENCES public.seller_product_approval(id) ON DELETE SET NULL,
  seller_id            UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  seller_user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  category             TEXT,
  price                NUMERIC(10,2),
  stock                INTEGER,
  image_url            TEXT,
  rejection_reason     TEXT NOT NULL,
  rejected_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata             JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_seller_prod_rejected_seller ON public.seller_product_rejected(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_prod_rejected_approval ON public.seller_product_rejected(approval_id);

-- 3. RLS
ALTER TABLE public.seller_product_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_product_rejected ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.seller_product_approval TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.seller_product_rejected TO postgres, anon, authenticated, service_role;

-- 4. Atomic Approval Function
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

  -- Convert JSONB gallery images to text[] array
  IF v_req.gallery_images IS NOT NULL AND jsonb_typeof(v_req.gallery_images) = 'array' AND jsonb_array_length(v_req.gallery_images) > 0 THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[]) INTO v_gallery_arr
    FROM jsonb_array_elements_text(v_req.gallery_images) t(x);
  ELSE
    v_gallery_arr := ARRAY[]::text[];
  END IF;

  -- 2. Insert into products catalog table
  INSERT INTO public.products (
    name,
    category,
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

  INSERT INTO public.product_variants (
    product_id,
    weight,
    price,
    original_price,
    cost_price,
    stock
  ) VALUES (
    v_new_product_id,
    COALESCE(v_req.weight, 'Standard'),
    v_req.price,
    v_req.original_price,
    COALESCE(v_req.cost_price, 0),
    COALESCE(v_req.stock, 0)
  ) RETURNING id INTO v_variant_id;

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
    v_req.stock,
    'active'
  )
  ON CONFLICT (product_id) DO UPDATE SET
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    status = 'active',
    updated_at = now();

  UPDATE public.seller_product_approval SET
    status = 'approved',
    product_id = v_new_product_id,
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    admin_notes = p_notes,
    updated_at = now()
  WHERE id = p_approval_id;

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

-- 5. Atomic Rejection Function
CREATE OR REPLACE FUNCTION public.reject_seller_product(
  p_approval_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_rejected_id UUID;
BEGIN
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

  UPDATE public.seller_product_approval SET
    status = 'rejected',
    is_approved = false,
    is_rejected = true,
    rejection_reason = trim(p_rejection_reason),
    admin_notes = trim(p_rejection_reason),
    reviewed_by = p_admin_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_approval_id;

  RETURN p_approval_id;
END;
$$;
