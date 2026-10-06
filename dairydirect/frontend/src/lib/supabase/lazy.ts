/**
 * Lazy browser-side Supabase accessor.
 *
 * `@supabase/supabase-js` + `@supabase/ssr` weigh ~180KB. Modules that did
 * `import { supabase } from '@/lib/supabase'` at the top level forced that
 * cost onto every bundle that transitively referenced them — including the
 * root layout, and therefore every public page.
 *
 * Importing through this helper keeps Supabase in its own chunk that is only
 * fetched the first time a query actually runs.
 */
export type BrowserSupabase = ReturnType<
  typeof import('./client')['getSupabaseBrowserClient']
>;

let clientPromise: Promise<BrowserSupabase> | null = null;

export function getSupabaseLazy(): Promise<BrowserSupabase> {
  if (!clientPromise) {
    clientPromise = import('./client').then((m) => m.getSupabaseBrowserClient());
  }
  return clientPromise;
}
