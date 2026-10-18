"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Star,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { useStore } from '@/store/useStore';
import { addToCart } from '@/lib/api/cart';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

import { ProductCard } from '@/components/shared/ProductCard';

interface DealsAndBrandsProps {
  products?: CatalogProduct[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const msUntilEndOfDayIST = () => {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIst = new Date(Date.now() + IST_OFFSET_MS);
      const endOfDayIst = Date.UTC(
        nowIst.getUTCFullYear(),
        nowIst.getUTCMonth(),
        nowIst.getUTCDate() + 1,
        0, 0, 0, 0,
      );
      return endOfDayIst - nowIst.getTime();
    };

    const tick = () => {
      const remaining = Math.max(0, msUntilEndOfDayIST());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  // Products with genuine discounts or featured offers
  const dealProducts = products.filter(p => {
    const v = p.product_variants?.[0];
    return v && v.original_price && v.original_price > v.price;
  });

  const displayProducts = dealProducts.length > 0 ? dealProducts.slice(0, 4) : products.slice(0, 4);
  if (displayProducts.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div className="bg-surface rounded-xl p-4 sm:p-6 border border-border shadow-2xs">
        {/* Header & Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Deals of the Day
            </h2>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft ? (
                <span className="tabular-nums font-mono text-[11px]">
                  Ends in {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              ) : (
                <span className="tabular-nums font-mono text-[11px] opacity-0" aria-hidden="true">
                  Ends in 00:00:00
                </span>
              )}
            </div>
          </div>

          <Link href="/offers" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>View All Offers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((prod) => (
            <div key={prod.id} className="h-full">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
