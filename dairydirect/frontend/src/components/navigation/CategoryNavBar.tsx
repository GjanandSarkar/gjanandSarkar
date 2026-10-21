"use client";

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
      </div>
    </div>
  );
}
