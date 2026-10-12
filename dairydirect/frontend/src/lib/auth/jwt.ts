/**
 * Custom JWT Authentication (Edge & Node.js Compatible)
 * Uses Web Crypto API for zero-dependency, edge-compatible HS256 signing and verification.
 * 
 * Env vars required:
 *   JWT_SECRET (min 32 chars)
 *   JWT_REFRESH_SECRET (min 32 chars)
 */

const JWT_SECRET = process.env.JWT_SECRET || 'gjanandsarkar-super-secret-production-jwt-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'gjanandsarkar-super-secret-refresh-key-2026';

export type JWTPayload = {
  userId: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  role: 'customer' | 'admin' | 'seller';
  type?: 'access' | 'refresh';
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
};

// ─── Base64Url Helpers ────────────────────────────────────────

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// ─── Token Generation ─────────────────────────────────────────

export async function signJwt(
  payload: Record<string, any>,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iss: 'gjanandsarkar.com',
    aud: 'gjanandsarkar-app',
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );

  const signatureB64 = bufferToBase64Url(signatureBuffer);
  return `${data}.${signatureB64}`;
}

export async function verifyJwt<T = any>(
  token: string,
  secret: string
): Promise<T | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const key = await getCryptoKey(secret);

    // Convert signature from base64url to Uint8Array
    const sigStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = sigStr + '='.repeat((4 - (sigStr.length % 4)) % 4);
    const binary = atob(padded);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      sigBytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as T & { exp?: number; iss?: string };

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

// ─── High-Level Helpers ───────────────────────────────────────

/**
 * Issue a short-lived access token (15 min)
 */
export async function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): Promise<string> {
  return signJwt({ ...payload, type: 'access' }, JWT_SECRET, 15 * 60);
}

/**
 * Issue a long-lived refresh token (30 days)
 */
export async function signRefreshToken(userId: string): Promise<string> {
  return signJwt({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, 30 * 24 * 60 * 60);
}

/**
 * Verify an access token. Returns the decoded payload or null.
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  return verifyJwt<JWTPayload>(token, JWT_SECRET);
}

/**
 * Verify a refresh token. Returns userId or null.
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  const payload = await verifyJwt<{ userId: string; type: string }>(token, JWT_REFRESH_SECRET);
  if (!payload || payload.type !== 'refresh') return null;
  return payload.userId;
}

// ─── Cookie Helpers ───────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = 'gs_access_token';
export const REFRESH_TOKEN_COOKIE = 'gs_refresh_token';

/**
 * Get access token from request (Authorization header or cookie)
 */
export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies[ACCESS_TOKEN_COOKIE]) return cookies[ACCESS_TOKEN_COOKIE];

    for (const key of Object.keys(cookies)) {
      if (key.includes('-auth-token')) {
        try {
          const raw = JSON.parse(decodeURIComponent(cookies[key]));
          if (Array.isArray(raw) && raw[0]) return raw[0];
          if (raw?.access_token) return raw.access_token;
        } catch {}
      }
    }
  }

  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader
    .split(';')
    .reduce((acc: Record<string, string>, cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name) acc[name.trim()] = rest.join('=').trim();
      return acc;
    }, {});
}

export function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  };
}

export function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
