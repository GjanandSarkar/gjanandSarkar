"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
      </div>

      {/* Product List */}
      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-rail reveal pb-4 pt-1"
      >
        {products.map((product, idx) => (
          <div 
            key={product.id}
            className="w-[200px] sm:w-[220px] md:w-[240px] shrink-0"
          >
            <ProductCard product={product} priority={idx < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
