"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { BRAND, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { findCategory } from '@/lib/constants/categories';
import { PartnerBadge } from '@/components/shared/PartnerBadge';

interface HeroBannerProps {
  products?: CatalogProduct[];
}

export function HeroBanner({ products }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const heroProducts = (products || []).slice(0, 5);
  const total = heroProducts.length;

  const currentProduct = total > 0 ? heroProducts[currentIndex] : null;
  const currentVariant = currentProduct?.product_variants?.[0];
  const categoryMatch = findCategory(currentProduct?.category);

  const handleNext = () => {
    if (total > 0) setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    if (total > 0) setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div className="w-full bg-surface border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* ── Left Hero Copy ── */}
        <div className="flex-1 max-w-xl text-left">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-medium mb-4 border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Direct From Indian Manufacturers</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-foreground leading-[1.18] tracking-tight mb-4">
            One Verified Brand. <br />
            <span className="text-primary">Every Category.</span>
          </h1>

          <p className="text-base text-foreground-muted font-normal leading-relaxed mb-8 max-w-lg">
            {BRAND.promise} We partner with exactly one vetted manufacturer per category across dairy, groceries, spices, wellness, and lifestyle — zero middlemen, guaranteed quality.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary-hover text-on-primary font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4 text-on-primary" />
            </Link>

            <Link
              href="/become-seller"
              className="min-h-[44px] px-6 py-2.5 bg-surface hover:bg-surface-muted text-foreground border border-border font-medium text-sm rounded-lg transition-colors"
            >
              Sell as Partner Brand
            </Link>
          </div>

          {/* Quick value props */}
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-foreground font-medium">100% Indian Manufacturers</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-foreground font-medium">Single Brand Guarantee</span>
            </div>
          </div>
        </div>

        {/* ── Right Spotlight Featured Card ── */}
        {currentProduct ? (
          <div className="flex-1 w-full max-w-md">
            <div className="bg-surface-muted rounded-lg border border-border p-5 shadow-xs relative">
              <div className="flex items-center justify-between gap-2 mb-3">
                <PartnerBadge size="sm" />
                {total > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrev}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface border border-border text-foreground hover:bg-surface-muted transition-colors"
                      aria-label="Previous product"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-foreground-muted tabular-nums px-1">
                      {currentIndex + 1}/{total}
                    </span>
                    <button
                      onClick={handleNext}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface border border-border text-foreground hover:bg-surface-muted transition-colors"
                      aria-label="Next product"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Preview */}
              <Link href={`/products/${currentProduct.id}`} className="block group">
                <div className="relative w-full aspect-[4/3] bg-surface rounded-lg border border-border overflow-hidden mb-4 p-4 flex items-center justify-center">
                  <Image
                    src={currentProduct.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={currentProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-contain p-2 group-hover:scale-102 transition-transform duration-200"
                    priority
                  />
                  {categoryMatch && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface/90 border border-border text-foreground">
                      {categoryMatch.name}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-foreground-muted">
                      {currentProduct.brand || 'Verified Manufacturer'}
                    </p>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                      {currentProduct.name}
                    </h3>
                  </div>
                  {currentVariant && (
                    <div className="text-right shrink-0">
                      <p className="text-base font-semibold text-foreground tabular-nums">
                        ₹{currentVariant.price.toLocaleString('en-IN')}
                      </p>
                      {currentVariant.original_price && currentVariant.original_price > currentVariant.price && (
                        <p className="text-xs text-foreground-muted line-through tabular-nums">
                          ₹{currentVariant.original_price.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full max-w-md bg-surface-muted rounded-lg border border-border p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">Official Brand Spotlight</h3>
            <p className="text-xs text-foreground-muted mt-1 max-w-xs mx-auto">
              Direct-to-consumer partnerships with India's premier verified manufacturers.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
