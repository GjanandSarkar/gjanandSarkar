"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
} from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { BRAND, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { findCategory } from '@/lib/constants/categories';
import { useStore } from '@/store/useStore';
import { addToCart, updateCartItem, removeFromCart } from '@/lib/api/cart';

interface HeroBannerProps {
  products?: CatalogProduct[];
}

export function HeroBanner({ products }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [busy, setBusy] = useState(false);

  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);
  const removeFromCartLocal = useStore((s) => s.removeFromCartLocal);

  // Spotlight up to 5 featured products
  const featured = (products || []).slice(0, 5);
  const total = featured.length;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Gentle carousel rotation
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, handleNext, total]);

  const currentProduct = featured[currentIndex] || featured[0];
  const firstVariant = currentProduct?.product_variants?.[0];
  const price = firstVariant?.price;
  const originalPrice = firstVariant?.original_price;
  const weight = firstVariant?.weight;

  // Cart quantity check for featured item
  const currentCartItem = firstVariant
    ? cart.find((i) => i.productId === currentProduct.id && i.variantId === firstVariant.id)
    : undefined;
  const currentQty = currentCartItem?.quantity ?? 0;

  const handleAddHeroItem = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firstVariant || busy) return;
    setBusy(true);
    addToCartLocal(currentProduct.id, firstVariant.id, 1);
    if (user) {
      await addToCart(user.id, currentProduct.id, firstVariant.id, 1);
    }
    setBusy(false);
  };

  const handleUpdateHeroItem = async (e: React.MouseEvent, type: 'inc' | 'dec') => {
    e.preventDefault();
    if (!firstVariant || busy) return;
    setBusy(true);
    const newQty = type === 'inc' ? currentQty + 1 : currentQty - 1;
    if (newQty <= 0) {
      removeFromCartLocal(currentProduct.id, firstVariant.id);
      if (user) await removeFromCart(user.id, currentProduct.id, firstVariant.id);
    } else {
      updateCartQuantityLocal(currentProduct.id, firstVariant.id, newQty);
      if (user) await updateCartItem(user.id, currentProduct.id, firstVariant.id, newQty);
    }
    setBusy(false);
  };

  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-b from-surface via-background to-surface border-b border-border/70 py-8 md:py-12 lg:py-16 transition-colors duration-150">
      
      {/* Subtle organic background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ── Left Hero Copy ── */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
            
            {/* Quick-Commerce Pill (Country Delight & Zepto Inspired) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black tracking-wide">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>⚡ DAILY MORNING 6:30 AM DELIVERY</span>
              <span className="opacity-40">•</span>
              <span className="text-secondary font-bold">100% PURE & TESTED</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
              Farm-Fresh Gir A2 Milk & <br className="hidden sm:inline" />
              <span className="text-primary underline decoration-secondary/60 decoration-wavy decoration-2">
                Pure Vedic Bilona Ghee.
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-sm md:text-base text-muted max-w-xl leading-relaxed">
              Tested on <strong className="text-foreground">70+ purity parameters</strong> every single batch.
              Delivered directly from certified ethical farms to your doorstep with cold-chain freshness.
              One verified brand per category — zero middleman markup.
            </p>

            {/* 3 Core Trust Badges (Country Delight Style) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 py-2 w-full max-w-lg">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-muted border border-border/80">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-black text-foreground leading-tight">70+ Lab Tests</p>
                  <p className="text-[9px] sm:text-[10px] text-muted">Zero adulteration</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-muted border border-border/80">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-black text-foreground leading-tight">6:30 AM Fresh</p>
                  <p className="text-[9px] sm:text-[10px] text-muted">Daily morning slot</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-muted border border-border/80">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-black text-foreground leading-tight">100% Bharat</p>
                  <p className="text-[9px] sm:text-[10px] text-muted">Direct from farms</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-foreground-inverse font-black text-xs sm:text-sm shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4 text-secondary" />
              </Link>

              <Link
                href="/subscribe"
                className="px-6 py-3.5 rounded-xl bg-surface border border-secondary text-secondary hover:bg-surface-muted font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>Start Subscription</span>
              </Link>
            </div>
          </div>

          {/* ── Right Spotlight Product Card (Clean Quick-Commerce Tile) ── */}
          <div
            className="lg:col-span-5 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentProduct ? (
              <div className="relative bg-surface rounded-2xl border border-border/90 p-5 sm:p-6 shadow-xl transition-all duration-300">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/15 text-secondary text-[11px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Fresh Batch</span>
                  </span>

                  <span className="text-xs font-bold text-muted tabular-nums">
                    {currentIndex + 1} of {total}
                  </span>
                </div>

                {/* Product Image Stage */}
                <Link
                  href={`/products/${currentProduct.id}`}
                  className="block relative w-full aspect-square max-h-[260px] sm:max-h-[280px] bg-surface-muted rounded-xl overflow-hidden mb-3 p-4 flex items-center justify-center group"
                >
                  <Image
                    src={currentProduct.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={currentProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Product Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {currentProduct.brand || 'Gjanand Sarkar Farm Direct'}
                    </span>
                    {weight && (
                      <span className="text-xs font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded-md">
                        {weight}
                      </span>
                    )}
                  </div>

                  <Link href={`/products/${currentProduct.id}`}>
                    <h3 className="text-base sm:text-lg font-black text-foreground hover:text-primary transition-colors line-clamp-1">
                      {currentProduct.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted line-clamp-2">
                    {currentProduct.description || 'Pure, natural, lab-tested dairy straight from farm.'}
                  </p>

                  {/* Price and Cart Action Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-primary tabular-nums">
                        ₹{price ?? 0}
                      </span>
                      {originalPrice && originalPrice > (price ?? 0) && (
                        <span className="text-xs text-muted line-through tabular-nums">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {firstVariant ? (
                        currentQty > 0 ? (
                          <div className="flex items-center bg-primary text-foreground-inverse rounded-lg shadow-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => handleUpdateHeroItem(e, 'dec')}
                              disabled={busy}
                              aria-label="Decrease quantity"
                              className="px-2.5 py-1.5 hover:bg-black/10 active:scale-95 transition cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 py-1 text-xs font-black min-w-[24px] text-center tabular-nums">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleUpdateHeroItem(e, 'inc')}
                              disabled={busy}
                              aria-label="Increase quantity"
                              className="px-2.5 py-1.5 hover:bg-black/10 active:scale-95 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleAddHeroItem}
                            disabled={busy}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-foreground-inverse font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )
                      ) : null}

                      <Link
                        href={`/products/${currentProduct.id}`}
                        className="px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-foreground font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Switcher & Prev/Next Controls */}
                <div className="pt-4 mt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    {featured.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          idx === currentIndex
                            ? 'border-primary ring-1 ring-primary/40 scale-105'
                            : 'border-border/60 opacity-60 hover:opacity-100 hover:border-border'
                        }`}
                        title={p.name}
                      >
                        <Image
                          src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                          alt={p.name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors cursor-pointer"
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors cursor-pointer"
                      aria-label="Next item"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-border/80 p-8 text-center shadow-xl space-y-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-foreground">
                  Pure Authentic Bharat Products
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Every product is lab verified and delivered fresh from partner farms across India.
                </p>
                <Link
                  href="/products"
                  className="inline-flex px-5 py-2.5 bg-primary text-foreground-inverse text-xs font-bold rounded-lg"
                >
                  Browse Store
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
