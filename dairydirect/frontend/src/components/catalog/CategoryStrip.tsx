'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { VISIBLE_CATEGORIES } from '@/lib/constants/categories';

/**
 * Category selector as a segmented scrolling strip.
 *
 * Replaces the circular-icon grid. Those icons cost a tall block at the top
 * of the page, and the illustrations carried no information the label did
 * not already give — so it was a screenful of decoration standing between
 * the customer and the products.
 *
 * This is a filter bar, not a menu: it shows which category is active, it
 * is one line tall, and it scrolls horizontally like the tab strips people
 * already know from every app on their phone.
 */
export function CategoryStrip() {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get('category');

  const items = [
    { key: '__all', name: 'All', href: '/products' },
    ...VISIBLE_CATEGORIES.map((c) => ({
      key: c.key,
      name: c.name,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
  ];

  return (
    <nav
      aria-label="Product categories"
      className="scrollbar-none sticky top-0 z-30 flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2.5"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      {items.map((item) => {
        const isActive =
          item.key === '__all'
            ? pathname === '/products' && !active
            : active === item.name;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-muted text-foreground-muted'
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
