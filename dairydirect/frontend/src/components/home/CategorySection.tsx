"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { categoryColors } from '@/lib/constants/categories';
import { CategoryNameIcon } from '@/components/shared/CategoryIcon';

interface CategorySectionProps {
  categories: string[];
  isLoading: boolean;
}

export function CategorySection({ categories, isLoading }: CategorySectionProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pl-5 md:pl-10 pr-5 pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[84px] md:w-[100px] flex flex-col gap-2 shrink-0 animate-pulse">
              <div className="w-full aspect-square rounded-[20px] bg-surface-container-low" />
              <div className="h-3 w-16 mx-auto rounded-full bg-surface-container-low" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="mb-10 px-5 md:px-10">
      <div className="flex overflow-x-auto no-scrollbar snap-rail reveal gap-4 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-5 pb-4 md:pb-0">
        {categories.map((category, idx) => {
          const style = categoryColors(category);
          
          return (
            <Link 
              href={`/categories/${encodeURIComponent(category)}`} 
              key={category || `cat-${idx}`}
              className="group flex flex-col items-center gap-2 shrink-0 w-[80px] md:w-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="relative w-full aspect-square rounded-[22px] overflow-hidden flex items-center justify-center transition-transform active:scale-95 group-hover:-translate-y-1"
                style={{ background: style.bg, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              >
                <div 
                  className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-60 blur-lg transition-transform group-hover:scale-150"
                  style={{ background: style.color, opacity: 0.18 }}
                />
                <div
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ color: style.color }}
                >
                  {/* Real category icon, replacing the first-letter placeholder. */}
                  <CategoryNameIcon category={category} className="w-6 h-6" />
                </div>
              </motion.div>
              <span className="text-[12px] font-bold text-center leading-tight text-on-surface group-hover:text-primary transition-colors">
                {category}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
