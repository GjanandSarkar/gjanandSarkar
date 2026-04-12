// src/services/auth.service.js — Auth Business Logic
// Uses Supabase Phone OTP for authentication + Supabase DB for user sync

import { supabase, supabaseAuthAdmin, cc } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Convert a 10-digit Indian mobile number to E.164 format (+91XXXXXXXXXX).
 */
const toE164 = (phone) => {
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) return cleaned;
  return `+91${cleaned}`;
};

/**
 * Step 1: Send OTP to phone number via Supabase Auth.
 */
export const requestOtp = async (phone) => {
  const e164Phone = toE164(phone);

  const { error } = await supabaseAuthAdmin.auth.signInWithOtp({ phone: e164Phone });

  if (error) {
    logger.error(`OTP request failed for phone: ${e164Phone} — ${error.message}`);
    throw new ApiError(400, error.message);
  }

  logger.info(`OTP requested for phone: ${e164Phone}`);

  return {
    message: 'OTP sent successfully',
    expiresInMinutes: 5,
  };
};

/**
 * Step 2: Verify OTP via Supabase, sync user into DB, return session token.
 */
export const verifyOtpAndLogin = async (phone, token) => {
  const e164Phone = toE164(phone);

  const { data, error } = await supabaseAuthAdmin.auth.verifyOtp({
    phone: e164Phone,
    token,
    type: 'sms',
  });

  if (error || !data?.user || !data?.session) {
    logger.warn(`OTP verification failed for phone: ${e164Phone} — ${error?.message}`);
    throw new ApiError(401, error?.message || 'Invalid or expired OTP');
  }

  const supabaseUser = data.user;

  // Upsert into our users table — creates on first login, updates supabase_id on subsequent
  const { data: user, error: upsertErr } = await supabase
    .from('users')
    .upsert(
      { phone, supabase_id: supabaseUser.id },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select('id, phone, name, role')
    .single();

  if (upsertErr || !user) {
    logger.error(`User upsert failed for phone: ${phone} — ${upsertErr?.message}`);
    throw new ApiError(500, 'Failed to sync user account');
  }

  const appUser = cc(user);
  logger.info(`User authenticated: ${appUser.id} | role: ${appUser.role}`);

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: appUser,
  };
};

/**
 * Refresh an expired access token using the refresh token.
 */
export const refreshSession = async (refreshToken) => {
  const { data, error } = await supabaseAuthAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session) {
    throw new ApiError(401, 'Session expired. Please login again.');
  }

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
};
