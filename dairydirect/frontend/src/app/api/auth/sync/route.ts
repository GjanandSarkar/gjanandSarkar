import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30, // 30 requests per minute per IP
});

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    try {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await limiter.check(10, ip); // Limit to 10 auth syncs per minute
    } catch {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Invalid token or auth error fetching user:', authError);
      return NextResponse.json({ error: 'Invalid auth token', details: authError }, { status: 401 });
    }

    const uid = user.id;
    let userPhone = user.phone || null;
    let userEmail = user.email || null;
    let userName = user.user_metadata?.full_name || user.user_metadata?.name || null;
    let userAvatar = user.user_metadata?.avatar_url || null;

    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*, saved_addresses:user_addresses(label, address)')
      .eq('id', uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@gjanandsarkar.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    const isAdmin = !!(userEmail && adminEmails.includes(userEmail.toLowerCase()));

    if (!profile) {
      const insertData: any = {
        id: uid,
        role: isAdmin ? 'admin' : 'customer',
        name: userName,
        email: userEmail,
        avatar_url: userAvatar,
      };
      
      if (userPhone) insertData.phone = userPhone;

      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error details:', insertError);
        return NextResponse.json({ 
          error: 'Database error creating profile', 
          details: insertError.message,
          code: insertError.code,
          hint: 'Ensure phone/email columns exist in profiles table and are nullable.'
        }, { status: 500 });
      }
      profile = newProfile;
    } else {
      if (isAdmin && profile.role === 'customer') {
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', uid)
          .select()
          .single();
        
        if (!updateError) profile = updatedProfile;
      }
    }

    return NextResponse.json({ success: true, user: profile });
  } catch (error: any) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ error: 'Authentication failed', details: error.message }, { status: 401 });
  }
}
