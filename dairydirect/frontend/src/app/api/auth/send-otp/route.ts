import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: deleteError } = await supabaseAdmin
      .from('otp_attempts')
      .delete()
      .eq('phone', normalizedPhone);

    if (deleteError) {
      console.error('Delete old otp error:', deleteError);
    }

    const { error: insertError } = await supabaseAdmin
      .from('otp_attempts')
      .insert({
        phone: normalizedPhone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
      });

    if (insertError) {
      console.error('Insert otp error:', insertError);
      return NextResponse.json({ error: 'Failed to create OTP' }, { status: 500 });
    }

    console.log(`[OTP] Demo mode - OTP for ${normalizedPhone}: ${otp}`);
    console.log(`[OTP] In production, SMS would be sent here`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent (demo mode: check server logs)',
      demoOtp: otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}