import { getPool } from '../config/database';
import { config } from '../config/env';

const SCHEMA_SQL = `
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT        UNIQUE,
  email           TEXT        UNIQUE,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'seller')),
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

-- 3. Delivery Slots
CREATE TABLE IF NOT EXISTS delivery_slots (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name            TEXT    NOT NULL,
  start_time           TIME    NOT NULL,
  end_time             TIME    NOT NULL,
  max_orders_capacity  INTEGER NOT NULL DEFAULT 100,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
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
  status          TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'pending_kyc')),
  gstin           TEXT,
  pan             TEXT,
  bank_account    TEXT,
  ifsc_code       TEXT,
  total_sales     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  fssai_number    TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 5. Seller Inquiries
CREATE TABLE IF NOT EXISTS seller_inquiries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  full_name     TEXT        NOT NULL,
  business_name TEXT        NOT NULL,
  phone         TEXT        NOT NULL,
  email         TEXT,
  city          TEXT        NOT NULL,
  state         TEXT        NOT NULL DEFAULT 'Gujarat',
  category      TEXT        NOT NULL DEFAULT 'A2 Dairy & Ghee',
  plan          TEXT        DEFAULT 'growth',
  notes         TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Products
CREATE TABLE IF NOT EXISTS products (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id              UUID          REFERENCES sellers(id) ON DELETE SET NULL,
  name                   TEXT          NOT NULL,
  category               TEXT          NOT NULL,
  description            TEXT,
  image_url              TEXT,
  is_active              BOOLEAN       NOT NULL DEFAULT true,
  is_freshness_guarantee BOOLEAN       NOT NULL DEFAULT true,
  state_origin           TEXT          NOT NULL DEFAULT 'Gujarat',
  brand                  TEXT          NOT NULL DEFAULT 'Gjanand Farm',
  rating                 NUMERIC(3,2)  NOT NULL DEFAULT 5.00,
  reviews_count          INTEGER       NOT NULL DEFAULT 0,
  is_deal_of_the_day     BOOLEAN       NOT NULL DEFAULT false,
  discount_pct           INTEGER       NOT NULL DEFAULT 0,
  tags                   TEXT[]        DEFAULT '{}',
  sort_order             INTEGER       NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 7. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight              TEXT          NOT NULL,
  price               NUMERIC(10,2) NOT NULL,
  original_price      NUMERIC(10,2),
  cost_price          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock               INTEGER       NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER       NOT NULL DEFAULT 10,
  batch_number        TEXT,
  expiry_date         DATE,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 8. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, variant_id)
);

-- 9. Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT          NOT NULL UNIQUE,
  type            TEXT          NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value           NUMERIC(10,2) NOT NULL CHECK (value > 0),
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_discount    NUMERIC(10,2),
  max_uses        INTEGER       DEFAULT 1000,
  used_count      INTEGER       NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  expiry_date     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 10. Orders
CREATE TABLE IF NOT EXISTS orders (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number       TEXT          NOT NULL UNIQUE,
  user_id            UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  address_id         UUID          REFERENCES user_addresses(id) ON DELETE SET NULL,
  shipping_address   TEXT          NOT NULL,
  delivery_slot      TEXT,
  delivery_date      DATE,
  notes              TEXT,
  status             TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal           NUMERIC(10,2) NOT NULL,
  delivery_fee       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  coupon_code        TEXT,
  total_amount       NUMERIC(10,2) NOT NULL,
  payment_method     TEXT          NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'online', 'UPI', 'subscription')),
  payment_status     TEXT          NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  loyalty_earned     INTEGER       NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 11. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID          REFERENCES products(id) ON DELETE SET NULL,
  variant_id      UUID          REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name    TEXT          NOT NULL,
  variant_weight  TEXT          NOT NULL,
  quantity        INTEGER       NOT NULL CHECK (quantity > 0),
  price           NUMERIC(10,2) NOT NULL,
  cost_price      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 12. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address_id         UUID          REFERENCES user_addresses(id) ON DELETE SET NULL,
  product_id         UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id         UUID          NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  volume             INTEGER       NOT NULL DEFAULT 1 CHECK (volume > 0),
  plan               TEXT          NOT NULL CHECK (plan IN ('daily', 'alternate', 'weekly', 'custom')),
  custom_days        TEXT[],
  delivery_slot      TEXT          NOT NULL DEFAULT 'Early Morning (5:00 AM - 7:00 AM)',
  status             TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  start_date         DATE          NOT NULL,
  paused_until       DATE,
  next_delivery_date DATE,
  cancelled_at       TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 13. Return Requests (100% Freshness Guarantee)
CREATE TABLE IF NOT EXISTS return_requests (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id        UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason         TEXT          NOT NULL,
  description    TEXT,
  images         TEXT[]        DEFAULT '{}',
  status         TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  refund_amount  NUMERIC(10,2),
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

-- 14. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  user_name         TEXT        NOT NULL,
  rating            INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT,
  comment           TEXT,
  state_origin      TEXT        DEFAULT 'Gujarat',
  is_verified_buyer BOOLEAN     NOT NULL DEFAULT false,
  helpful_count     INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- 16. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  role_target TEXT        DEFAULT 'customer' CHECK (role_target IN ('customer', 'seller', 'admin')),
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'system',
  related_id  TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  min_order_value           NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  standard_delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  delivery_cost             NUMERIC(10,2) NOT NULL DEFAULT 25.00,
  free_delivery_threshold   NUMERIC(10,2) NOT NULL DEFAULT 299.00,
  min_profit_margin_percent NUMERIC(5,2)  NOT NULL DEFAULT 20.00,
  max_discount_percent      NUMERIC(5,2)  NOT NULL DEFAULT 30.00,
  freshness_guarantee_hours INTEGER       NOT NULL DEFAULT 24,
  is_store_open             BOOLEAN       NOT NULL DEFAULT true,
  store_closure_reason      TEXT,
  support_phone             TEXT          NOT NULL DEFAULT '+91 98765 43210',
  support_email             TEXT          NOT NULL DEFAULT 'care@gjanandsarkar.com',
  razorpay_enabled          BOOLEAN       NOT NULL DEFAULT true,
  cod_enabled               BOOLEAN       NOT NULL DEFAULT true,
  gst_rate_percent          NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 18. OTP Store
CREATE TABLE IF NOT EXISTS otp_store (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Translations
CREATE TABLE IF NOT EXISTS translations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  language    TEXT        NOT NULL,
  key         TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (language, key)
);
`;

