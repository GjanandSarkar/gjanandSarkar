-- ============================================================
-- DairyDirect (Gjanand Sarkar) — Migration 004
-- Users Table Synchronization, Trigger & RLS Policies
-- Idempotent & Safe to execute multiple times
-- ============================================================

-- 1. Ensure public.users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  phone TEXT,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for public.users
DROP POLICY IF EXISTS "Allow public read of users" ON public.users;
CREATE POLICY "Allow public read of users" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert of users" ON public.users;
CREATE POLICY "Allow insert of users" ON public.users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update of users" ON public.users;
CREATE POLICY "Allow update of users" ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
CREATE POLICY "Allow all for authenticated users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Unified Auth Trigger Function (Syncs auth.users -> profiles AND users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar_url TEXT;
  v_phone TEXT;
BEGIN
  -- Extract name from user metadata
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Customer'
  );

  -- Extract avatar from metadata
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'image'
  );

  -- Extract phone
  v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');

  -- 1. Sync to public.profiles
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Sync to public.users
  BEGIN
    INSERT INTO public.users (id, phone, name, email, created_at)
    VALUES (
      NEW.id::TEXT,
      v_phone,
      v_name,
      NEW.email,
      COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE
    SET
      phone = COALESCE(EXCLUDED.phone, users.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      email = COALESCE(EXCLUDED.email, users.email);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 6. Backfill existing users into public.users from auth.users (if any exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO public.users (id, phone, name, email, created_at)
    SELECT
      id::TEXT,
      COALESCE(phone, raw_user_meta_data->>'phone'),
      COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1), 'Customer'),
      email,
      created_at
    FROM auth.users
    ON CONFLICT (id) DO UPDATE
    SET
      phone = COALESCE(EXCLUDED.phone, users.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      email = COALESCE(EXCLUDED.email, users.email);
  END IF;
END $$;

-- 7. Backfill from public.profiles into public.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.users (id, phone, name, email, created_at)
    SELECT
      id::TEXT,
      phone,
      name,
      email,
      created_at
    FROM public.profiles
    ON CONFLICT (id) DO UPDATE
    SET
      phone = COALESCE(EXCLUDED.phone, users.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      email = COALESCE(EXCLUDED.email, users.email);
  END IF;
END $$;
