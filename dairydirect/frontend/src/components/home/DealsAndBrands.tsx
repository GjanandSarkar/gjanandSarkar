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

interface DealsAndBrandsProps {
  products: CatalogProduct[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {
  const user = useStore((s) => s.user);
  const addToCartLocal = useStore((s) => s.addToCartLocal);

  // Live Countdown State for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 32 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  // Deal items (find products where original_price > price)
  const dealProducts = products.filter(p => {
    const v = p.product_variants?.[0];
    return v && v.original_price && v.original_price > v.price;
  }).slice(0, 4);
  
  // If no deals found, just fall back to first 4 products
  const displayProducts = dealProducts.length > 0 ? dealProducts : products.slice(0, 4);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div>
        {/* ── DEAL OF THE DAY (Full Width) ── */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">

          {/* Header & Countdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="flex items-center gap-3">
               <h2 className="text-xl md:text-2xl font-black text-[#0f3e26] tracking-tight">
                Deal of the Day
              </h2>
              <div className="flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-emerald-700 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Ends in {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>

            <Link href="/offers" className="text-xs font-bold text-[#c88a23] hover:text-[#0f3e26] flex items-center gap-1">
              <span>View Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Deal Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {displayProducts.map((prod, idx) => {
              const variant = prod.product_variants?.[0];
              const price = variant?.price ?? 199;
              const originalPrice = variant?.original_price ?? Math.round(price * 1.25);
              const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

              return (
                <div
                  key={prod.id}
                  className="bg-gray-50/60 rounded-xl p-2.5 border border-gray-200/60 flex flex-col justify-between group hover:border-[#c88a23] hover:shadow-md transition-all"
                >
                  <div className="relative">
                    {/* Discount Badge */}
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                      {discountPercent}% OFF
                    </span>

                    {/* Image */}
                    <div className="w-full aspect-square bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden mb-2">
                      <img
                        src={prod.image_url || '/milk.png'}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 leading-snug">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mb-1.5">
                      {variant?.weight || 'Standard Pack'}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-sm font-black text-[#0f3e26]">
                        ₹{price}
                      </span>
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{originalPrice}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-2">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-gray-700">4.{7 - idx}</span>
                      <span className="text-gray-400 font-normal">({85 + idx * 42})</span>
                    </div>

                    {/* Quick Add */}
                    <button
                      onClick={async () => {
                        if (!variant) return;
                        addToCartLocal(prod.id, variant.id, 1);
                        if (user) await addToCart(user.id, prod.id, variant.id, 1);
                      }}
                      className="w-full py-1.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
