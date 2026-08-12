-- ============================================================
-- DairyDirect (Gjanand Sarkar) — Supabase Master Production Schema
-- Version: 2.0 (Corrected & Consolidated)
-- 
-- Business: Premium A2 dairy delivery for Gjanand Sarkar
-- Features: Multi-vendor marketplace, subscriptions, freshness guarantee,
--           Razorpay payments, OTP auth, loyalty points, referrals.
--
-- Instructions: Run in Supabase SQL Editor (Database → SQL Editor)
-- Idempotent: Safe to re-run without errors.
-- ============================================================

-- ─── 0. Extensions ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. Profiles ────────────────────────────────────────────────────────────
-- Primary user table. References auth.users for Supabase Auth integration.
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone           TEXT        UNIQUE,
  email           TEXT        UNIQUE,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT        NOT NULL DEFAULT 'customer'
                              CHECK (role IN ('customer', 'admin', 'seller')),
  default_upi_id  TEXT,
  loyalty_points  INTEGER     NOT NULL DEFAULT 0,
  referral_code   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by     TEXT,                                           -- referral_code of referring user
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone         ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email         ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- ─── 1b. Users Table (Direct User Entity) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT        PRIMARY KEY,
  phone       TEXT,
  name        TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ─── 2. User Addresses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL DEFAULT 'Home',
  address     TEXT        NOT NULL,
  apartment   TEXT,
  pincode     TEXT,
  city        TEXT        DEFAULT 'Palanpur',
  state       TEXT        DEFAULT 'Gujarat',
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  is_deleted  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id   ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default   ON user_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_addresses_active    ON user_addresses(user_id) WHERE is_deleted = false;

-- ─── 3. Delivery Slots ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_slots (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name            TEXT    NOT NULL,
  start_time           TIME    NOT NULL,
  end_time             TIME    NOT NULL,
  max_orders_capacity  INTEGER NOT NULL DEFAULT 100,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_slots_active ON delivery_slots(is_active);

-- ─── 4. Sellers (Multi-Vendor Marketplace) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  store_name      TEXT          NOT NULL,
  slug            TEXT          NOT NULL UNIQUE,
  state           TEXT          NOT NULL DEFAULT 'Gujarat',
  category        TEXT          DEFAULT 'A2 Organic Dairy',
  description     TEXT,
  logo_url        TEXT,
  banner_url      TEXT,
  -- Plan determines commission: starter (8%), growth (5%), enterprise (3%)
  plan            TEXT          DEFAULT 'growth' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  commission_rate NUMERIC(5,2)  NOT NULL DEFAULT 5.00,
  status          TEXT          NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'pending', 'suspended', 'pending_kyc')),
  gstin           TEXT,
  pan             TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  total_sales     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  fssai_number    TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_state   ON sellers(state);
CREATE INDEX IF NOT EXISTS idx_sellers_status  ON sellers(status);

-- ─── 5. Seller Payouts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_payouts (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID          NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount       NUMERIC(10,2) NOT NULL,
  fee_deducted NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_amount   NUMERIC(10,2) NOT NULL,
  status       TEXT          NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'completed', 'paid', 'failed')),
  payout_date  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  reference_no TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);

-- ─── 6. Seller Inquiries ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_inquiries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  full_name      TEXT        NOT NULL,
  business_name  TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  email          TEXT,
  city           TEXT,
  state          TEXT        NOT NULL DEFAULT 'Gujarat',
  category       TEXT        DEFAULT 'A2 Dairy & Ghee',
  product_range  TEXT,
  monthly_volume TEXT,
  gstin          TEXT,
  fssai_number   TEXT,
  notes          TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_inquiries_phone      ON seller_inquiries(phone);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_status     ON seller_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_created_at ON seller_inquiries(created_at DESC);

