import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateUserId(): string {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_attempts')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid OTP request' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== otpRecord.otp_hash) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);
        return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 400 });
      }
      await supabaseAdmin
        .from('otp_attempts')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    await supabaseAdmin.from('otp_attempts').delete().eq('id', otpRecord.id);

    let { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (!existingProfile) {
      userId = generateUserId();
      isNewUser = true;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          phone: normalizedPhone,
          role: 'customer',
        });

      if (profileError) {
        console.error('Create profile error:', profileError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    } else {
      userId = existingProfile.id;
    }

    const token = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { error: tokenError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (tokenError) {
      console.error('Session token error:', tokenError);
    }

    return NextResponse.json({
      success: true,
      token: isNewUser ? 'new_user' : token,
      userId,
      profile: existingProfile || { id: userId, phone: normalizedPhone, role: 'customer' },
      isNewUser,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}