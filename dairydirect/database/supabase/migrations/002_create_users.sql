-- ============================================================
-- DairyDirect (Gjanand Sarkar) — Custom Users Table Migration
-- Idempotent & Safe
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  phone TEXT,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy
DROP POLICY IF EXISTS "Allow public read of users" ON public.users;
CREATE POLICY "Allow public read of users" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert of users" ON public.users;
CREATE POLICY "Allow insert of users" ON public.users
  FOR INSERT WITH CHECK (true);
