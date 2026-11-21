"use client";

import React, { useRef } from 'react';
import Link from 'next/link';

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
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-5">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
          Fresh today
        </h2>
        <Link href="/products" className="text-[12px] font-bold text-primary hover:underline">
          See all
        </Link>
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
