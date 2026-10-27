-- =============================================================================
-- Migration: 20261028_add_sellers_phone.sql
-- Add contact phone column to sellers table
-- =============================================================================

ALTER TABLE public.sellers 
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.sellers.phone IS 
  'Direct contact phone number for the seller business, synced from seller inquiry.';
