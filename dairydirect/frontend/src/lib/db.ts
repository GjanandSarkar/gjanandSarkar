import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim() === '') return 'https://placeholder.supabase.co';
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.includes('.')) {
      url = `https://${url}.supabase.co`;
    } else {
      url = `https://${url}`;
    }
  }
  return url;
}

/**
 * Supabase clients are created LAZILY, on first use.
 *
 * These used to be built at module scope, which meant that merely importing
 * `supabaseAdmin` constructed a client. `next build` evaluates route modules
 * while collecting page data, so the clients were constructed during the
 * build, in an environment that does not necessarily have the runtime
 * secrets. On Vercel that failed the whole production build with
 * "supabaseKey is required" while collecting /api/cart/clear.
 *
 * There was also a `supabaseAnon` export built with a `?? ''` fallback.
 * createClient() rejects an empty key, so a missing NEXT_PUBLIC_SUPABASE_ANON_KEY
 * threw outright rather than degrading. It had no callers anywhere in the
 * codebase, so it has been deleted rather than fixed.
 *
 * Building on first use means a missing variable surfaces as a failed request
 * at runtime, which is debuggable, instead of a failed deploy.
 */
let adminClient: SupabaseClient | null = null;

function createAdminClient(): SupabaseClient {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Deliberately a non-empty placeholder: createClient() throws on an empty
  // key, and a throw at import time breaks the build rather than the request.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';

  if (key === 'placeholder-key') {
    console.warn(
      '[db] No SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY set; ' +
        'Supabase calls from this process will fail.'
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) adminClient = createAdminClient();
  return adminClient;
}

/**
 * Kept as a property-access proxy so the existing `supabaseAdmin.from(...)`
 * call sites continue to work unchanged, while the underlying client is still
 * only constructed on first real use.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});