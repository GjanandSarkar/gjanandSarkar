"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

import { findCategory, categoryColors } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { api } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';

export interface DynamicCategoryItem {
  id?: string;
  name: string;
  slug?: string;
  href: string;
  icon: string;
  color?: { bg: string; color: string };
}

export function CircularCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<DynamicCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadActiveCategories() {
      try {
        const res = await api.categories.get();
        if (res?.categories && Array.isArray(res.categories) && isMounted) {
          // Filter to active categories
          const activeOnly = res.categories.filter((c: any) => c.is_active !== false);
          
          if (activeOnly.length > 0) {
            const mapped = activeOnly.map((c: any) => {
              const matched = findCategory(c.name);
              const slug = c.slug || matched?.key || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return {
                id: c.id,
                name: c.name,
                slug,
                href: `/categories/${slug}`,
                icon: c.icon_name || matched?.icon || 'Package',
                color: categoryColors(c.name),
              };
            });
            setCategories(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic categories:', err);
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    loadActiveCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-6">
      <div className="flex items-center justify-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar snap-rail pb-2 pt-1">
        {loading ? (
          // Skeleton loading placeholders
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[84px] animate-pulse">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-muted border border-border" />
              <div className="w-12 h-3 bg-surface-muted rounded" />
            </div>
          ))
        ) : (
          categories.map((cat) => (
            <Link
              key={cat.id || cat.name}
              href={cat.href}
              className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center shrink-0"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-muted border border-border group-hover:border-primary flex items-center justify-center transition-colors duration-150">
                <CategoryIcon name={cat.icon} className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))
        )}

        <Link
          href="/products"
          className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center shrink-0"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-muted border border-border group-hover:border-primary flex items-center justify-center transition-colors duration-150">
            <LayoutGrid className="w-6 h-6 text-foreground-muted group-hover:text-primary transition-colors" />
          </div>
          <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
            {t('all') || 'All'}
          </span>
        </Link>
      </div>
    </section>
  );
}
