import { supabase } from '@/lib/supabase';

export type Language = 'en' | 'hi' | 'gu';
export type TranslationMap = Record<string, string>;

// ─── Fetch Translations from DB ───────────────────────────────
export async function fetchTranslations(
  language: Language
): Promise<TranslationMap> {
  const { data, error } = await supabase
    .from('translations')
    .select('key, value')
    .eq('language', language);

  if (error || !data) {
    console.error(`fetchTranslations(${language}) error:`, error);
    return {};
  }

  return Object.fromEntries(data.map((row: any) => [row.key, row.value]));
}

// ─── Admin: Upsert a translation key ─────────────────────────
export async function upsertTranslation(
  language: Language,
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
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
