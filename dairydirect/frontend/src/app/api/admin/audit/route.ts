import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const admin = getAdminSupabase();
    
    // Using Supabase client for fetching audit logs securely (since we use admin key, RLS bypassed anyway, which is fine for Admin panel)
    const { data, error } = await admin
      .from('audit_logs')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return NextResponse.json({ logs: data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