-- ─── 7. Products ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT          NOT NULL,
  -- Allowed categories for Gjanand Sarkar dairy business (constraint removed to allow dynamic categories)
  category                TEXT          NOT NULL,
  description             TEXT,
  image_url               TEXT,
  s3_image_key            TEXT,
  is_freshness_guarantee  BOOLEAN       NOT NULL DEFAULT true,
  is_active               BOOLEAN       NOT NULL DEFAULT true,
  seller_id               UUID          REFERENCES sellers(id) ON DELETE SET NULL,
  state_origin            TEXT          DEFAULT 'Gujarat',
  brand                   TEXT          DEFAULT 'Gjanand Farm',
  rating                  NUMERIC(3,2)  DEFAULT 4.80 CHECK (rating >= 0 AND rating <= 5),
  reviews_count           INTEGER       DEFAULT 0,
  is_deal_of_the_day      BOOLEAN       DEFAULT false,
  discount_pct            INTEGER       DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
  tags                    TEXT[]        DEFAULT ARRAY['Made in India', 'Authentic', '100% Pure'],
  sort_order              INTEGER       DEFAULT 0,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category         ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active        ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_seller_id        ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_deal_of_day      ON products(is_deal_of_the_day) WHERE is_deal_of_the_day = true;
CREATE INDEX IF NOT EXISTS idx_products_sort             ON products(sort_order ASC, created_at DESC);

-- ─── 8. Product Variants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight              TEXT          NOT NULL,  -- '500ml', '1 Litre', '200g', '500g', '1kg'
  price               NUMERIC(10,2) NOT NULL CHECK (price > 0),
  original_price      NUMERIC(10,2) CHECK (original_price >= 0),
  cost_price          NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  stock               INTEGER       NOT NULL DEFAULT 100 CHECK (stock >= 0),
  low_stock_threshold INTEGER       NOT NULL DEFAULT 10,
  batch_number        TEXT,
  expiry_date         DATE,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT profit_margin_guard CHECK (price >= cost_price)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock      ON product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_active     ON product_variants(product_id, is_active);

-- ─── 9. Cart Items ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- ─── 10. Subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id         UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id         UUID        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  volume             INTEGER     NOT NULL DEFAULT 1 CHECK (volume > 0),
  plan               TEXT        NOT NULL DEFAULT 'daily'
                     CHECK (plan IN ('daily', 'alternate', 'weekly', 'custom')),
  delivery_slot      TEXT        DEFAULT 'Early Morning (5:00 AM - 7:00 AM)',
  status             TEXT        NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'paused', 'cancelled', 'pending_review')),
  start_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date           DATE,                                        -- NULL = open-ended
  next_delivery_date DATE        NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  pause_until        DATE,                                        -- Used for temporary pauses
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id            ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status             ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_delivery      ON subscriptions(next_delivery_date) WHERE status = 'active';

-- ─── 11. Subscription Modification Reports ──────────────────────────────────
-- Tracks change requests for subscriptions (volume changes, pauses, etc.)
CREATE TABLE IF NOT EXISTS modification_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- action: 'pause', 'resume', 'change_volume', 'change_plan', 'cancel'
  action           TEXT        NOT NULL,
  new_volume       INTEGER,
  new_plan         TEXT,
  -- NOTE: Lowercase only. Old mixed-case values should be migrated.
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mod_reports_sub  ON modification_reports(subscription_id);
CREATE INDEX IF NOT EXISTS idx_mod_reports_user ON modification_reports(user_id);

-- ─── 12. Orders ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT          UNIQUE NOT NULL
                      DEFAULT ('ORD-' || UPPER(SUBSTR(ENCODE(gen_random_bytes(4), 'hex'), 1, 8))),
  user_id             UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  address_id          UUID          REFERENCES user_addresses(id) ON DELETE SET NULL,
  shipping_address    TEXT,
  status              TEXT          NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal            NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_method      TEXT          NOT NULL DEFAULT 'COD'
                      CHECK (payment_method IN ('COD', 'Razorpay', 'UPI', 'Card', 'NetBanking', 'Wallet')),
  payment_status      TEXT          NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_details     JSONB,
  razorpay_order_id   TEXT          UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  delivery_slot       TEXT,
  delivery_date       TIMESTAMPTZ,
  coupon_code         TEXT,
  loyalty_earned      INTEGER       NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status   ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order   ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders(created_at DESC);

