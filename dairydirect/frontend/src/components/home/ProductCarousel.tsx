"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/shared/ProductCard';
import type { CatalogProduct } from '@/lib/types/catalog';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  products: CatalogProduct[];
  isLoading: boolean;
  viewAllLink?: string;
  priority?: boolean;
}

export function ProductCarousel({ 
  title, 
  subtitle,
  icon,
  products, 
  isLoading,
  viewAllLink,
  priority = false
}: ProductCarouselProps) {
  
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="px-4 md:px-8 mb-3">
        <div className="flex items-end justify-between">
          <div>
            {subtitle && (
              <div className="flex items-center gap-1.5 mb-1">
                {icon}
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {subtitle}
                </span>
              </div>
            )}
            <h2 className="font-bold text-lg sm:text-xl md:text-2xl tracking-tight text-foreground">
              {title}
            </h2>
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline transition-colors"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-rail pl-4 md:pl-8 pr-4 pb-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[170px] sm:w-[190px] md:w-[210px] h-[270px] shrink-0 rounded-xl animate-pulse bg-surface-muted border border-border" />
            ))}
          </>
        ) : (
          <>
            {products.map((product, i) => (
              <div 
                key={product.id} 
                className="w-[170px] sm:w-[190px] md:w-[210px] shrink-0"
              >
                <ProductCard product={product} priority={priority && i < 3} />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
