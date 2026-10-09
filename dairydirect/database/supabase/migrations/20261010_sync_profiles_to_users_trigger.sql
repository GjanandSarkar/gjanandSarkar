-- ============================================================
-- Sync profiles table to public.users table automatically
-- ============================================================

-- Ensure update policy exists on public.users
DROP POLICY IF EXISTS "Allow update of users" ON public.users;
CREATE POLICY "Allow update of users" ON public.users
  FOR UPDATE USING (true) WITH CHECK (true);

-- Function to replicate changes from profiles into users
CREATE OR REPLACE FUNCTION public.sync_profile_to_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, name, email, created_at)
  VALUES (
    NEW.id::text,
    NEW.phone,
    NEW.name,
    NEW.email,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET phone = COALESCE(EXCLUDED.phone, users.phone),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
      email = COALESCE(EXCLUDED.email, users.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles table
DROP TRIGGER IF EXISTS trg_sync_profiles_to_users ON public.profiles;

CREATE TRIGGER trg_sync_profiles_to_users
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_users();
