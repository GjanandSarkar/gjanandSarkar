"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * One navigation row, one source of truth.
 *
 * Previously this bar held an "All Categories" dropdown AND a "More" dropdown
 * listing the same departments, plus a trust pill on the right. Three ways to
 * do one thing. Now: a single scrollable row of the departments we actually
 * sell — dairy sub-ranges at launch — with the active item underlined.
 *
 * Tabs are text, not pills, and carry no icons: at this density an icon per
 * tab is decoration, and the row has to survive Gujarati/Hindi labels.
 */
const NAV_ITEMS = [
  { label: 'All', href: '/products', category: null },
  { label: 'Milk', href: '/products?category=Milk', category: 'Milk' },
  { label: 'Curd', href: '/products?category=Curd', category: 'Curd' },
  { label: 'Paneer', href: '/products?category=Paneer', category: 'Paneer' },
  { label: 'Ghee', href: '/products?category=Ghee', category: 'Ghee' },
  { label: 'Butter', href: '/products?category=Butter', category: 'Butter' },
  { label: 'Lassi', href: '/products?category=Lassi', category: 'Lassi' },
  { label: 'Buttermilk', href: '/products?category=Buttermilk', category: 'Buttermilk' },
  { label: 'Plans', href: '/subscribe', category: null },
] as const;

function CategoryNavBar() {
  const pathname = usePathname();
  // No useSearchParams: it suspends the row on static pages, so on a cold
  // phone load the categories were missing until the bundle arrived.
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setActiveCategory(new URLSearchParams(window.location.search).get('category'));
  }, [pathname]);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.href === '/subscribe') return pathname.startsWith('/subscribe');
    if (pathname !== '/products') return false;
    if (item.category === null) return !activeCategory;
    return activeCategory?.toLowerCase() === item.category.toLowerCase();
  };

  return (
    <nav aria-label="Departments" className="w-full bg-surface border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <ul className="flex items-stretch gap-5 md:gap-7 h-11 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label} className="shrink-0 flex">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center text-[13px] whitespace-nowrap transition-colors ${
                    active ? 'font-extrabold text-foreground' : 'font-semibold text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary rounded-full" aria-hidden />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export { CategoryNavBar };
