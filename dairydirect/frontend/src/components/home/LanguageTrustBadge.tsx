"use client";

import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Language } from '@/lib/i18n';

export function LanguageTrustBadge() {
  const currentLang = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);

  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-3">
      <div className="bg-surface rounded-xl border border-border p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground leading-tight">
              Browse in 3 Languages • 3 भाषाओं में उपलब्ध • 3 ભાષાઓમાં ઉપલબ્ધ
            </p>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Select your preferred language anytime
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {languages.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground border border-border'
                }`}
                aria-label={`Switch language to ${lang.name}`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                <span>{lang.native}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
