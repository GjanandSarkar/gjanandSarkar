// src/utils/otp.util.js — OTP Generation & Verification
// Demo mode: accepts hardcoded OTP '123456' for any phone
// Production mode: generate real 6-digit OTP + send via MSG91

import { randomInt } from 'crypto';

const DEMO_OTP = '123456';
const DEMO_MODE = process.env.DEMO_OTP_MODE === 'true';

/**
 * Generate a 6-digit OTP
 * In demo mode returns fixed OTP for predictable testing
 */
export const generateOtp = () => {
  if (DEMO_MODE) return DEMO_OTP;
  return String(randomInt(100000, 999999));
};

/**
 * Calculate OTP expiry timestamp
 */
export const getOtpExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Send OTP via SMS (production)
 * Demo mode: log to console
 */
export const sendOtp = async (phone, otp) => {
  if (DEMO_MODE) {
    console.log(`\n📱 [DEMO OTP] Phone: ${phone} | OTP: ${otp}\n`);
    return { success: true, mode: 'demo' };
  }

  // Production: integrate MSG91 or Twilio here
  // const response = await fetch('https://api.msg91.com/api/v5/otp', { ... });
  throw new Error('Production SMS not configured. Set DEMO_OTP_MODE=true for demo.');
};

/**
 * Verify OTP against stored value
 * In demo mode accepts '123456' regardless of stored OTP
 */
export const verifyOtp = (inputOtp, storedOtp, expiresAt) => {
  // Demo shortcut
  if (DEMO_MODE && inputOtp === DEMO_OTP) return { valid: true };

  // Check expiry
  if (new Date() > new Date(expiresAt)) {
    return { valid: false, reason: 'OTP has expired' };
  }

  // Compare
  if (inputOtp !== storedOtp) {
    return { valid: false, reason: 'Invalid OTP' };
  }

  return { valid: true };
};
