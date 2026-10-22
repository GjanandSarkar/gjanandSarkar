"use client";

import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

/**
 * Category entry grid.
 *
 * Density is the main thing Blinkit gets right and most Indian storefronts get
 * wrong: four tiles per row on a phone, so the whole taxonomy is visible in
 * one glance without scrolling. A customer who can see every category
 * immediately does not need to learn a navigation system.
 *
 * Tiles are links, not buttons, so they work with middle-click, long-press
 * "open in new tab", and are crawlable. The whole tile is the target rather
 * than the label, which matters a lot for thumbs.
 */
export function CategoryGrid() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            Shop by category
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            One verified partner behind each one
          </p>
        </div>
        <Link
          href="/categories"
          className="focus-ring text-xs font-bold text-primary hover:underline shrink-0"
        >
          See all
        </Link>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {CATEGORIES.map((cat, i) => (
          <Link
            key={cat.key}
            href={`/categories/${encodeURIComponent(cat.name)}`}
            className="press focus-ring rise-in group flex flex-col items-center gap-1.5 rounded-xl bg-surface border border-border p-2 sm:p-3 hover:border-primary/40 transition-colors"
            style={{ ['--i' as string]: i }}
          >
            <span className="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-primary-fixed text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <CategoryIcon name={cat.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight text-foreground line-clamp-2">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
