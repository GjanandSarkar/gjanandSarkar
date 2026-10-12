/**
 * POST /api/auth/send-otp
 * Sends a 6-digit OTP via AWS SNS to the provided phone number.
 * Rate limited: 5 OTPs per phone per 10 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendOTPSMS, generateOTP } from '@/lib/aws/sns';
import { storeOTP } from '@/lib/aws/redis';
import { checkRateLimit } from '@/lib/aws/redis';
import { sanitizePhone } from '@/lib/security/sanitize';
import { getClientIP } from '@/lib/api/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Rate limit by IP
    const ipLimit = await checkRateLimit(ip, 'otp_ip', 10, 600);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests from your network. Please try again later.' },
        { status: 429, headers: { 'Retry-After': ipLimit.resetIn.toString() } }
      );
    }

    const body = await request.json();
    const rawPhone = body.phone;

    if (!rawPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Sanitize and validate phone
    const phone = sanitizePhone(rawPhone);
    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid Indian mobile number' },
        { status: 400 }
      );
    }

    // Rate limit by phone number
    const phoneLimit = await checkRateLimit(phone, 'otp_phone', 5, 600);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests for this number. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis (10 min TTL)
    const stored = await storeOTP(phone, otp);
    if (!stored.success) {
      return NextResponse.json({ error: stored.error }, { status: 429 });
    }

    // In development/demo mode, return OTP directly (NEVER in production)
    if (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true') {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
      return NextResponse.json({
        success: true,
        demoOtp: otp, // Remove this in production!
        message: 'OTP sent successfully',
      });
    }

    // Send OTP via AWS SNS
    const smsResult = await sendOTPSMS(phone, otp);

    if (!smsResult.success) {
      console.error('[SendOTP] SMS failed:', smsResult.error);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please check your phone number and try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('[SendOTP] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
