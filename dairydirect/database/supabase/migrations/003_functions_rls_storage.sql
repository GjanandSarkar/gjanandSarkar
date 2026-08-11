-- ============================================================
-- DairyDirect (Gjanand Sarkar) — Migration 003
-- Functions, Triggers, RLS Policies, Storage Buckets, Role Grants
-- Idempotent: safe to run multiple times.
-- ============================================================

-- ── Helper: is_admin ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'
  );
$$;

-- ── Helper: update_updated_at_column ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to all relevant tables
DROP TRIGGER IF EXISTS trg_profiles_updated_at          ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at    ON user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sellers_updated_at           ON sellers;
CREATE TRIGGER trg_sellers_updated_at
  BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at          ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at  ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at            ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at     ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_otp_store_updated_at         ON otp_store;
CREATE TRIGGER trg_otp_store_updated_at
  BEFORE UPDATE ON otp_store FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Helper: Enforce single default address per user ──────────────────────────
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
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE FUNCTION enforce_single_default_address();

-- ── Atomic Order Placement RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id          UUID,
  p_address_id       UUID,
  p_shipping_address TEXT,
  p_delivery_slot    TEXT,
  p_delivery_date    TIMESTAMPTZ,
  p_notes            TEXT,
  p_payment_method   TEXT,
  p_items            JSONB,   -- [{ "variant_id": "<uuid>", "quantity": <int> }]
  p_coupon_code      TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order_id       UUID;
  v_subtotal       NUMERIC(10,2) := 0.00;
  v_delivery_fee   NUMERIC(10,2) := 25.00;
  v_free_threshold NUMERIC(10,2) := 299.00;
  v_discount       NUMERIC(10,2) := 0.00;
  v_total          NUMERIC(10,2) := 0.00;
  v_loyalty_earn   INTEGER := 0;
  v_item           RECORD;
  v_variant        RECORD;
  v_coupon         RECORD;
  v_order_number   TEXT;
BEGIN
  -- 1. Load business settings
  SELECT
    COALESCE(standard_delivery_fee, 25.00),
    COALESCE(free_delivery_threshold, 299.00)
  INTO v_delivery_fee, v_free_threshold
  FROM business_settings LIMIT 1;

  -- 2. Validate stock & compute subtotal (row-level locks for concurrency safety)
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
      RAISE EXCEPTION 'Insufficient stock for "%" (available: %, requested: %)',
        v_variant.product_name, v_variant.stock, v_item.quantity;
    END IF;

    UPDATE product_variants
    SET stock = stock - v_item.quantity, updated_at = now()
    WHERE id = v_item.variant_id;

    v_subtotal := v_subtotal + (v_variant.price * v_item.quantity);
  END LOOP;

  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Apply free delivery
  IF v_subtotal >= v_free_threshold THEN
    v_delivery_fee := 0.00;
  END IF;

  -- 4. Apply coupon
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
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 5. Compute final total
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
    UPDATE profiles SET loyalty_points = loyalty_points + v_loyalty_earn WHERE id = p_user_id;
  END IF;

  -- 10. Clear cart
  IF p_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success',         true,
    'order_id',        v_order_id,
    'order_number',    v_order_number,
    'total_amount',    v_total,
    'subtotal',        v_subtotal,
    'delivery_fee',    v_delivery_fee,
    'discount_amount', v_discount,
    'loyalty_earned',  v_loyalty_earn
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_inquiries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_store            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- ── Auth Trigger: Auto Create Profile for Supabase Auth ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar_url TEXT;
  v_phone TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Customer'
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'image'
  );

  v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Profiles
DROP POLICY IF EXISTS "Profiles: public read"    ON profiles;
CREATE POLICY "Profiles: public read"    ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles: service insert" ON profiles;
DROP POLICY IF EXISTS "Profiles: own insert"     ON profiles;
CREATE POLICY "Profiles: own insert"     ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role'
);
DROP POLICY IF EXISTS "Profiles: own update"     ON profiles;
CREATE POLICY "Profiles: own update"     ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Profiles: admin all"      ON profiles;
CREATE POLICY "Profiles: admin all"      ON profiles FOR ALL    USING (is_admin(auth.uid()));

-- User Addresses
DROP POLICY IF EXISTS "Addresses: own all"       ON user_addresses;
CREATE POLICY "Addresses: own all"       ON user_addresses FOR ALL USING (auth.uid() = user_id);

-- Products
DROP POLICY IF EXISTS "Products: public read"    ON products;
CREATE POLICY "Products: public read"    ON products FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Products: admin all"      ON products;
CREATE POLICY "Products: admin all"      ON products FOR ALL    USING (is_admin(auth.uid()));

-- Product Variants
DROP POLICY IF EXISTS "Variants: public read"    ON product_variants;
CREATE POLICY "Variants: public read"    ON product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Variants: admin all"      ON product_variants;
CREATE POLICY "Variants: admin all"      ON product_variants FOR ALL    USING (is_admin(auth.uid()));

