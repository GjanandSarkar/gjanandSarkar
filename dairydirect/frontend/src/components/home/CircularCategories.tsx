"use client";

import React from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

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
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center"
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-transparent group-hover:border-[#c88a23] group-hover:shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-active:scale-95"
              style={{ backgroundColor: cat.color.bg }}
            >
              <CategoryIcon name={cat.icon} className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-700 group-hover:text-[#0f3e26] transition-colors leading-tight line-clamp-1">
              {cat.name}
            </span>
          </Link>
        ))}
        <Link
          href="/products"
          className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 border-2 border-transparent group-hover:border-[#c88a23] group-hover:shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-active:scale-95">
            <LayoutGrid className="w-6 h-6 text-gray-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-700 group-hover:text-[#0f3e26] transition-colors leading-tight line-clamp-1">
            All
          </span>
        </Link>
      </div>
    </section>
  );
}
