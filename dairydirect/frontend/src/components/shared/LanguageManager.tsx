"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function LanguageManager() {
  const language = useStore(state => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
