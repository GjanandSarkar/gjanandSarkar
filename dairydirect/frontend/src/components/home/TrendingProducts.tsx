"use client";

import React, { useRef } from 'react';
import Link from 'next/link';

import { ProductCard } from '@/components/shared/ProductCard';
import type { CatalogProduct } from '@/lib/types/catalog';

interface TrendingProductsProps {
  products?: CatalogProduct[];
}

export function TrendingProducts({ products }: TrendingProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
<<<<<<< HEAD
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-5">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
          Fresh today
        </h2>
        <Link href="/products" className="text-[12px] font-bold text-primary hover:underline">
          See all
        </Link>
=======
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-border">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Farm Direct
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Fresh Arrivals & Trending Essentials
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              className="w-8 h-8 rounded-full border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors shadow-2xs cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-8 h-8 rounded-full border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors shadow-2xs cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
      >
        {products.map((product, idx) => (
          <div key={product.id} className="w-[148px] sm:w-[168px] md:w-[184px] shrink-0 snap-start">
            <ProductCard product={product} priority={idx < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
