"use client";

import React from 'react';
import Link from 'next/link';

import type { CatalogProduct } from '@/lib/types/catalog';
import { ProductCard } from '@/components/shared/ProductCard';


interface DealsAndBrandsProps {
  products: CatalogProduct[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {

  // Only display products that have genuine, verified manufacturer discounts
  const dealProducts = (products || []).filter((p) => {
    const v = p.product_variants?.[0];
    return v && v.original_price && v.original_price > v.price;
  }).slice(0, 4);

  // If there are no active discounts, hide the section entirely
  if (dealProducts.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 pb-6">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
          Offers
        </h2>
        <Link href="/offers" className="text-[12px] font-bold text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {dealProducts.map((prod) => (
          <div key={prod.id} className="w-[148px] sm:w-[168px] md:w-[184px] shrink-0 snap-start">
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}
