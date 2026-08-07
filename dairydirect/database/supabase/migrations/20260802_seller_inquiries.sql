-- ============================================================
-- Gjanand Sarkar — Seller Inquiries & Manual Verification Flow
-- Idempotent & Safe
-- ============================================================

CREATE TABLE IF NOT EXISTS seller_inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  business_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  city            TEXT,
  state           TEXT NOT NULL DEFAULT 'Gujarat',
  category        TEXT NOT NULL DEFAULT 'A2 Dairy & Ghee',
  product_range   TEXT,
  monthly_volume  TEXT,
  gstin           TEXT,
  fssai_number    TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_inquiries_status ON seller_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_phone ON seller_inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_created_at ON seller_inquiries(created_at DESC);