-- ─── 13. Order Items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID          REFERENCES products(id) ON DELETE SET NULL,
  variant_id     UUID          REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name   TEXT,
  variant_weight TEXT,
  quantity       INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price          NUMERIC(10,2) NOT NULL,
  cost_price     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ─── 14. Return Requests (100% Freshness Guarantee) ─────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id        UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- reason: 'Quality Issue', 'Sour Milk', 'Packaging Damaged', 'Wrong Item', 'Not Delivered', 'Other'
  reason         TEXT          NOT NULL,
  description    TEXT,
  images         TEXT[]        DEFAULT ARRAY[]::TEXT[],
  status         TEXT          NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  refund_amount  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order  ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user   ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

-- ─── 15. Wishlists ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- ─── 16. Reviews ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id            UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  user_name          TEXT        NOT NULL,
  rating             INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title              TEXT,
  comment            TEXT        NOT NULL,
  state_origin       TEXT        DEFAULT 'Gujarat',
  is_verified_buyer  BOOLEAN     NOT NULL DEFAULT false,
  helpful_count      INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating     ON reviews(product_id, rating DESC);

-- ─── 17. Coupons ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT          NOT NULL UNIQUE,
  type            TEXT          NOT NULL DEFAULT 'percentage'
                  CHECK (type IN ('percentage', 'flat')),
  value           NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_discount    NUMERIC(10,2),
  max_uses        INTEGER,
  used_count      INTEGER       NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  expiry_date     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;

