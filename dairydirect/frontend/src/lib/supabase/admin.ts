import { createClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';

// Server-side Admin client bypassing RLS with service role key
let adminClient: ReturnType<typeof createClient> | null = null;

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

export function getAdminSupabase(): any {
  if (typeof window !== 'undefined') {
    return getSupabaseBrowserClient();
  }

  if (!adminClient) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = sanitizeSupabaseUrl(rawUrl);

    if (url === 'https://placeholder.supabase.co') {
      console.warn('Supabase env vars missing. Generating temporary client.');
      return createClient(url, 'placeholder-key', { auth: { persistSession: false } });
    }

    adminClient = createClient(url, serviceRoleKey || 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

export const supabaseAdmin: any = new Proxy({} as any, {
  get(_target, prop) {
    const client = getAdminSupabase();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});