-- Delivery Slots
DROP POLICY IF EXISTS "Slots: public read"       ON delivery_slots;
CREATE POLICY "Slots: public read"       ON delivery_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Slots: admin all"         ON delivery_slots;
CREATE POLICY "Slots: admin all"         ON delivery_slots FOR ALL    USING (is_admin(auth.uid()));

-- Sellers
DROP POLICY IF EXISTS "Sellers: public read"     ON sellers;
CREATE POLICY "Sellers: public read"     ON sellers FOR SELECT USING (status = 'active' OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Sellers: own store"       ON sellers;
CREATE POLICY "Sellers: own store"       ON sellers FOR ALL    USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Seller Inquiries
DROP POLICY IF EXISTS "Inquiries: public insert" ON seller_inquiries;
CREATE POLICY "Inquiries: public insert" ON seller_inquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Inquiries: own read"      ON seller_inquiries;
CREATE POLICY "Inquiries: own read"      ON seller_inquiries FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Inquiries: admin all"     ON seller_inquiries;
CREATE POLICY "Inquiries: admin all"     ON seller_inquiries FOR ALL    USING (is_admin(auth.uid()));

-- Seller Payouts
DROP POLICY IF EXISTS "Payouts: seller read"     ON seller_payouts;
CREATE POLICY "Payouts: seller read"     ON seller_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM sellers WHERE sellers.id = seller_payouts.seller_id AND sellers.user_id = auth.uid())
  OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Payouts: admin all"       ON seller_payouts;
CREATE POLICY "Payouts: admin all"       ON seller_payouts FOR ALL    USING (is_admin(auth.uid()));

-- Cart
DROP POLICY IF EXISTS "Cart: own all"            ON cart_items;
CREATE POLICY "Cart: own all"            ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
DROP POLICY IF EXISTS "Subscriptions: own all"   ON subscriptions;
CREATE POLICY "Subscriptions: own all"   ON subscriptions FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Modifications: own all"   ON modification_reports;
CREATE POLICY "Modifications: own all"   ON modification_reports FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Orders: own read"         ON orders;
CREATE POLICY "Orders: own read"         ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Orders: own insert"       ON orders;
CREATE POLICY "Orders: own insert"       ON orders FOR INSERT  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);
DROP POLICY IF EXISTS "Orders: admin all"        ON orders;
CREATE POLICY "Orders: admin all"        ON orders FOR ALL     USING (is_admin(auth.uid()));

-- Order Items
DROP POLICY IF EXISTS "Order items: own read"    ON order_items;
CREATE POLICY "Order items: own read"    ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS "Order items: insert"      ON order_items;
CREATE POLICY "Order items: insert"      ON order_items FOR INSERT WITH CHECK (true);

-- Returns
DROP POLICY IF EXISTS "Returns: own all"         ON return_requests;
CREATE POLICY "Returns: own all"         ON return_requests FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Wishlist
DROP POLICY IF EXISTS "Wishlist: own all"        ON wishlists;
CREATE POLICY "Wishlist: own all"        ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Reviews
DROP POLICY IF EXISTS "Reviews: public read"     ON reviews;
CREATE POLICY "Reviews: public read"     ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Reviews: auth insert"     ON reviews;
CREATE POLICY "Reviews: auth insert"     ON reviews FOR INSERT  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Reviews: own update"      ON reviews;
CREATE POLICY "Reviews: own update"      ON reviews FOR UPDATE  USING (auth.uid() = user_id);

-- Coupons
DROP POLICY IF EXISTS "Coupons: public read"     ON coupons;
CREATE POLICY "Coupons: public read"     ON coupons FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Coupons: admin all"       ON coupons;
CREATE POLICY "Coupons: admin all"       ON coupons FOR ALL    USING (is_admin(auth.uid()));

-- Business Settings
DROP POLICY IF EXISTS "Settings: public read"    ON business_settings;
CREATE POLICY "Settings: public read"    ON business_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings: admin all"      ON business_settings;
CREATE POLICY "Settings: admin all"      ON business_settings FOR ALL    USING (is_admin(auth.uid()));

-- OTP Store (protected at API layer; open at DB layer)
DROP POLICY IF EXISTS "OTP: service access"      ON otp_store;
CREATE POLICY "OTP: service access"      ON otp_store FOR ALL USING (true);

-- Notifications
DROP POLICY IF EXISTS "Notifications: own read"  ON notifications;
CREATE POLICY "Notifications: own read"  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Notifications: own update" ON notifications;
CREATE POLICY "Notifications: own update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Translations (served via service_role API; allow SELECT for now)
DROP POLICY IF EXISTS "Translations: service read" ON translations;
CREATE POLICY "Translations: service read" ON translations FOR SELECT USING (true);

-- Audit Logs
DROP POLICY IF EXISTS "Audit: admin read"        ON audit_logs;
CREATE POLICY "Audit: admin read"        ON audit_logs FOR SELECT USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Audit: admin insert"      ON audit_logs;
CREATE POLICY "Audit: admin insert"      ON audit_logs FOR INSERT  WITH CHECK (is_admin(auth.uid()));

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
