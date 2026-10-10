-- ============================================================
-- Migration: Complete Seller Registration & Product Approval Workflow
-- Date: 2026-10-10
--
-- Adds:
-- 1. Expanded seller_inquiries fields (business_type, pan, business_documents, etc.)
-- 2. Expanded status values on seller_inquiries (pending, contacted, approved, rejected, suspended)
-- 3. Product approval fields on products (approval_status, rejection_reason, reviewed_by, etc.)
-- 4. product_status_history table for auditing product approvals
-- ============================================================

-- ─── 1. Alter seller_inquiries table ─────────────────────────
ALTER TABLE public.seller_inquiries DROP CONSTRAINT IF EXISTS seller_inquiries_status_check;
ALTER TABLE public.seller_inquiries ADD CONSTRAINT seller_inquiries_status_check
  CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'individual';
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS business_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.seller_inquiries ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ─── 2. Alter products table for approval workflow ────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_approval_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_details TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS return_policy TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compliance_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT ARRAY[]::text[];

-- ─── 3. Create product_status_history table ──────────────────
CREATE TABLE IF NOT EXISTS public.product_status_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id       UUID        REFERENCES public.sellers(id) ON DELETE SET NULL,
  previous_status TEXT,
  new_status      TEXT        NOT NULL,
  action          TEXT        NOT NULL,
  reason          TEXT,
  notes           TEXT,
  changed_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB       DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON public.products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON public.products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_product_status_history_product_id ON public.product_status_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_status_history_changed_at ON public.product_status_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.product_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ProductStatusHistory: admin all" ON public.product_status_history;
CREATE POLICY "ProductStatusHistory: admin all"
  ON public.product_status_history FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "ProductStatusHistory: seller read own" ON public.product_status_history;
CREATE POLICY "ProductStatusHistory: seller read own"
  ON public.product_status_history FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON s.id = p.seller_id
      WHERE p.id = product_status_history.product_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ProductStatusHistory: service insert" ON public.product_status_history;
CREATE POLICY "ProductStatusHistory: service insert"
  ON public.product_status_history FOR INSERT WITH CHECK (true);

GRANT ALL ON public.product_status_history TO postgres, anon, authenticated, service_role;
