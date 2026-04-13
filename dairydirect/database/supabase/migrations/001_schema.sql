-- ══════════════════════════════════════════════════════════════
-- DairyDirect — Full Supabase Schema + RLS
-- Migration: 001_schema.sql
-- ══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────
-- TABLE: profiles
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      text,
  phone     text UNIQUE NOT NULL,
  role      text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON profiles(role);

-- ─────────────────────────────────────────────────
-- TABLE: products
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  category              text CHECK (category IN ('Milk','Paneer','Ghee','Buttermilk','Curd','Lassi')),
  description           text,
  image_url             text,
  is_freshness_guarantee boolean DEFAULT false,
  is_active             boolean DEFAULT true,
  created_at            timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- ─────────────────────────────────────────────────
-- TABLE: product_variants
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight         text NOT NULL,
  price          numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  stock          integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- ─────────────────────────────────────────────────
-- TABLE: orders
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               text PRIMARY KEY,                        -- e.g. 'ORD-1234'
  user_id          uuid REFERENCES profiles(id),
  customer_name    text,
  customer_phone   text,
  total            numeric(10,2) NOT NULL,
  status           text NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled')),
  delivery_date    timestamptz,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ─────────────────────────────────────────────────
-- TABLE: order_items
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     uuid REFERENCES products(id),
  variant_id     uuid REFERENCES product_variants(id),
  product_name   text,
  variant_weight text,
  quantity       integer NOT NULL,
  price          numeric(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ─────────────────────────────────────────────────
-- TABLE: subscriptions
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 text PRIMARY KEY,                      -- e.g. 'SUB-982'
  user_id            uuid NOT NULL REFERENCES profiles(id),
  product_id         uuid NOT NULL REFERENCES products(id),
  volume             numeric(4,1) NOT NULL,
  plan               text NOT NULL CHECK (plan IN ('weekly','monthly')),
  status             text NOT NULL DEFAULT 'Active'
                       CHECK (status IN ('Active','Paused','Pending Review','Cancelled')),
  start_date         date DEFAULT CURRENT_DATE,
  next_delivery_date date,
  created_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions(status);

-- ─────────────────────────────────────────────────
-- TABLE: modification_reports
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modification_reports (
  id              text PRIMARY KEY,                         -- e.g. 'REP-1234'
  subscription_id text NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  new_volume      numeric(4,1),
  new_plan        text,
  status          text NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending','Accepted','Rejected')),
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mod_reports_sub_id ON modification_reports(subscription_id);
CREATE INDEX IF NOT EXISTS idx_mod_reports_user_id ON modification_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_reports_status  ON modification_reports(status);

-- ─────────────────────────────────────────────────
-- TABLE: notifications
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,   -- NULL = broadcast
  role_target text DEFAULT 'customer' CHECK (role_target IN ('customer','admin','all')),
  title       text NOT NULL,
  body        text NOT NULL,
  type        text CHECK (type IN ('order','subscription','system','delivery')),
  is_read     boolean DEFAULT false,
  related_id  text,                                              -- order id or sub id
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role_target ON notifications(role_target);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ─────────────────────────────────────────────────
-- TABLE: cart_items
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- ─────────────────────────────────────────────────
-- TABLE: translations
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS translations (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('en','hi','gu')),
  key      text NOT NULL,
  value    text NOT NULL,
  UNIQUE(language, key)
);
CREATE INDEX IF NOT EXISTS idx_translations_lang_key ON translations(language, key);

-- ─────────────────────────────────────────────────
-- TABLE: otp_attempts (custom OTP flow)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      text NOT NULL,
  otp_hash   text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts   integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_attempts(phone);

-- ─────────────────────────────────────────────────
-- TABLE: sessions (custom auth)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ─────────────────────────────────────────────────
-- TABLE: user_addresses
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       text NOT NULL,
  address    text NOT NULL,
  latitude   numeric(10,8),
  longitude  numeric(11,8),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);


-- ══════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_attempts      ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════════
-- HELPER: is_admin()
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: profiles
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: products
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (is_admin());

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: product_variants
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "variants_select_public"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "variants_insert_admin"
  ON product_variants FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "variants_update_admin"
  ON product_variants FOR UPDATE
  USING (is_admin());

CREATE POLICY "variants_delete_admin"
  ON product_variants FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: orders
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "orders_select_own_or_admin"
  ON orders FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "orders_insert_authenticated"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: order_items
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "order_items_insert_authenticated"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: subscriptions
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "subs_select_own_or_admin"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "subs_insert_authenticated"
  ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "subs_update_admin"
  ON subscriptions FOR UPDATE
  USING (is_admin());

-- Allow customers to pause/cancel (update status on own rows)
CREATE POLICY "subs_update_own_status"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: modification_reports
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "mod_reports_select_own_or_admin"
  ON modification_reports FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "mod_reports_insert_authenticated"
  ON modification_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "mod_reports_update_admin"
  ON modification_reports FOR UPDATE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: notifications
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND role_target IN (
        'all',
        (SELECT role FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "notifications_update_own_read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin_or_service"
  ON notifications FOR INSERT
  WITH CHECK (is_admin() OR auth.uid() IS NULL);

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: cart_items
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "cart_all_own"
  ON cart_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: translations
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "translations_select_public"
  ON translations FOR SELECT
  USING (true);

CREATE POLICY "translations_write_admin"
  ON translations FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "translations_update_admin"
  ON translations FOR UPDATE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════
-- RLS POLICIES: otp_attempts (service role only)
-- ════════════════════════════════════════════════════════════════
-- All access via Edge Functions that use service_role key
-- No anon/authenticated access needed

-- ════════════════════════════════════════════════════════════════
-- pg_cron: Daily subscription delivery update (4 AM IST = 22:30 UTC)
-- ════════════════════════════════════════════════════════════════
-- Uncomment after enabling pg_cron extension in Supabase dashboard:
--
-- SELECT cron.schedule(
--   'update-next-delivery-dates',
--   '30 22 * * *',           -- 4:00 AM IST
--   $$
--     UPDATE subscriptions
--       SET next_delivery_date = CURRENT_DATE + 1
--     WHERE status = 'Active';
--   $$
-- );
