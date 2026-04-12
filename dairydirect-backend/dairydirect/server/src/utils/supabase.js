// src/utils/supabase.js — Supabase Client Singleton
// Uses SERVICE ROLE key for server-side operations (bypasses RLS).
//
// FIX: Uses lazy initialization so createClient() is only called on first
// use — AFTER dotenv has loaded env vars. Exports both service-role and
// anon clients so auth.service.js and auth.middleware.js can import from
// here instead of calling createClient() themselves at module-parse time.

import { createClient } from '@supabase/supabase-js';
import { ApiError } from './ApiError.js';

// ─── Service-role client (bypasses RLS) ──────────────────────────────────────
let _supabase = null;
const getSupabase = () => {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return _supabase;
};

export const supabase = new Proxy({}, { get: (_, prop) => getSupabase()[prop] });

// ─── Anon client (for JWT validation in auth middleware) ──────────────────────
let _supabaseAnon = null;
const getSupabaseAnon = () => {
  if (!_supabaseAnon) {
    _supabaseAnon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return _supabaseAnon;
};

export const supabaseAnon = new Proxy({}, { get: (_, prop) => getSupabaseAnon()[prop] });

// ─── Auth client (service-role, for OTP / signIn operations) ─────────────────
let _supabaseAuthAdmin = null;
const getSupabaseAuthAdmin = () => {
  if (!_supabaseAuthAdmin) {
    _supabaseAuthAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabaseAuthAdmin;
};

export const supabaseAuthAdmin = new Proxy({}, { get: (_, prop) => getSupabaseAuthAdmin()[prop] });

// ─── Error helper ─────────────────────────────────────────────────────────────
export const dbError = (error, fallbackMsg = 'Database error') => {
  if (error) throw new ApiError(500, fallbackMsg + ': ' + error.message);
};

// ─── camelCase transformer ────────────────────────────────────────────────────
const toCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export const cc = (data) => {
  if (Array.isArray(data)) return data.map(cc);
  if (data && typeof data === 'object' && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [toCamel(k), cc(v)])
    );
  }
  return data;
};
