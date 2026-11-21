/**
 * Origin / CSRF gate for state-changing API routes.
 *
 * The app authenticates with cookies (`gs_access_token`), so a cross-site form
 * or fetch could otherwise ride the session (CSRF). Two browser-supplied
 * headers make this cheap to stop at the edge:
 *
 *   - `Origin` is present on every cross-origin POST/PUT/PATCH/DELETE and is
 *     not settable by page JavaScript.
 *   - `Sec-Fetch-Site` is `cross-site` for a cross-origin request.
 *
 * Requests with **no** `Origin` are allowed: server-to-server callers (Razorpay
 * webhooks, cron, the future mobile app) do not send one, and none of them can
 * carry a victim's browser cookies.
 *
 * This runs in Edge middleware, before any route handler or body parse.
 */

/** Methods that never change server state. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function normaliseHost(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, '');
}

function configuredOrigins(): string[] {
  return [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .filter((v): v is string => Boolean(v))
    .map((v) => {
      try {
        return normaliseHost(new URL(v).host);
      } catch {
        return normaliseHost(v);
      }
    });
}

export interface OriginCheckInput {
  method: string;
  origin: string | null;
  host: string | null;
  secFetchSite: string | null;
  /** Forwarded host, when the app sits behind a proxy/CDN. */
  forwardedHost?: string | null;
}

/**
 * Returns `true` when the request may proceed.
 *
 * Deliberately permissive about *absent* headers and strict about
 * contradictory ones: a forged request always carries a mismatching Origin,
 * while non-browser clients carry none.
 */
export function isSameOriginRequest(input: OriginCheckInput): boolean {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return true;

  if (input.secFetchSite === 'cross-site') return false;

  if (!input.origin || input.origin === 'null') return !input.origin; // "null" origin = sandboxed iframe → reject

  let originHost: string;
  try {
    originHost = normaliseHost(new URL(input.origin).host);
  } catch {
    return false;
  }

  const candidates = [input.host, input.forwardedHost, ...configuredOrigins()]
    .filter((v): v is string => Boolean(v))
    .map((v) => normaliseHost(v.split(',')[0]));

  return candidates.includes(originHost);
}

/** JSON 403 used by the middleware. */
export function forbiddenResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Cross-origin request rejected', code: 'CSRF_ORIGIN_MISMATCH' }),
    { status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
}
