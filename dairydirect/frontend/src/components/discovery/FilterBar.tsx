"use client";

import { Search, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  freshnessFilter: boolean;
  onFreshnessToggle: () => void;
  resultCount: number;
}

export function FilterBar({ 
  searchQuery, 
  onSearchChange, 
  freshnessFilter, 
  onFreshnessToggle,
  resultCount 
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[18px] text-on-surface hidden md:block">
          Products ({resultCount})
        </h2>
        
        <button 
          onClick={onFreshnessToggle}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ml-auto md:ml-0
            ${freshnessFilter 
              ? 'bg-primary text-white shadow-sm' 
              : 'bg-surface-container-low text-outline hover:bg-surface-container'
            }
          `}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          Freshness Guaranteed
        </button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-outline" strokeWidth={2.5} />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3.5 rounded-[14px] text-[15px] font-medium outline-none transition-all bg-surface-container-low text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
          placeholder={t('searchPlaceholder') as string}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
