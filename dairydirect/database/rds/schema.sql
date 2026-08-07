-- ============================================================
-- DairyDirect (Gjanand Sarkar) — AWS RDS PostgreSQL Schema
-- Version 2.0 (Corrected & Synchronized with Supabase schema)
-- All tables matching the complete application data model
-- Fully Idempotent & Production Ready for AWS RDS PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT        UNIQUE,
  email           TEXT        UNIQUE,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT        NOT NULL DEFAULT 'customer'
                              CHECK (role IN ('customer', 'admin', 'seller')),
  default_upi_id  TEXT,
  loyalty_points  INTEGER     NOT NULL DEFAULT 0,
  referral_code   TEXT        UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by     TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  address TEXT NOT NULL,
  apartment TEXT,
  pincode TEXT,
  city TEXT DEFAULT 'Palanpur',
  state TEXT DEFAULT 'Gujarat',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Delivery Slots
CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders_capacity INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Sellers
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
  plan            TEXT          DEFAULT 'growth' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  commission_rate NUMERIC(5,2)  NOT NULL DEFAULT 5.00,
  status          TEXT          NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'pending', 'suspended', 'pending_kyc')),
  gstin           TEXT,
  pan             TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  fssai_number    TEXT,
  total_sales     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 5. Seller Payouts
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  fee_deducted NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'paid', 'failed')),
  payout_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Seller Inquiries
CREATE TABLE IF NOT EXISTS seller_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'Gujarat',
  category TEXT DEFAULT 'A2 Dairy & Ghee',
  product_range TEXT,
  monthly_volume TEXT,
  gstin TEXT,
  fssai_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Products
CREATE TABLE IF NOT EXISTS products (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT          NOT NULL,
  category                TEXT          NOT NULL
                          CHECK (category IN ('Milk', 'Ghee', 'Paneer', 'Curd', 'Buttermilk', 'Butter', 'Sweets', 'Other')),
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

-- 8. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight              TEXT          NOT NULL,
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

-- 9. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- 10. Subscriptions
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
  end_date           DATE,
  next_delivery_date DATE        NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  pause_until        DATE,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Modification Reports
CREATE TABLE IF NOT EXISTS modification_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action           TEXT        NOT NULL,
  new_volume       INTEGER,
  new_plan         TEXT,
  -- Lowercase only (Pending/Accepted/Rejected variants are legacy — migrate if needed)
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Orders
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

-- 13. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT,
  variant_weight TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Return Requests (100% Freshness Guarantee)
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 15. Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 16. Reviews
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

-- 17. Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'flat')),
  value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_discount NUMERIC(10,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  id                         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  min_order_value            NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  standard_delivery_fee      NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  delivery_cost              NUMERIC(10,2) NOT NULL DEFAULT 25.00,
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
  gst_rate_percent           NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 19. OTP Store
CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_target TEXT NOT NULL DEFAULT 'customer',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Translations
CREATE TABLE IF NOT EXISTS translations (
  language TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (language, key)
);

-- 22. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Performance Indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_active ON delivery_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_state ON sellers(state);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_otp_store_phone_expires ON otp_store(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ─── Triggers ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
