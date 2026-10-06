"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/shared/ProductCard';
import type { CatalogProduct } from '@/lib/types/catalog';

interface TrendingProductsProps {
  products: CatalogProduct[];
}

export function TrendingProducts({ products }: TrendingProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-[#c88a23]" />
            <span className="text-xs font-bold text-[#c88a23] uppercase tracking-wider">
              Just Added
            </span>
          </div>
          {/* Was "Trending Products" / "Top Picks". The feed behind it is
              simply the newest products by created_at — there is no
              popularity, view or sales signal involved. Labelling a
              reverse-chronological list as trending or top-picked is a claim
              the data does not support, so it says what it actually is.
              Rename this back once a real ranking signal exists. */}
          <h2 className="text-2xl md:text-3xl font-black text-[#0f3e26] tracking-tight">
            New Arrivals
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-[#c88a23] hover:text-[#0f3e26] flex items-center gap-1 transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
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
