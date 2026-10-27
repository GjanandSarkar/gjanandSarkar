"use client";

import React from 'react';
import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { ProductCard } from '@/components/shared/ProductCard';

import { useTranslation } from '@/lib/i18n';

interface DealsAndBrandsProps {
  products: CatalogProduct[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {
  const { t } = useTranslation();

  // Only display products that have genuine, verified manufacturer discounts
  const dealProducts = (products || []).filter((p) => {
    const v = p.product_variants?.[0];
    return v && v.original_price && v.original_price > v.price;
  }).slice(0, 4);

  // If there are no active discounts, hide the section entirely
  if (dealProducts.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div className="bg-surface rounded-2xl p-4 md:p-5 border border-border/80 shadow-xs">
        {/* Minimal Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
              {t('specialOffers') || 'Special Offers'}
            </h2>
            <div className="flex items-center gap-1 bg-highlight-bg text-highlight text-xs font-semibold px-2.5 py-0.5 rounded-full border border-highlight/20">
              <Tag className="w-3 h-3 text-highlight" />
              <span>{t('directManufacturerDiscounts') || 'Direct Manufacturer Discounts'}</span>
            </div>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>{t('viewAll') || 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Minimal Products Rail - fixed card widths prevent awkward stretching */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-rail pb-1">
          {dealProducts.map((prod) => (
            <div
              key={prod.id}
              className="w-[170px] sm:w-[210px] md:w-[230px] shrink-0"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
