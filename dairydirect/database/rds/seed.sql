-- ============================================================
-- DairyDirect (Gjanand Sarkar) — AWS RDS PostgreSQL Master Seed Data
-- Run in PostgreSQL / AWS RDS
-- Fully Idempotent: safe to run multiple times without duplicates.
-- ============================================================

-- ─── 1. Business Settings ─────────────────────────────────────
INSERT INTO business_settings (
  id,
  min_order_value,
  standard_delivery_fee,
  delivery_cost,
  free_delivery_threshold,
  min_profit_margin_percent,
  max_discount_percent,
  freshness_guarantee_hours,
  is_store_open,
  support_phone,
  support_email
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  50.00,
  25.00,
  25.00,
  299.00,
  20.00,
  30.00,
  24,
  true,
  '+91 98765 43210',
  'care@gjanandsarkar.com'
) ON CONFLICT (id) DO UPDATE SET
  min_order_value = EXCLUDED.min_order_value,
  standard_delivery_fee = EXCLUDED.standard_delivery_fee,
  delivery_cost = EXCLUDED.delivery_cost,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  min_profit_margin_percent = EXCLUDED.min_profit_margin_percent,
  max_discount_percent = EXCLUDED.max_discount_percent,
  support_phone = EXCLUDED.support_phone,
  support_email = EXCLUDED.support_email;

-- ─── 2. Delivery Slots ────────────────────────────────────────
INSERT INTO delivery_slots (slot_name, start_time, end_time, max_orders_capacity, is_active)
VALUES
  ('Early Morning (5:00 AM - 7:00 AM)', '05:00:00', '07:00:00', 150, true),
  ('Morning (7:00 AM - 9:00 AM)', '07:00:00', '09:00:00', 200, true),
  ('Evening (5:00 PM - 8:00 PM)', '17:00:00', '20:00:00', 100, true)
ON CONFLICT DO NOTHING;

-- ─── 3. Sellers (Gaushalas & Farms) ───────────────────────────
INSERT INTO sellers (
  id,
  store_name,
  slug,
  state,
  category,
  description,
  commission_rate,
  status
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Gjanand Vedic Dairy Farms',
    'gjanand-farms',
    'Gujarat',
    'A2 Organic Dairy',
    'Pioneering organic and Vedic dairy practices from Banaskantha & Ahmedabad, Gujarat. Farm-fresh within hours.',
    5.00,
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Gir Amrit Organics',
    'gir-amrit',
    'Gujarat',
    'Vedic Bilona Ghee',
    'Authentic Gir cow Bilona Ghee crafted in clay pots using traditional Vedic methods in Junagadh.',
    5.00,
    'active'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Surat Fresh Gaushala',
    'surat-gaushala',
    'Gujarat',
    'Fresh Dairy & Paneer',
    'Pure, ethically sourced buffalo and cow milk, artisanal paneer and fresh buttermilk delivered daily.',
    5.00,
    'active'
  )
ON CONFLICT (slug) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  description = EXCLUDED.description,
  commission_rate = EXCLUDED.commission_rate,
  status = EXCLUDED.status;

-- ─── 4. Coupons ───────────────────────────────────────────────
INSERT INTO coupons (code, type, value, min_order_value, max_discount, max_uses, is_active)
VALUES
  ('FIRSTORDER', 'percentage', 20.00, 150.00, 100.00, 1000, true),
  ('FRESHMILK', 'flat', 50.00, 300.00, 50.00, 500, true),
  ('DAILYDAIRY', 'percentage', 10.00, 200.00, 50.00, 2000, true),
  ('WELCOME50', 'flat', 50.00, 250.00, 50.00, 500, true)
ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  min_order_value = EXCLUDED.min_order_value,
  max_discount = EXCLUDED.max_discount,
  is_active = EXCLUDED.is_active;

-- ─── 5. Products & Variants ───────────────────────────────────