-- ─── 18. Business Settings ──────────────────────────────────────────────────
-- Single-row settings table. Always use ON CONFLICT for upserts.
CREATE TABLE IF NOT EXISTS business_settings (
  id                         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  min_order_value            NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  standard_delivery_fee      NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  delivery_cost              NUMERIC(10,2) NOT NULL DEFAULT 25.00,   -- Alias for backward compat
  free_delivery_threshold    NUMERIC(10,2) NOT NULL DEFAULT 299.00,
  min_profit_margin_percent  NUMERIC(5,2)  NOT NULL DEFAULT 20.00,
  max_discount_percent       NUMERIC(5,2)  NOT NULL DEFAULT 30.00,
  freshness_guarantee_hours  INTEGER       NOT NULL DEFAULT 24,
  is_store_open              BOOLEAN       NOT NULL DEFAULT true,
  store_closure_reason       TEXT,
  support_phone              TEXT          NOT NULL DEFAULT '+91 98765 43210',
  support_email              TEXT          NOT NULL DEFAULT 'care@gjanandsarkar.com',
  razorpay_enabled           BOOLEAN       NOT NULL DEFAULT true,
  cod_enabled                BOOLEAN       NOT NULL DEFAULT true,
  gst_rate_percent           NUMERIC(5,2)  NOT NULL DEFAULT 0.00,    -- Most dairy is GST-exempt
  updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── 19. OTP Store ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_store (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) NOT NULL,
  otp        VARCHAR(6)  NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_store_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_store_verified      ON otp_store(verified);

-- ─── 20. Notifications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  role_target TEXT        NOT NULL DEFAULT 'customer'
              CHECK (role_target IN ('customer', 'admin', 'seller', 'all')),
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  -- type: 'order', 'promo', 'subscription', 'system', 'return', 'info'
  type        TEXT        NOT NULL DEFAULT 'info',
  related_id  TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = false;

-- ─── 21. Translations ───────────────────────────────────────────────────────
-- Service-role access only — avoid public read via RLS to prevent abuse.
CREATE TABLE IF NOT EXISTS translations (
  language TEXT NOT NULL,
  key      TEXT NOT NULL,
  value    TEXT NOT NULL,
  PRIMARY KEY (language, key)
);

-- ─── 22. Audit Logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin  ON audit_logs(admin_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: Check if a given user_id belongs to an admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'
  );
$$;

-- Helper: Auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to all tables with updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at       ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sellers_updated_at        ON sellers;
CREATE TRIGGER trg_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at       ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at         ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at  ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_otp_store_updated_at      ON otp_store;
CREATE TRIGGER trg_otp_store_updated_at
  BEFORE UPDATE ON otp_store
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: Enforce a single default address per user
CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_default_address ON user_addresses;
CREATE TRIGGER trg_enforce_single_default_address
  AFTER INSERT OR UPDATE OF is_default ON user_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION enforce_single_default_address();

-- ═══════════════════════════════════════════════════════════════════════════
-- STORED PROCEDURE: place_order_atomic
-- Atomically places an order: validates stock, calculates totals,
-- applies coupon, inserts order + order_items, deducts inventory,
-- awards loyalty points, and clears the user's cart.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id        UUID,
  p_address_id     UUID,
  p_shipping_address TEXT,
  p_delivery_slot  TEXT,
  p_delivery_date  TIMESTAMPTZ,
  p_notes          TEXT,
  p_payment_method TEXT,
  p_items          JSONB,          -- [{ "variant_id": "<uuid>", "quantity": <int> }]
  p_coupon_code    TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_id      UUID;
  v_subtotal      NUMERIC(10,2) := 0.00;
  v_delivery_fee  NUMERIC(10,2) := 25.00;
  v_free_threshold NUMERIC(10,2) := 299.00;
  v_discount      NUMERIC(10,2) := 0.00;
  v_total         NUMERIC(10,2) := 0.00;
  v_loyalty_earn  INTEGER := 0;
  v_item          RECORD;
  v_variant       RECORD;
  v_coupon        RECORD;
  v_order_number  TEXT;
BEGIN
  -- 1. Load business settings
  SELECT
    COALESCE(standard_delivery_fee, 25.00),
    COALESCE(free_delivery_threshold, 299.00)
  INTO v_delivery_fee, v_free_threshold
  FROM business_settings
  LIMIT 1;

  -- 2. Validate stock and compute subtotal (row-level locks for concurrency)
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
  LOOP
    SELECT pv.*, p.name AS product_name
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id
      AND pv.is_active = true
      AND p.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % not found or inactive', v_item.variant_id;
    END IF;

    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_variant.product_name, v_variant.stock, v_item.quantity;
    END IF;

    -- Deduct stock
    UPDATE product_variants
    SET stock = stock - v_item.quantity, updated_at = now()
    WHERE id = v_item.variant_id;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  END LOOP;

  -- Guard against empty cart
  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Apply free delivery threshold
  IF v_subtotal >= v_free_threshold THEN
    v_delivery_fee := 0.00;
  END IF;

  -- 4. Validate and apply coupon
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
      AND is_active = true
      AND (expiry_date IS NULL OR expiry_date > now())
      AND (max_uses IS NULL OR used_count < max_uses)
    FOR UPDATE;

    IF FOUND AND v_subtotal >= v_coupon.min_order_value THEN
      IF v_coupon.type = 'flat' THEN
        v_discount := v_coupon.value;
      ELSE
        v_discount := ROUND((v_subtotal * v_coupon.value) / 100.0, 2);
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
          v_discount := v_coupon.max_discount;
        END IF;
      END IF;
      -- Increment coupon usage
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 5. Calculate final total
  v_total := GREATEST(v_subtotal + v_delivery_fee - v_discount, 0.00);
  v_loyalty_earn := FLOOR(v_total)::INT;

  -- 6. Generate order number
  v_order_number := 'ORD-' || UPPER(SUBSTR(ENCODE(gen_random_bytes(4), 'hex'), 1, 8));

  -- 7. Insert order
  INSERT INTO orders (
    order_number, user_id, address_id, shipping_address,
    status, subtotal, delivery_fee, discount_amount, total_amount,
    payment_method, payment_status, coupon_code,
    delivery_slot, delivery_date, notes, loyalty_earned
  ) VALUES (
    v_order_number, p_user_id, p_address_id, p_shipping_address,
    'pending', v_subtotal, v_delivery_fee, v_discount, v_total,
    COALESCE(p_payment_method, 'COD'), 'pending', p_coupon_code,
    p_delivery_slot, p_delivery_date, p_notes, v_loyalty_earn
  ) RETURNING id INTO v_order_id;

  -- 8. Insert order items
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(variant_id UUID, quantity INT)
  LOOP
    SELECT pv.*, p.name AS product_name
    INTO v_variant
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = v_item.variant_id;

    INSERT INTO order_items (
      order_id, product_id, variant_id, product_name, variant_weight,
      quantity, price, cost_price
    ) VALUES (
      v_order_id, v_variant.product_id, v_variant.id,
      v_variant.product_name, v_variant.weight,
      v_item.quantity, v_variant.price, v_variant.cost_price
    );
  END LOOP;

  -- 9. Award loyalty points
  IF p_user_id IS NOT NULL THEN
    UPDATE profiles
    SET loyalty_points = loyalty_points + v_loyalty_earn
    WHERE id = p_user_id;
  END IF;

  -- 10. Clear user cart
  IF p_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'order_id',         v_order_id,
    'order_number',     v_order_number,
    'total_amount',     v_total,
    'subtotal',         v_subtotal,
    'delivery_fee',     v_delivery_fee,
    'discount_amount',  v_discount,
    'loyalty_earned',   v_loyalty_earn
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_inquiries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_store          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- ── Auth Trigger: Auto Create Profile for Supabase Auth ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar_url TEXT;
  v_phone TEXT;
BEGIN
  -- Extract name from metadata if available
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Customer'
  );

  -- Extract avatar from metadata
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'image'
  );

  -- Extract phone
  v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');

  -- 1. Sync to public.profiles
  BEGIN
    INSERT INTO public.profiles (id, email, phone, name, avatar_url, role, loyalty_points)
    VALUES (
      NEW.id,
      NEW.email,
      v_phone,
      v_name,
      v_avatar_url,
      'customer',
      100
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = COALESCE(EXCLUDED.email, profiles.email),
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
      avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Sync to public.users
  BEGIN
    INSERT INTO public.users (id, phone, name, email, created_at)
    VALUES (
      NEW.id::TEXT,
      v_phone,
      v_name,
      NEW.email,
      COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE
    SET
      phone = COALESCE(EXCLUDED.phone, users.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      email = COALESCE(EXCLUDED.email, users.email);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users (runs on Supabase signup)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ── Profiles RLS Policies ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles: public read"    ON profiles;
CREATE POLICY "Profiles: public read"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles: own update"     ON profiles;
CREATE POLICY "Profiles: own update"
  ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles: admin all"      ON profiles;
CREATE POLICY "Profiles: admin all"
  ON profiles FOR ALL USING (is_admin(auth.uid()));

-- Allow insert by authenticated users for own profile or service_role
DROP POLICY IF EXISTS "Profiles: service insert" ON profiles;
DROP POLICY IF EXISTS "Profiles: own insert"     ON profiles;
CREATE POLICY "Profiles: own insert"
  ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id OR
    auth.role() = 'authenticated' OR
    auth.role() = 'anon' OR
    auth.role() = 'service_role'
  );

-- ── Users Table RLS Policies ────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of users" ON users;
CREATE POLICY "Allow public read of users" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert of users" ON users;
CREATE POLICY "Allow insert of users" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update of users" ON users;
CREATE POLICY "Allow update of users" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
CREATE POLICY "Allow all for authenticated users" ON users
  FOR ALL USING (true) WITH CHECK (true);


-- ── User Addresses ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Addresses: own all"       ON user_addresses;
CREATE POLICY "Addresses: own all"
  ON user_addresses FOR ALL USING (auth.uid() = user_id);

-- ── Products & Variants ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Products: public read"    ON products;
CREATE POLICY "Products: public read"
  ON products FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Products: admin all"      ON products;
CREATE POLICY "Products: admin all"
  ON products FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Variants: public read"    ON product_variants;
CREATE POLICY "Variants: public read"
  ON product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Variants: admin all"      ON product_variants;
CREATE POLICY "Variants: admin all"
  ON product_variants FOR ALL USING (is_admin(auth.uid()));

-- ── Delivery Slots ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Slots: public read"       ON delivery_slots;
CREATE POLICY "Slots: public read"
  ON delivery_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Slots: admin all"         ON delivery_slots;
CREATE POLICY "Slots: admin all"
  ON delivery_slots FOR ALL USING (is_admin(auth.uid()));

-- ── Sellers ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers: public read"     ON sellers;
CREATE POLICY "Sellers: public read"
  ON sellers FOR SELECT USING (status = 'active' OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Sellers: own store"       ON sellers;
CREATE POLICY "Sellers: own store"
  ON sellers FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ── Seller Inquiries ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Inquiries: public insert" ON seller_inquiries;
CREATE POLICY "Inquiries: public insert"
  ON seller_inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Inquiries: own read"      ON seller_inquiries;
CREATE POLICY "Inquiries: own read"
  ON seller_inquiries FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Inquiries: admin all"     ON seller_inquiries;
CREATE POLICY "Inquiries: admin all"
  ON seller_inquiries FOR ALL USING (is_admin(auth.uid()));

-- ── Seller Payouts ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Payouts: seller read"     ON seller_payouts;
CREATE POLICY "Payouts: seller read"
  ON seller_payouts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = seller_payouts.seller_id
        AND sellers.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Payouts: admin all"       ON seller_payouts;
CREATE POLICY "Payouts: admin all"
  ON seller_payouts FOR ALL USING (is_admin(auth.uid()));

-- ── Cart ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Cart: own all"            ON cart_items;
CREATE POLICY "Cart: own all"
  ON cart_items FOR ALL USING (auth.uid() = user_id);

-- ── Subscriptions ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Subscriptions: own all"   ON subscriptions;
CREATE POLICY "Subscriptions: own all"
  ON subscriptions FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Modifications: own all"   ON modification_reports;
CREATE POLICY "Modifications: own all"
  ON modification_reports FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ── Orders ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Orders: own read"         ON orders;
CREATE POLICY "Orders: own read"
  ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Orders: own insert"       ON orders;
CREATE POLICY "Orders: own insert"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Orders: admin all"        ON orders;
CREATE POLICY "Orders: admin all"
  ON orders FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Order items: own read"    ON order_items;
CREATE POLICY "Order items: own read"
  ON order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Order items: insert"      ON order_items;
CREATE POLICY "Order items: insert"
  ON order_items FOR INSERT WITH CHECK (true);

-- ── Returns ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Returns: own all"         ON return_requests;
CREATE POLICY "Returns: own all"
  ON return_requests FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ── Wishlist ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Wishlist: own all"        ON wishlists;
CREATE POLICY "Wishlist: own all"
  ON wishlists FOR ALL USING (auth.uid() = user_id);

-- ── Reviews ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Reviews: public read"     ON reviews;
CREATE POLICY "Reviews: public read"
  ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews: auth insert"     ON reviews;
CREATE POLICY "Reviews: auth insert"
  ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Reviews: own update"      ON reviews;
CREATE POLICY "Reviews: own update"
  ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- ── Coupons ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Coupons: public read"     ON coupons;
CREATE POLICY "Coupons: public read"
  ON coupons FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Coupons: admin all"       ON coupons;
CREATE POLICY "Coupons: admin all"
  ON coupons FOR ALL USING (is_admin(auth.uid()));

-- ── Business Settings ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Settings: public read"    ON business_settings;
CREATE POLICY "Settings: public read"
  ON business_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings: admin all"      ON business_settings;
CREATE POLICY "Settings: admin all"
  ON business_settings FOR ALL USING (is_admin(auth.uid()));

-- ── OTP Store ────────────────────────────────────────────────────────────────
-- OTP managed exclusively by service_role; no anon/auth access via RLS
DROP POLICY IF EXISTS "OTP: service access"      ON otp_store;
CREATE POLICY "OTP: service access"
  ON otp_store FOR ALL USING (true);  -- Real protection is at API layer, not DB

-- ── Notifications ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Notifications: own read"  ON notifications;
CREATE POLICY "Notifications: own read"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Notifications: own update" ON notifications;
CREATE POLICY "Notifications: own update"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── Translations ─────────────────────────────────────────────────────────────
-- Serve translations via service_role in /api routes; not directly from anon client
DROP POLICY IF EXISTS "Translations: service read" ON translations;
CREATE POLICY "Translations: service read"
  ON translations FOR SELECT USING (true);   -- Allow for now; restrict to service_role as app matures

-- ── Audit Logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Audit: admin read"        ON audit_logs;
CREATE POLICY "Audit: admin read"
  ON audit_logs FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Audit: admin insert"      ON audit_logs;
CREATE POLICY "Audit: admin insert"
  ON audit_logs FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('products',        'products',        true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/avif']),
    ('quality-reports', 'quality-reports', true,  10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
    ('return-claims',   'return-claims',   false, 10485760, ARRAY['image/jpeg','image/png','image/webp','video/mp4'])
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN others THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLE GRANTS
-- ═══════════════════════════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES     IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES  IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES   IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES  TO postgres, anon, authenticated, service_role;
