-- ============================================================
-- Gjanand Sarkar — SaaS Multi-Vendor Marketplace Migration
-- Idempotent & Safe
-- ============================================================

-- ─── 1. Sellers / Vendor Stores ──────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  store_name      TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  state           TEXT NOT NULL DEFAULT 'Gujarat',
  category        TEXT NOT NULL DEFAULT 'A2 Organic Dairy',
  description     TEXT,
  logo_url        TEXT,
  banner_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'growth', -- 'starter' (8%), 'growth' (5%), 'enterprise' (3%)
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  status          TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_kyc', 'suspended'
  gstin           TEXT,
  pan             TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  total_sales     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_state ON sellers(state);

-- ─── 2. Seller Payouts / Financials ──────────────────────────
CREATE TABLE IF NOT EXISTS seller_payouts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount       DECIMAL(10,2) NOT NULL,
  fee_deducted DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  net_amount   DECIMAL(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'completed',
  payout_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference_no TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);

-- ─── 3. Customer Wishlists ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- ─── 4. Product Reviews & Ratings ────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name         TEXT NOT NULL,
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title             TEXT,
  comment           TEXT NOT NULL,
  state_origin      TEXT DEFAULT 'Gujarat',
  is_verified_buyer BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- ─── 5. Alter Products with SaaS Marketplace Attributes ───────
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS state_origin TEXT DEFAULT 'Gujarat';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Gjanand Farm';
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 4.80;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 128;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deal_of_the_day BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_pct INTEGER DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY['Made in India', 'Authentic', '100% Pure'];
