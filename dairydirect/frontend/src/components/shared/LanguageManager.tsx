"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { fetchTranslations } from '@/lib/api/translations';

export function LanguageManager() {
  const language = useStore(state => state.language);
  const translationsCache = useStore(state => state.translationsCache);
  const setTranslationsCache = useStore(state => state.setTranslationsCache);

  useEffect(() => {
    document.documentElement.lang = language;
    
    // Load translations for current language if not cached
    if (Object.keys(translationsCache[language] ?? {}).length === 0) {
      fetchTranslations(language).then(map => {
        if (Object.keys(map).length > 0) {
          setTranslationsCache(language, map);
        }
      });
    }
  }, [language, translationsCache, setTranslationsCache]);

  return null;
}