-- Product 1: A2 Desi Gir Cow Milk
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0001-0000-0000-0000-000000000001',
  'A2 Desi Gir Cow Milk',
  'Milk',
  'Pure, unadulterated farm-fresh A2 milk from grass-fed indigenous Gir cows. Tested for zero antibiotics, preservatives, and adulteration.',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
  true, true, '11111111-1111-1111-1111-111111111111', 'Gujarat', 'Gjanand Farm', 4.90, 145, true, 12,
  ARRAY['Made in India', 'A2 Milk', 'Grass Fed', 'Freshness Guaranteed']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', '500ml', 42.00, 48.00, 32.00, 120, 15),
  ('bbbb0001-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000001', '1 Litre', 80.00, 90.00, 60.00, 250, 20)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 2: Fresh Pure Buffalo Milk
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0002-0000-0000-0000-000000000002',
  'Fresh Pure Buffalo Milk',
  'Milk',
  'Rich, thick and creamy whole buffalo milk with naturally high fat content (7.5%+), ideal for rich tea, kheer, and traditional sweets.',
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=800',
  true, true, '11111111-1111-1111-1111-111111111111', 'Gujarat', 'Gjanand Farm', 4.80, 98, false, 10,
  ARRAY['Pure Buffalo', 'High Fat', 'Creamy', 'Fresh']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0002-0000-0000-0000-000000000001', 'aaaa0002-0000-0000-0000-000000000002', '500ml', 40.00, 45.00, 30.00, 100, 10),
  ('bbbb0002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002', '1 Litre', 76.00, 85.00, 58.00, 200, 20)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 3: Traditional Bilona Cow Ghee
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0003-0000-0000-0000-000000000003',
  'Traditional Bilona Cow Ghee',
  'Ghee',
  'Golden, aromatic Vedic Bilona Ghee made by churning whole curd using wooden churners in earthen pots. Rich in fat-soluble vitamins and gut-friendly nutrients.',
  'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=800',
  true, true, '22222222-2222-2222-2222-222222222222', 'Gujarat', 'Gir Amrit', 5.00, 312, true, 15,
  ARRAY['Vedic Bilona', 'Gir Cow', 'Hand Churned', 'Pure Ghee']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0003-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000003', '500ml', 650.00, 750.00, 480.00, 60, 5),
  ('bbbb0003-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000003', '1 Litre', 1250.00, 1400.00, 920.00, 40, 5)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 4: Fresh Malai Paneer
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0004-0000-0000-0000-000000000004',
  'Fresh Malai Paneer',
  'Paneer',
  'Super soft, melt-in-mouth cottage cheese crafted from 100% pure fresh cow and buffalo milk curdled naturally with lemon juice.',
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800',
  true, true, '33333333-3333-3333-3333-333333333333', 'Gujarat', 'Gjanand Farm', 4.90, 215, false, 14,
  ARRAY['Malai Paneer', 'High Protein', 'Freshly Made']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0004-0000-0000-0000-000000000001', 'aaaa0004-0000-0000-0000-000000000004', '200g', 90.00, 105.00, 65.00, 80, 10),
  ('bbbb0004-0000-0000-0000-000000000002', 'aaaa0004-0000-0000-0000-000000000004', '500g', 215.00, 245.00, 155.00, 45, 10)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 5: Probiotic Farm Curd (Dahi)
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0005-0000-0000-0000-000000000005',
  'Probiotic Farm Curd (Dahi)',
  'Curd',
  'Set curd prepared from pure boiled cow milk using traditional live cultures. Naturally thick, creamy, and gentle on digestion.',
  'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&q=80&w=800',
  true, true, '11111111-1111-1111-1111-111111111111', 'Gujarat', 'Gjanand Farm', 4.80, 84, false, 11,
  ARRAY['Probiotic', 'Set Curd', 'Live Cultures', 'Digestive Health']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0005-0000-0000-0000-000000000001', 'aaaa0005-0000-0000-0000-000000000005', '400g', 40.00, 45.00, 28.00, 90, 10),
  ('bbbb0005-0000-0000-0000-000000000002', 'aaaa0005-0000-0000-0000-000000000005', '1kg', 95.00, 110.00, 68.00, 50, 10)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 6: Masala Chhas (Spiced Buttermilk)
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0006-0000-0000-0000-000000000006',
  'Masala Chhas (Spiced Buttermilk)',
  'Buttermilk',
  'Refreshing traditional Gujarati spiced buttermilk seasoned with roasted jeera (cumin), black salt, fresh mint, and ginger.',
  'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800',
  true, true, '11111111-1111-1111-1111-111111111111', 'Gujarat', 'Gjanand Farm', 4.90, 167, false, 20,
  ARRAY['Masala Chhas', 'Refreshing', 'Gujarati Special', 'Cooling']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0006-0000-0000-0000-000000000001', 'aaaa0006-0000-0000-0000-000000000006', '500ml', 20.00, 25.00, 12.00, 150, 20),
  ('bbbb0006-0000-0000-0000-000000000002', 'aaaa0006-0000-0000-0000-000000000006', '1 Litre', 38.00, 45.00, 24.00, 80, 10)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 7: Traditional White Makhan (Butter)
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0007-0000-0000-0000-000000000007',
  'Traditional White Makhan (Butter)',
  'Butter',
  'Unsalted, pure white butter churned freshly from cultured cream. Reminiscent of Lord Krishna''s favourite village makhan.',
  'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=800',
  true, true, '22222222-2222-2222-2222-222222222222', 'Gujarat', 'Gir Amrit', 4.90, 78, false, 14,
  ARRAY['White Makhan', 'Unsalted Butter', 'Village Churned']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0007-0000-0000-0000-000000000001', 'aaaa0007-0000-0000-0000-000000000007', '200g', 120.00, 140.00, 85.00, 40, 5),
  ('bbbb0007-0000-0000-0000-000000000002', 'aaaa0007-0000-0000-0000-000000000007', '500g', 280.00, 320.00, 200.00, 25, 5)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- Product 8: Authentic Kesar Peda
