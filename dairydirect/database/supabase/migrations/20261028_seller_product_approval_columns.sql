-- =============================================================================
-- Migration: 20261028_seller_product_approval_columns.sql
-- Add missing approval status flags and rejection reason to seller_product_approval
-- Add gallery_images to seller_product table for parity with test database
-- =============================================================================

ALTER TABLE public.seller_product_approval 
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.seller_product 
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.seller_product_approval.is_approved IS 
  'Flag indicating whether this product submission has been approved by admin.';

COMMENT ON COLUMN public.seller_product_approval.is_rejected IS 
  'Flag indicating whether this product submission has been rejected by admin.';

COMMENT ON COLUMN public.seller_product_approval.rejection_reason IS 
  'Reason given by admin when rejecting a product approval request.';
