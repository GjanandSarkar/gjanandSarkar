-- ============================================================
-- DairyDirect — Production Seed Data for AWS RDS PostgreSQL
-- ============================================================

-- 1. Initial Business Settings
INSERT INTO business_settings (
  id,
  business_name,
  support_phone,
  support_email,
  min_profit_margin_percent,
  delivery_fee,
  free_delivery_threshold,
  tax_rate_percent,
  morning_cutoff_time,
  evening_cutoff_time,
  is_ordering_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Gjanand Sarkar Farm Direct Dairy',
  '+919876543210',
  'care@gjanandsarkar.com',
  20.00,
  30.00,
  300.00,
  0.00,
  '21:00',
  '14:00',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. Delivery Slots
INSERT INTO delivery_slots (name, slot_type, start_time, end_time, cutoff_time, max_orders_per_day, sort_order)
VALUES
  ('Early Morning (5:30 AM – 7:30 AM)', 'morning', '05:30:00', '07:30:00', '21:00:00', 200, 1),
  ('Morning (7:30 AM – 9:30 AM)',       'morning', '07:30:00', '09:30:00', '21:00:00', 300, 2),
  ('Evening (5:00 PM – 7:30 PM)',       'evening', '17:00:00', '19:30:00', '14:00:00', 150, 3)
ON CONFLICT DO NOTHING;

-- 3. Super Admin Profile
INSERT INTO profiles (id, phone, email, name, role, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '9999999999',
  'admin@gjanandsarkar.com',
  'Gjanand Admin',
  'admin',
  true
) ON CONFLICT (phone) DO UPDATE SET role = 'admin';

-- 4. Initial Core Products & Variants
-- Product 1: Pure A2 Desi Cow Milk
INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, sort_order, tags)
VALUES (
  'a2000000-0000-0000-0000-000000000001',
  'Pure A2 Desi Gir Cow Milk',
  'milk',
  '100% pure raw unadulterated A2 milk directly from grass-fed Gir cows. Rich in A2 beta-casein proteins.',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
  true,
  true,
  1,
  ARRAY['a2', 'cow_milk', 'organic', 'raw', 'bestseller']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock, low_stock_threshold)
VALUES
  ('a2000000-0000-0000-0000-000000000011', 'a2000000-0000-0000-0000-000000000001', '500ml', 45.00, 32.00, 50.00, 150, 20),
  ('a2000000-0000-0000-0000-000000000012', 'a2000000-0000-0000-0000-000000000001', '1 Litre', 85.00, 60.00, 95.00, 250, 30)
ON CONFLICT (id) DO NOTHING;

-- Product 2: Fresh Farm Buffalo Milk
INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, sort_order, tags)
VALUES (
  'a2000000-0000-0000-0000-000000000002',
  'Creamy Buffalo Milk',
  'milk',
  'Thick, rich, and high fat whole buffalo milk ideal for tea, coffee, homemade paneer, and sweets.',
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=800',
  true,
  true,
  2,
  ARRAY['buffalo_milk', 'high_fat', 'tea_special']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock, low_stock_threshold)
VALUES
  ('a2000000-0000-0000-0000-000000000021', 'a2000000-0000-0000-0000-000000000002', '500ml', 42.00, 30.00, 48.00, 120, 15),
  ('a2000000-0000-0000-0000-000000000022', 'a2000000-0000-0000-0000-000000000002', '1 Litre', 80.00, 56.00, 90.00, 200, 25)
ON CONFLICT (id) DO NOTHING;

-- Product 3: Traditional Bilona Cow Ghee
INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, sort_order, tags)
VALUES (
  'a2000000-0000-0000-0000-000000000003',
  'Traditional Vedic Bilona A2 Ghee',
  'ghee',
  'Handcrafted using the ancient 5-step bilona method from curd made of pure A2 Gir cow milk. Granular texture and authentic aroma.',
  'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=800',
  true,
  true,
  3,
  ARRAY['ghee', 'bilona', 'ayurvedic', 'premium']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock, low_stock_threshold)
VALUES
  ('a2000000-0000-0000-0000-000000000031', 'a2000000-0000-0000-0000-000000000003', '500ml', 950.00, 680.00, 1100.00, 60, 10),
  ('a2000000-0000-0000-0000-000000000032', 'a2000000-0000-0000-0000-000000000003', '1 Litre', 1800.00, 1300.00, 2100.00, 45, 8)
ON CONFLICT (id) DO NOTHING;

-- Product 4: Soft Farm-Fresh Malai Paneer
INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, sort_order, tags)
VALUES (
  'a2000000-0000-0000-0000-000000000004',
  'Fresh Soft Malai Paneer',
  'paneer',
  'Made fresh each morning by naturally curdling whole milk with lemon. Zero chemicals or starch.',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800',
  true,
  true,
  4,
  ARRAY['paneer', 'fresh', 'daily_made']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock, low_stock_threshold)
VALUES
  ('a2000000-0000-0000-0000-000000000041', 'a2000000-0000-0000-0000-000000000004', '200g', 90.00, 65.00, 100.00, 80, 15),
  ('a2000000-0000-0000-0000-000000000042', 'a2000000-0000-0000-0000-000000000004', '500g', 210.00, 150.00, 240.00, 50, 10)
ON CONFLICT (id) DO NOTHING;

-- Product 5: Natural Probiotic Farm Curd (Dahi)
INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, sort_order, tags)
VALUES (
  'a2000000-0000-0000-0000-000000000005',
  'Farm-Fresh Thick Set Curd (Dahi)',
  'curd',
  'Set naturally in clay pots with active live probiotic cultures. Mild, creamy, and non-sour.',
  'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&q=80&w=800',
  true,
  true,
  5,
  ARRAY['curd', 'dahi', 'probiotics']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock, low_stock_threshold)
VALUES
  ('a2000000-0000-0000-0000-000000000051', 'a2000000-0000-0000-0000-000000000005', '400g', 45.00, 30.00, 50.00, 90, 15),
  ('a2000000-0000-0000-0000-000000000052', 'a2000000-0000-0000-0000-000000000005', '1 kg', 100.00, 70.00, 115.00, 60, 10)
ON CONFLICT (id) DO NOTHING;

-- 5. Promotional Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, usage_limit)
VALUES
  ('WELCOME50', 'Get ₹50 off on your first order above ₹250', 'flat', 50.00, 250.00, 50.00, true, 1000),
  ('FRESH10',   '10% instant discount on orders above ₹400',  'percent', 10.00, 400.00, 100.00, true, 500),
  ('FREEDEL',   'Free delivery on orders above ₹199',         'flat', 30.00, 199.00, 30.00, true, 2000)
ON CONFLICT (code) DO NOTHING;

-- 6. Initial Audit Log
INSERT INTO admin_audit_logs (admin_id, action, resource_type, resource_id, details)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'system.initialize',
  'system',
  'global',
  '{"status": "Database initialized with production seed data"}'
);
