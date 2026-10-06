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
    <section className="mb-12">
      <div className="px-5 md:px-10 mb-4">
        <div className="flex items-end justify-between">
          <div>
            {subtitle && (
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-[11px] font-black uppercase tracking-widest text-secondary">
                  {subtitle}
                </span>
              </div>
            )}
            <h2 className="font-bold text-[22px] md:text-[26px] tracking-tight text-on-surface">
              {title}
            </h2>
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className="flex items-center gap-1 text-[13px] font-bold text-primary hover:opacity-80 transition-opacity"
            >
              See All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-rail reveal pl-5 md:pl-10 pr-5 pb-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[160px] md:w-[180px] h-[240px] shrink-0 rounded-[20px] animate-pulse bg-surface-container-low" />
            ))}
          </>
        ) : (
          <>
            {products.map((product, i) => (
              <div 
                key={product.id} 
                className="w-[160px] md:w-[180px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-500"
                style={{ animationDelay: `${i < 3 ? i * 50 : 0}ms`, animationFillMode: 'both' }}
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
