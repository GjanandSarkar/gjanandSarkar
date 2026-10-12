"use client";

import { Leaf, Droplets, Package, FlaskConical, Activity, GlassWater } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CategoryNameIcon } from '@/components/shared/CategoryIcon';

interface CategoryRailProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  isLoading: boolean;
}

export function CategoryRail({ categories, activeCategory, onSelect, isLoading }: CategoryRailProps) {
  const { t } = useTranslation();
  const allCategories = ['All', ...categories];

  if (isLoading) {
    return (
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar md:pr-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-12 md:h-14 w-24 md:w-full shrink-0 rounded-[12px] md:rounded-[16px] animate-pulse bg-surface-container-low" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar md:pr-4 pb-2 md:pb-0">
      {allCategories.map(cat => {
        const isActive = activeCategory === cat;
        
        return (
          <button 
            key={cat}
            onClick={() => onSelect(cat)}
            className={`
              flex md:flex-col items-center md:items-start gap-2 md:gap-3 
              px-4 py-2.5 md:p-4 rounded-[12px] md:rounded-[16px] shrink-0 transition-all duration-200
              ${isActive 
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-100' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface md:scale-95'
              }
            `}
          >
            <div className={`
              flex items-center justify-center w-6 h-6 md:w-10 md:h-10 rounded-full
              ${isActive ? 'bg-white/20' : 'bg-surface-container-highest'}
            `}>
              <CategoryNameIcon category={cat} />
            </div>
            <span className="text-[13px] md:text-[14px] font-bold whitespace-nowrap">
              {t(cat.toLowerCase() as any) || cat}
            </span>
          </button>
        );
      })}
    </div>
  );
}
