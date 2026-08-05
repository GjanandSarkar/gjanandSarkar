-- ============================================================
-- DairyDirect — AWS RDS PostgreSQL Schema (Production)
-- Version: 2.0.0 | AWS ap-south-1 (Mumbai)
-- ============================================================
-- Run this against your RDS PostgreSQL instance:
--   psql -h <RDS_HOST> -U <USER> -d dairydirect -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending','confirmed','out_for_delivery','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active','paused','cancelled','pending_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('pending','approved','rejected','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Auto-update updated_at trigger function ─────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone             TEXT UNIQUE,
  email             TEXT UNIQUE,
  name              TEXT,
  avatar_url        TEXT,
  role              user_role NOT NULL DEFAULT 'customer',
  default_upi_id    TEXT,
  loyalty_points    INTEGER NOT NULL DEFAULT 0,
  referral_code     TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referred_by       UUID REFERENCES profiles(id),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral ON profiles(referral_code);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── user_addresses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'Home',
  address      TEXT NOT NULL,
  apartment    TEXT,
  city         TEXT DEFAULT 'Unknown',
  state        TEXT DEFAULT 'Unknown',
  pincode      TEXT,
  lat          FLOAT,
  lng          FLOAT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON user_addresses(user_id);

DROP TRIGGER IF EXISTS addresses_updated_at ON user_addresses;
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   TEXT NOT NULL,
  category               TEXT NOT NULL,
  description            TEXT,
  image_url              TEXT,
  s3_image_key           TEXT,           -- S3 object key for management
  is_freshness_guarantee BOOLEAN NOT NULL DEFAULT false,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  sort_order             INTEGER DEFAULT 0,
  tags                   TEXT[],         -- ['organic', 'farm-fresh']
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── product_variants ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight              TEXT NOT NULL,         -- e.g. "500ml", "1kg"
  price               DECIMAL(10,2) NOT NULL,
  original_price      DECIMAL(10,2),
  cost_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock               INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  expiry_date         DATE,
  batch_number        TEXT,
  sku                 TEXT UNIQUE,
  is_available        BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT price_above_cost CHECK (price >= cost_price),
  CONSTRAINT stock_non_negative CHECK (stock >= 0),
  CONSTRAINT price_positive CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

DROP TRIGGER IF EXISTS variants_updated_at ON product_variants;
CREATE TRIGGER variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── delivery_slots ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label        TEXT NOT NULL,           -- "Morning 6-8 AM"
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  max_orders   INTEGER DEFAULT 50,      -- Max orders per slot per day
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default slots
INSERT INTO delivery_slots (label, start_time, end_time) VALUES
  ('Early Morning (6:00 - 8:00 AM)', '06:00', '08:00'),
  ('Morning (8:00 - 10:00 AM)', '08:00', '10:00'),
  ('Evening (5:00 - 7:00 PM)', '17:00', '19:00')
ON CONFLICT DO NOTHING;

-- ─── orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT UNIQUE NOT NULL DEFAULT ('ORD-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  address_id        UUID REFERENCES user_addresses(id),
  status            order_status NOT NULL DEFAULT 'pending',
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee      DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(10,2) NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'COD',
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  payment_id        TEXT,              -- Razorpay payment ID
  razorpay_order_id TEXT,             -- Razorpay order ID
  coupon_code       TEXT,
  delivery_slot     TEXT,             -- e.g. "6:00 AM - 8:00 AM"
  notes             TEXT,
  delivery_date     DATE,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  loyalty_earned    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── order_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,          -- Denormalized for historical accuracy
  variant_weight TEXT NOT NULL,        -- Denormalized
  quantity    INTEGER NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,  -- Price at time of order
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT price_positive CHECK (unit_price > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─── payment_transactions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  amount              DECIMAL(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              TEXT NOT NULL DEFAULT 'created',  -- created, paid, failed, refunded
  method              TEXT,                              -- card, upi, netbanking
  upi_id              TEXT,
  error_code          TEXT,
  error_description   TEXT,
  gateway_response    JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_razorpay ON payment_transactions(razorpay_payment_id);

-- ─── cart_items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, variant_id),
  CONSTRAINT quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- ─── subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id),
  variant_id          UUID NOT NULL REFERENCES product_variants(id),
  address_id          UUID REFERENCES user_addresses(id),
  volume              INTEGER NOT NULL DEFAULT 1,
  plan                TEXT NOT NULL DEFAULT 'Daily',
  status              subscription_status NOT NULL DEFAULT 'active',
  delivery_slot       TEXT,
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  next_delivery_date  DATE,
  pause_until         DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_next_delivery ON subscriptions(next_delivery_date);

DROP TRIGGER IF EXISTS subs_updated_at ON subscriptions;
CREATE TRIGGER subs_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── modification_reports ────────────────────────────────────
CREATE TABLE IF NOT EXISTS modification_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  new_volume      INTEGER,
  new_plan        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── return_requests ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  reason          TEXT NOT NULL,
  description     TEXT,
  evidence_url    TEXT,            -- S3 URL for photo proof
  status          return_status NOT NULL DEFAULT 'pending',
  refund_amount   DECIMAL(10,2),
  refund_id       TEXT,            -- Razorpay refund ID
  admin_notes     TEXT,
  processed_by    UUID REFERENCES profiles(id),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON return_requests(status);

-- ─── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_target TEXT NOT NULL DEFAULT 'customer',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  related_id  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifs_role ON notifications(role_target);

-- ─── reviews ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_verified BOOLEAN DEFAULT false,   -- Only from confirmed orders
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ─── business_settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_settings (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_profit_margin_percent  DECIMAL(10,2) NOT NULL DEFAULT 20.0,
  free_delivery_threshold    DECIMAL(10,2) NOT NULL DEFAULT 299.0,
  delivery_cost              DECIMAL(10,2) NOT NULL DEFAULT 25.0,
  max_discount_percent       DECIMAL(10,2) NOT NULL DEFAULT 30.0,
  loyalty_points_per_rupee   DECIMAL(5,2) DEFAULT 1.0,
  loyalty_redemption_value   DECIMAL(5,2) DEFAULT 0.5, -- 1 point = ₹0.50
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO business_settings (id) VALUES (uuid_generate_v4()) ON CONFLICT DO NOTHING;

-- ─── coupons ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT UNIQUE NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  value            DECIMAL(10,2) NOT NULL,
  min_order_value  DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount     DECIMAL(10,2),
  max_uses         INTEGER,
  used_count       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  expiry_date      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── translations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS translations (
  language    TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  PRIMARY KEY (language, key)
);

-- ─── audit_logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES profiles(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  details       JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ─── inventory_alerts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_name    TEXT NOT NULL,
  variant_weight  TEXT NOT NULL,
  current_stock   INTEGER NOT NULL,
  threshold       INTEGER NOT NULL,
  is_resolved     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

-- ─── Performance Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_active_cat ON products(is_active, category);
CREATE INDEX IF NOT EXISTS idx_variants_available ON product_variants(is_available, product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at DESC, status);

-- ─── Low Stock Alert Trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock <= NEW.low_stock_threshold AND NEW.stock > 0 THEN
    INSERT INTO inventory_alerts (variant_id, product_name, variant_weight, current_stock, threshold)
    SELECT NEW.id, p.name, NEW.weight, NEW.stock, NEW.low_stock_threshold
    FROM products p WHERE p.id = NEW.product_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Update availability flag
  NEW.is_available = (NEW.stock > 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS low_stock_check ON product_variants;
CREATE TRIGGER low_stock_check BEFORE UPDATE OF stock ON product_variants
  FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- ─── Coupon Usage Increment Function ─────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code_param TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE code = upper(coupon_code_param);
END;
$$;