const SEED_SQL = `
-- Insert Default Business Settings
INSERT INTO business_settings (
  id, min_order_value, standard_delivery_fee, delivery_cost, free_delivery_threshold,
  min_profit_margin_percent, max_discount_percent, freshness_guarantee_hours, is_store_open,
  support_phone, support_email, razorpay_enabled, cod_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001', 50.00, 25.00, 25.00, 299.00,
  20.00, 30.00, 24, true, '+91 98765 43210', 'care@gjanandsarkar.com', true, true
) ON CONFLICT (id) DO NOTHING;

-- Insert Delivery Slots
INSERT INTO delivery_slots (slot_name, start_time, end_time, max_orders_capacity, is_active)
VALUES
  ('Early Morning (5:00 AM - 7:00 AM)', '05:00:00', '07:00:00', 150, true),
  ('Morning (7:00 AM - 9:00 AM)', '07:00:00', '09:00:00', 150, true),
  ('Evening (5:00 PM - 7:00 PM)', '17:00:00', '19:00:00', 100, true)
ON CONFLICT DO NOTHING;

-- Insert Coupons
INSERT INTO coupons (code, type, value, min_order_value, max_discount, max_uses, is_active)
VALUES
  ('FRESH10', 'percentage', 10, 100, 50, 1000, true),
  ('WELCOME50', 'fixed', 50, 200, 50, 500, true),
  ('A2PURE', 'percentage', 15, 250, 75, 1000, true)
ON CONFLICT (code) DO NOTHING;
`;

export async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing Database Schema and Core Seed Data...');
  try {
    const pool = getPool();
    await pool.query(SCHEMA_SQL);
    console.log('✅ Core database schema tables created/verified successfully');

    await pool.query(SEED_SQL);
    console.log('✅ Default settings, delivery slots, and promotional coupons seeded');

    // Check products table
    const prodCheck = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial dairy products catalog...');
      const prodRes = await pool.query(`
        INSERT INTO products (name, category, description, image_url, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct)
        VALUES
          ('A2 Gir Cow Milk', 'Milk', '100% Pure, unadulterated fresh raw milk from indigenous Gir cows in Gujarat.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150', 'Gujarat', 'Gjanand Farm', 4.9, 128, true, 10),
          ('Pure A2 Desi Cow Ghee', 'Ghee', 'Traditional Bilona method cultured ghee made from curd of A2 Gir cow milk.', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d', 'Gujarat', 'Gjanand Farm', 5.0, 94, false, 0),
          ('Farm Fresh Soft Paneer', 'Paneer', 'Handcrafted daily from fresh milk. Zero preservatives, ultra-soft and high in protein.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7', 'Gujarat', 'Gjanand Farm', 4.8, 62, false, 0),
          ('A2 Gir Cow Curd (Dahi)', 'Curd', 'Naturally set probiotic curd with thick cream layer and authentic traditional taste.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777', 'Gujarat', 'Gjanand Farm', 4.9, 45, false, 0)
        RETURNING id, name;
      `);

      for (const prod of prodRes.rows) {
        if (prod.name === 'A2 Gir Cow Milk') {
          await pool.query(`
            INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
            VALUES
              ($1, '500 ml', 45.00, 50.00, 32.00, 80, 15),
              ($1, '1 Litre', 85.00, 95.00, 62.00, 150, 20),
              ($1, '2 Litres', 165.00, 185.00, 120.00, 50, 10);
          `, [prod.id]);
        } else if (prod.name === 'Pure A2 Desi Cow Ghee') {
          await pool.query(`
            INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
            VALUES
              ($1, '500 ml', 950.00, 1050.00, 700.00, 40, 10),
              ($1, '1 Litre', 1850.00, 2000.00, 1350.00, 60, 10);
          `, [prod.id]);
        } else if (prod.name === 'Farm Fresh Soft Paneer') {
          await pool.query(`
            INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
            VALUES
              ($1, '200g', 90.00, 100.00, 65.00, 50, 10),
              ($1, '500g', 210.00, 230.00, 155.00, 40, 10);
          `, [prod.id]);
        } else if (prod.name === 'A2 Gir Cow Curd (Dahi)') {
          await pool.query(`
            INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
            VALUES
              ($1, '400g', 50.00, 55.00, 35.00, 60, 15),
              ($1, '1 kg', 115.00, 125.00, 80.00, 40, 10);
          `, [prod.id]);
        }
      }
      console.log('✅ Catalog products and variants seeded successfully');
    }

    console.log('🎉 Database initialization complete!');
  } catch (err: any) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  }
}

// Allow direct CLI execution: tsx src/scripts/initDb.ts
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
