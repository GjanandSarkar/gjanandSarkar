'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';

import { VISIBLE_CATEGORIES } from '@/lib/constants/categories';

/**
 * Category rail that sits directly above the product grid.
 *
 * This replaces the old hero banner as the first thing on the page. A hero
 * costs a full screen on a phone and sells nothing; a category rail is
 * navigation, so the customer either taps it or scrolls two centimetres and
 * hits real products.
 *
 * VISIBLE_CATEGORIES, not CATEGORIES: launch-gated categories stay hidden
 * until the flag flips, so we never advertise a category with nothing in it.
 */
export function CategoryQuickNav() {
  return (
    <nav aria-label="Shop by category" className="w-full">
      <div className="rail gap-2.5 px-4 md:px-8 py-3">
        {VISIBLE_CATEGORIES.map((category) => {
          /* Icon names are data, so resolve dynamically and fall back rather
             than crashing the whole homepage on one bad name. */
          const Icon =
            (Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>) ?? Icons.Package;

          return (
            <Link
              key={category.key}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="lift group flex min-w-[76px] flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed transition-colors group-hover:bg-primary-fixed-dim">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
