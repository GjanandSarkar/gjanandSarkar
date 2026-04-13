import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { token, email, phone } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify token with Supabase Admin SDK
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Invalid token or auth error fetching user:', authError);
      return NextResponse.json({ error: 'Invalid auth token', details: authError }, { status: 401 });
    }

    const uid = user.id;
    let userPhone = user.phone || phone || null;
    let userEmail = user.email || email || null;

    // Check if profile exists
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Hardcoded admins (can be moved to ENV or DB table)
    const ADMIN_EMAILS = ['admin@dairydirect.com', 'nathh@example.com'];
    const ADMIN_PHONES = ['+919999999999', '+911234567890'];

    const isAdmin = (userEmail && ADMIN_EMAILS.includes(userEmail)) || 
                    (userPhone && ADMIN_PHONES.includes(userPhone));

    if (!profile) {
      // Create new profile
      const insertData: any = {
        id: uid,
        role: isAdmin ? 'admin' : 'customer'
      };
      
      if (userPhone) insertData.phone = userPhone;
      if (userEmail) insertData.email = userEmail;

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
      // Update existing profile - only update role if they became an admin
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
