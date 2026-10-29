"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import {
  Menu,
  ChevronDown,
  ShieldCheck,
  Milk,
  Flame,
  Droplets,
  Hammer,
  Wheat,
  Shirt,
  FlaskConical,
  CookingPot,
  Sparkles,
  Sun,
  Heart,
  Plug,
  BookOpen,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import {
  findCategory,
  categoryHref,
} from '@/lib/constants/categories';
import { api } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';

export function CategoryNavBar() {
  const { t, tCategory } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<{ name: string; href: string; icon: string; description?: string }[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    api.categories.get().then((res) => {
      if (res?.categories && Array.isArray(res.categories) && isMounted) {
        const activeOnly = res.categories.filter((c: any) => c.is_active !== false);
        if (activeOnly.length > 0) {
          setDynamicCategories(
            activeOnly.map((c: any) => {
              const matched = findCategory(c.name);
              const slug = c.slug || matched?.key || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return {
                name: c.name,
                href: `/categories/${slug}`,
                icon: c.icon_name || matched?.icon || 'Package',
                description: c.description || matched?.description || `Authentic ${c.name}`,
              };
            })
          );
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const allCategories = [
    { name: 'All Products', href: '/products', icon: 'LayoutGrid', description: 'Browse the full catalogue' },
    ...dynamicCategories,
  ];

  const reducedCategories = dynamicCategories.slice(0, 6);
  const moreCategories = dynamicCategories.slice(6);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="hidden md:block w-full bg-surface border-b border-border/90 text-foreground relative z-30 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-start gap-4 lg:gap-8 h-11 md:h-12">
        
        {/* All Categories Dropdown */}
        {/* All Categories Dropdown */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-surface-muted cursor-pointer min-h-[44px]"
          >
            <Menu className="w-4 h-4 text-primary" />
            <span className="text-xs md:text-sm font-semibold">{tCategory('All Categories')}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 max-h-[420px] overflow-y-auto bg-surface rounded-xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 text-xs font-semibold text-foreground border-b border-border flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Explore Departments
                </span>
                <span className="text-foreground-muted font-normal text-xs">{dynamicCategories.length} categories</span>
              </div>
              <div className="py-1">
                {allCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-surface-muted hover:text-primary transition-colors"
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <CategoryIcon name={cat.icon} />
                    </span>
                    <span>{tCategory(cat.name)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-border shrink-0 hidden sm:block" />

        {/* Category Nav Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 py-1 min-w-0">
          {reducedCategories.map((item, idx) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-foreground hover:text-primary font-medium text-xs lg:text-sm transition-colors whitespace-nowrap py-1 px-1 group items-center gap-1.5 shrink-0 ${
                idx < 3 ? 'flex' : idx === 3 ? 'hidden lg:flex' : 'hidden xl:flex'
              }`}
            >
              <span>{tCategory(item.name)}</span>
            </Link>
          ))}

          {/* More Dropdown */}
          <div ref={moreRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1 text-foreground hover:text-primary font-medium text-xs lg:text-sm hover:bg-surface-muted py-1 px-2 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              <span>{t('more') || 'More'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-1.5 text-xs font-semibold text-foreground border-b border-border">
                  More Categories
                </div>
                <div className="py-1">
                  {moreCategories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs text-foreground hover:bg-surface-muted hover:text-primary transition-colors group"
                    >
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <CategoryIcon name={cat.icon} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary truncate">{tCategory(cat.name)}</p>
                        {cat.description && (
                          <p className="text-xs text-foreground-muted truncate">{cat.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Trust Highlights */}
        <div className="ml-auto hidden xl:flex items-center gap-4 shrink-0 text-xs font-medium text-foreground-muted">
          <div className="flex items-center gap-1.5 text-primary bg-surface-muted px-3 py-1 rounded-full border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">Verified Indian Manufacturers</span>
          </div>
        </div>

      </div>
    </div>
  );
}
