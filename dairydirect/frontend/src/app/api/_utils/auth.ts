import { supabaseAdmin } from '@/lib/db';

export async function getAuthUser(request: Request): Promise<{ userId: string; isAdmin: boolean } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token || token === 'new_user') return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    userId: user.id,
    isAdmin: profile?.role === 'admin',
  };
}
