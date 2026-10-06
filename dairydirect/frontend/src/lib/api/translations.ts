import { getSupabaseLazy } from '@/lib/supabase/lazy';

export type Language = 'en' | 'hi' | 'gu';
export type TranslationMap = Record<string, string>;

// ─── Fetch Translations from DB ───────────────────────────────
export async function fetchTranslations(
  language: Language
): Promise<TranslationMap> {
  try {
    const supabase = await getSupabaseLazy();
    const { data, error } = await supabase
      .from('translations')
      .select('key, value')
      .eq('language', language);

    if (error || !data) {
      if (error && error.code !== 'PGRST205') {
        console.warn(`fetchTranslations(${language}) notice:`, error.message);
      }
      return {};
    }

    return Object.fromEntries(data.map((row: any) => [row.key, row.value]));
  } catch {
    return {};
  }
}

// ─── Admin: Upsert a translation key ─────────────────────────
export async function upsertTranslation(
  language: Language,
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseLazy();
  const { error } = await supabase.from('translations').upsert(
    { language, key, value },
    { onConflict: 'language,key' }
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Admin: Get All Translations (for editor) ─────────────────
export async function getAllTranslations(): Promise<
  { id: string; language: Language; key: string; value: string }[]
> {
  const supabase = await getSupabaseLazy();
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .order('key')
    .order('language');

  if (error) {
    console.error('getAllTranslations error:', error);
    return [];
  }

  return data ?? [];
}
