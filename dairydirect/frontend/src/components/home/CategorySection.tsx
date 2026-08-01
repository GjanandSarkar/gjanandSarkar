"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CategorySectionProps {
  categories: string[];
  isLoading: boolean;
}

const categoryGradients: Record<string, { bg: string; icon: string; blob: string }> = {
  'Milk':      { bg: '#e8f4fd', icon: '#4a90d9', blob: '#bde3ff' },
  'Paneer':    { bg: '#fff8e6', icon: '#c78c2e', blob: '#ffe8a0' },
  'Ghee':      { bg: '#fef5ec', icon: '#d4712a', blob: '#ffd9b0' },
  'Buttermilk':{ bg: '#eaf6ef', icon: '#3b8a55', blob: '#b8e8c9' },
  'Curd':      { bg: '#fff8e6', icon: '#c78c2e', blob: '#ffe8a0' },
  'Lassi':     { bg: '#e8f4fd', icon: '#4a90d9', blob: '#bde3ff' },
};

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
      <div className="flex overflow-x-auto no-scrollbar gap-4 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-5 pb-4 md:pb-0">
        {categories.map((category, idx) => {
          const style = categoryGradients[category] || categoryGradients['Milk'];
          
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
                  style={{ background: style.blob }}
                />
                <div 
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl"
                  style={{ color: style.icon }}
                >
                  {/* Using first letter as a lightweight icon fallback if no actual images are available */}
                  {category.charAt(0)}
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
