-- ============================================================
-- Migration: Create Categories Table & Link with Products
-- Supports Admin Category Management (Name, Description, Image, Sort Order)
-- ============================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT UNIQUE,
  description TEXT,
  image_url   TEXT,
  icon_name   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast retrieval and sorting
CREATE INDEX IF NOT EXISTS idx_categories_slug       ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_is_active  ON public.categories(is_active);

-- 3. Automatic updated_at timestamp trigger
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. Policies:
-- Anyone (public, anon, authenticated) can read categories
DROP POLICY IF EXISTS "Categories: public read" ON public.categories;
CREATE POLICY "Categories: public read"
  ON public.categories
  FOR SELECT
  USING (true);

-- Admins can perform all operations
DROP POLICY IF EXISTS "Categories: admin all" ON public.categories;
CREATE POLICY "Categories: admin all"
  ON public.categories
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Service role has full access
DROP POLICY IF EXISTS "Categories: service role all" ON public.categories;
CREATE POLICY "Categories: service role all"
  ON public.categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Link with products table:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_by TEXT;
    CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);
  END IF;
END $$;

-- 7. Relax hardcoded check constraint on products(category) so custom admin categories can be saved
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS profit_margin_guard;

-- 8. Seed default dairy categories if the table is empty
INSERT INTO public.categories (name, slug, description, image_url, sort_order, is_active)
VALUES
  ('Milk', 'milk', 'Raw, pure, unpasteurized farm-fresh milk from indigenous Gir cows and Murrah buffaloes.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80', 1, true),
  ('Ghee', 'ghee', 'Traditional Bilona churned A2 Vedic cow ghee and pure buffalo ghee.', 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=800&auto=format&fit=crop&q=80', 2, true),
  ('Paneer', 'paneer', 'Fresh artisan malai cottage cheese crafted daily from rich cow and buffalo milk.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80', 3, true),
  ('Curd & Dahi', 'curd-dahi', 'Thick, creamy probiotic farm dahi set with natural traditional culture.', 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800&auto=format&fit=crop&q=80', 4, true),
  ('Butter & Makhan', 'butter-makhan', 'Unsalted authentic white desi makhan churned from fresh cultured cream.', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80', 5, true),
  ('Buttermilk & Lassi', 'buttermilk-lassi', 'Refreshing spiced chaas and sweet kulhad lassi blended with natural herbs.', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80', 6, true),
  ('Traditional Sweets', 'traditional-sweets', 'Heritage Indian sweets prepared with pure desi ghee and fresh mawa.', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80', 7, true),
  ('Cream & Khoya', 'cream-khoya', 'Fresh malai and slow-simmered artisanal khoya / mawa for culinary delights.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80', 8, true),
  ('Organic Oils & Spices', 'organic-oils-spices', 'Cold-pressed traditional oils and unadulterated high-curcumin spices.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80', 9, true),
  ('Ayurveda & Wellness', 'ayurveda-wellness', 'Vedic herbs, wildcrafted shilajit, and natural health rejuvenators.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', 10, true)
ON CONFLICT (name) DO NOTHING;
