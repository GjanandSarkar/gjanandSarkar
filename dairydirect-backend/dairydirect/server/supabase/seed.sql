-- ============================================================
-- DairyDirect — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- Replaces prisma/seed.js
-- ============================================================

-- ─── Products ────────────────────────────────────────────────

insert into products (id, name, category, description, is_active) values
  ('prod_milk_001',   'Fresh Cow Milk',      'MILK',       'Farm-fresh cow milk delivered daily',     true),
  ('prod_milk_002',   'Buffalo Milk',        'MILK',       'Rich and creamy buffalo milk',            true),
  ('prod_paneer_001', 'Fresh Paneer',        'PANEER',     'Soft and fresh paneer made daily',        true),
  ('prod_ghee_001',   'Pure Cow Ghee',       'GHEE',       'Traditional bilona-method cow ghee',      true),
  ('prod_bm_001',     'Spiced Buttermilk',   'BUTTERMILK', 'Refreshing chaas with cumin & coriander', true);

-- ─── Product Variants ─────────────────────────────────────────

insert into product_variants (id, product_id, label, price, stock, is_active) values
  -- Cow Milk
  ('var_cowmilk_500ml', 'prod_milk_001', '500ml', 30.00, 200, true),
  ('var_cowmilk_1l',    'prod_milk_001', '1L',    58.00, 300, true),
  ('var_cowmilk_2l',    'prod_milk_001', '2L',   110.00, 150, true),
  -- Buffalo Milk
  ('var_bufmilk_500ml', 'prod_milk_002', '500ml', 35.00, 150, true),
  ('var_bufmilk_1l',    'prod_milk_002', '1L',    68.00, 200, true),
  -- Paneer
  ('var_paneer_200g',   'prod_paneer_001', '200g', 80.00, 100, true),
  ('var_paneer_500g',   'prod_paneer_001', '500g', 190.00, 60, true),
  -- Ghee
  ('var_ghee_250ml',    'prod_ghee_001', '250ml', 250.00, 80, true),
  ('var_ghee_500ml',    'prod_ghee_001', '500ml', 480.00, 50, true),
  -- Buttermilk
  ('var_bm_200ml',      'prod_bm_001', '200ml', 20.00, 200, true),
  ('var_bm_500ml',      'prod_bm_001', '500ml', 40.00, 150, true);
