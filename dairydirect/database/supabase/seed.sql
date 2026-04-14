-- ══════════════════════════════════════════════════════════════
-- DairyDirect — Seed Data (Realistic & Profit-Safe)
-- Run AFTER applying schema.sql
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────
-- PRODUCTS + VARIANTS (With 30% Gross Margin)
-- ─────────────────────────────────────────────────

DELETE FROM product_variants;
DELETE FROM products;

DO $$
DECLARE
  p_id uuid;
BEGIN

-- 1. Farm Fresh Cow Milk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Farm Fresh Cow Milk', 'Milk',
  '100% pure, unadulterated cow milk delivered fresh from our farm within hours of milking. Rich in nutrients and perfect for the whole family.',
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '500ml', 34,   36,   23.80, 150),
  (p_id, '1L',    64,   68,   44.80, 200);

-- 2. A2 Gir Cow Milk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'A2 Gir Cow Milk', 'Milk',
  'Premium A2 milk from traditional Gir cows. Naturally rich in A2 beta-casein protein and easier to digest.',
  'https://images.unsplash.com/photo-1563636619-e91081f98980?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '500ml', 50,   55,   35.00, 50),
  (p_id, '1L',    94,   100,  65.80, 80);

-- 3. Organic Buffalo Milk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Organic Buffalo Milk', 'Milk',
  'Thick, creamy buffalo milk with high fat content. Ideal for making home-made curd and desserts.',
  'https://images.unsplash.com/photo-1528750955925-53f5a70669ce?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '500ml', 40,   42,   28.00, 100),
  (p_id, '1L',    78,   82,   54.60, 120);

-- 4. Fresh Malai Paneer
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Fresh Malai Paneer', 'Paneer',
  'Soft, rich, and creamy paneer made daily from full-fat farm milk. No preservatives, just pure goodness.',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '200g', 110,  120,  77.00, 40),
  (p_id, '500g', 260,  280,  182.00, 25);

-- 5. Pure Bilona Ghee
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Pure Bilona Ghee', 'Ghee',
  'Traditional hand-churned Bilona method ghee made from curd. Authentic aroma and grainy texture.',
  'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&q=80&w=800', false, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '500ml', 450,  480,  315.00, 20),
  (p_id, '1L',    850,  900,  595.00, 15);

-- 6. Sweet Punjabi Lassi
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Sweet Punjabi Lassi', 'Lassi',
  'Thick, creamy sweet lassi churned with traditional methods and a hint of cardamom.',
  'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '300ml', 45,   50,   31.50, 60),
  (p_id, '500ml', 70,   75,   49.00, 40);

-- 7. Creamy Thick Curd
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Creamy Thick Curd', 'Curd',
  'Natural probiotic-rich curd set from pure cow milk. No thickeners or artificial flavors.',
  'https://images.unsplash.com/photo-1485911618490-bc426d806f41?auto=format&fit=crop&q=80&w=800', true, true
) RETURNING id INTO p_id;

INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock)
VALUES
  (p_id, '200g', 35,   40,   24.50, 80),
  (p_id, '400g', 65,   70,   45.50, 50);

END $$;