INSERT INTO products (
  id, name, category, description, image_url,
  is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags
) VALUES (
  'aaaa0008-0000-0000-0000-000000000008',
  'Authentic Kesar Peda',
  'Sweets',
  'Traditional Gujarati sweet made from slow-reduced pure Gir cow mawa, infused with Kashmiri saffron strands and fragrant green cardamom.',
  'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=800',
  true, true, '11111111-1111-1111-1111-111111111111', 'Gujarat', 'Gjanand Farm', 4.95, 112, false, 14,
  ARRAY['Kesar Peda', 'Mawa Mithai', 'Saffron Infused', 'Festive Special']
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold)
VALUES
  ('bbbb0008-0000-0000-0000-000000000001', 'aaaa0008-0000-0000-0000-000000000008', '250g', 180.00, 210.00, 125.00, 35, 5),
  ('bbbb0008-0000-0000-0000-000000000002', 'aaaa0008-0000-0000-0000-000000000008', '500g', 350.00, 400.00, 240.00, 20, 5)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock;

-- ─── 6. Translations ──────────────────────────────────────────
INSERT INTO translations (language, key, value) VALUES
  ('en', 'hero_title', 'Farm-Fresh A2 Dairy Delivered Daily by 7:00 AM'),
  ('en', 'hero_subtitle', '100% Pure, Unadulterated Indigenous Cow Milk & Vedic Bilona Ghee'),
  ('en', 'category_milk', 'Fresh Milk'),
  ('en', 'category_ghee', 'Vedic Ghee'),
  ('en', 'category_paneer', 'Malai Paneer'),
  ('en', 'category_curd', 'Farm Curd'),
  ('en', 'category_buttermilk', 'Masala Chhas'),
  ('en', 'category_butter', 'White Makhan'),
  ('en', 'category_sweets', 'Traditional Sweets'),
  ('en', 'btn_subscribe', 'Subscribe Daily'),
  ('en', 'btn_order_now', 'Order Now'),

  ('gu', 'hero_title', 'ખેતરનું તાજું A2 દૂધ રોજ સવારે 7:00 વાગ્યા સુધીમાં પહોંચાડવામાં આવશે'),
  ('gu', 'hero_subtitle', '100% શુદ્ધ ગીર ગાયનું દૂધ અને વૈદિક બિલોણા ઘી'),
  ('gu', 'category_milk', 'તાજું દૂધ'),
  ('gu', 'category_ghee', 'બિલોણા ઘી'),
  ('gu', 'category_paneer', 'મલાઈ પનીર'),
  ('gu', 'category_curd', 'દેશી દહીં'),
  ('gu', 'category_buttermilk', 'મસાલા છાશ'),
  ('gu', 'category_butter', 'સફેદ માખણ'),
  ('gu', 'category_sweets', 'પરંપરાગત મીઠાઈ'),
  ('gu', 'btn_subscribe', 'રોજનું સબ્સ્ક્રાઇબ કરો'),
  ('gu', 'btn_order_now', 'ઓર્ડર કરો'),

  ('hi', 'hero_title', 'खेत का ताजा A2 दूध हर सुबह 7:00 बजे तक आपके घर'),
  ('hi', 'hero_subtitle', '100% शुद्ध देसी गिर गाय का दूध एवं वैदिक बिलोना घी'),
  ('hi', 'category_milk', 'ताजा दूध'),
  ('hi', 'category_ghee', 'वैदिक घी'),
  ('hi', 'category_paneer', 'मलाई पनीर'),
  ('hi', 'category_curd', 'देसी दही'),
  ('hi', 'category_buttermilk', 'मसाला छाछ'),
  ('hi', 'category_butter', 'सफेद माखन'),
  ('hi', 'category_sweets', 'पारंपरिक मिठाइयां'),
  ('hi', 'btn_subscribe', 'दैनिक सदस्यता लें'),
  ('hi', 'btn_order_now', 'अभी आर्डर करें')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;
