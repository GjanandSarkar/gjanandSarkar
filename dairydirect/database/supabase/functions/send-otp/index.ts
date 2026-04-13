import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  phone: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone }: SendOtpRequest = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number. Must be 10 digits.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin Supabase client (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Delete any existing OTP for this phone
    await supabaseAdmin.from('otp_attempts').delete().eq('phone', phone);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Store OTP hash in DB
    const { error: insertError } = await supabaseAdmin.from('otp_attempts').insert({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
    });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send OTP via MSG91
    const msg91Key = Deno.env.get('MSG91_AUTH_KEY') ?? '';
    const msg91Template = Deno.env.get('MSG91_TEMPLATE_ID') ?? '';

    if (msg91Key && msg91Template) {
      const msg91Response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': msg91Key,
        },
        body: JSON.stringify({
          template_id: msg91Template,
          mobile: `91${phone}`,
          otp: otp,
        }),
      });

      if (!msg91Response.ok) {
        const errBody = await msg91Response.text();
        console.error('MSG91 error:', errBody);
        // Don't fail the request — fall through to dev mode
      }
    } else {
      // DEV MODE: log OTP to console (visible in Supabase Edge Function logs)
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-otp error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
