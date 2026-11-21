"use client";

<<<<<<< HEAD
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
=======
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, categoryHref } from '@/lib/constants/categories';

export function CategoryNavBar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!navRef.current) return;
    const distance = dir === 'left' ? -220 : 220;
    navRef.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const navItems = [
    { name: 'All Products', href: '/products' },
    ...CATEGORIES.map((c) => ({
      name: c.name,
      href: categoryHref(c),
    })),
  ];

  return (
    <div className="w-full bg-surface border-b border-border text-foreground relative z-30 shadow-2xs">
      {/* Progressive blur fade on left edge when scrolled */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-r from-surface via-surface/85 to-transparent backdrop-blur-[2px] transition-opacity duration-300 z-10 ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Progressive blur fade on right edge when content overflows */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-surface via-surface/85 to-transparent backdrop-blur-[2px] transition-opacity duration-300 z-10 ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide button Left (works in phone and desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface border border-border shadow-xs flex items-center justify-center text-foreground hover:bg-surface-muted transition-all active:scale-90 cursor-pointer"
          aria-label="Slide categories left"
          title="Slide left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Slide button Right (works in phone and desktop) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface border border-border shadow-xs flex items-center justify-center text-foreground hover:bg-surface-muted transition-all active:scale-90 cursor-pointer"
          aria-label="Slide categories right"
          title="Slide right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <nav
          ref={navRef}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2"
          aria-label="Category Navigation"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-primary text-white font-bold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>
    </nav>
  );
}

export { CategoryNavBar };
