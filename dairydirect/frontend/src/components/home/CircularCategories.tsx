"use client";

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, ChevronRight } from 'lucide-react';

import { CATEGORIES, categoryColors, categoryHref } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

/**
 * The home category rail. This was a hand-written list led by four dairy
 * sub-products (Milk, Ghee, Paneer, Curd & Lassi) that are not categories,
 * so the links landed on empty filter pages. It now renders the real
 * taxonomy, with tinting from the shared category colours.
 */
const categories = CATEGORIES.map((c) => ({
  name: c.name,
  href: categoryHref(c),
  icon: c.icon,
  color: categoryColors(c.name),
}));

export function CircularCategories() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight">
          Shop by Category
        </h2>
        <Link
          href="/categories"
          className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-0.5"
        >
          <span>See All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-rail pb-2 pt-1">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 group min-w-[76px] sm:min-w-[88px] text-center"
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface-muted hover:bg-surface-elevated border border-border group-hover:border-primary/40 flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-active:scale-95 shadow-2xs"
            >
              <CategoryIcon name={cat.icon} className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
              {cat.name}
            </span>
          </Link>
        ))}
        <Link
          href="/products"
          className="flex flex-col items-center gap-2 group min-w-[76px] sm:min-w-[88px] text-center"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface-muted hover:bg-surface-elevated border border-border group-hover:border-primary/40 flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-active:scale-95 shadow-2xs">
            <LayoutGrid className="w-6 h-6 text-foreground-muted group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
            All
          </span>
        </Link>
      </div>
    </section>
  );
}
