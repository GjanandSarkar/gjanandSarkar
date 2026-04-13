CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow read for the user's own record (assuming frontend sends token, we don't have JWT linked RLS here unless we setup Custom Claims). 
-- Wait, if not using Supabase Auth, RLS will block frontend from reading it directly unless we allow public read or handle via backend.
-- The prompt states: "Only backend writes to Supabase", so:

CREATE POLICY "Allow public read of users" ON public.users
  FOR SELECT USING (true);
