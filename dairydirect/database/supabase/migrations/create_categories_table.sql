-- ==============================================================================
-- Gjanand Sarkar: Categories Table & Realtime Setup for Supabase
-- Run this SQL in your Supabase Project > SQL Editor
-- ==============================================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) UNIQUE,
    description TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for faster querying and sorting
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories (created_at DESC);

-- 3. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_categories_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies:
-- Allow anyone (public & authenticated) to read categories
DROP POLICY IF EXISTS "Public categories read access" ON public.categories;
CREATE POLICY "Public categories read access"
    ON public.categories
    FOR SELECT
    USING (true);

-- Allow authenticated admins / service role full insert/update/delete access
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
CREATE POLICY "Admin full access on categories"
    ON public.categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Enable Realtime subscription on categories table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;
END $$;
