import { createBrowserClient } from '@supabase/ssr';

// Browser singleton client for client components
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

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

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    const url = sanitizeSupabaseUrl(rawUrl);

    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();

