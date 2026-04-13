import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, otp }: VerifyOtpRequest = await req.json();

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch OTP record for this phone
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_attempts')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'OTP not found. Please request a new one.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);
      return new Response(JSON.stringify({ error: 'OTP expired. Please request a new one.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= 3) {
      await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);
      return new Response(JSON.stringify({ error: 'Too many attempts. Please request a new OTP.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment attempts
    await supabaseAdmin
      .from('otp_attempts')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);

    // Verify OTP hash
    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Incorrect OTP. Please try again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OTP valid — delete it
    await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);

    // Find or create user in auth.users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let userId: string | null = null;
    
    // Look for existing user with this phone
    if (!listError && authUsers) {
      const existingUser = authUsers.users.find(
        (u) => u.phone === `+91${phone}` || u.user_metadata?.phone === phone
      );
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    let userEmail: string;

    if (!userId) {
      // Create new user
      userEmail = `${phone}@dairydirect.app`;
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { phone },
      });

      if (createError || !newUser.user) {
        console.error('Create user error:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = newUser.user.id;

      // Check if this phone should be admin (check profiles table)
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('phone', phone)
        .single();

      const role = existingProfile?.role ?? 'customer';

      // Create profile
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        phone,
        name: role === 'admin' ? 'Admin' : '',
        role,
      });
    } else {
      userEmail = `${phone}@dairydirect.app`;
    }

    // Generate a magic link token to sign them in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('Magic link error:', linkError);
      return new Response(JSON.stringify({ error: 'Failed to generate session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile to return role info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, phone, role')
      .eq('id', userId)
      .single();

    // Return the token from magic link URL so client can verifyOtp
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token') ?? '';
    
    return new Response(
      JSON.stringify({
        success: true,
        token,
        email: userEmail,
        profile,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('verify-otp error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
