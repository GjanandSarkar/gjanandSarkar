"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface HeroBannerProps {
  products?: CatalogProduct[];
}

const SLIDE_DURATION_MS = 5000; // 5 seconds per slide

export function HeroBanner({ products }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Spotlight up to 5 featured products
  const featured = (products || []).slice(0, 5);
  const total = featured.length;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const handleSelectSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  // Apple-style smooth timer that fills the active pill
  useEffect(() => {
    if (isPaused || total <= 1) return;

    const intervalMs = 50;
    const increment = (intervalMs / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % total);
          return 0;
        }
        return Math.min(100, prev + increment);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, total]);

  const currentProduct = featured[currentIndex] || featured[0];
  const firstVariant = currentProduct?.product_variants?.[0];
  const weight = firstVariant?.weight;

  return (
    <section className="w-full relative bg-surface border-b border-border py-6 sm:py-10 transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* ── Left Hero Copy ── */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4">
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              Pure Grocery & Farm Essentials, <br className="hidden sm:inline" />
              Delivered Fast
            </h1>

            {/* Value Proposition */}
            <p className="text-sm sm:text-base text-foreground-muted max-w-xl leading-relaxed">
              Fresh A2 dairy, bilona ghee, cold-pressed oils, and staples directly from verified producers to your doorstep.
            </p>

            {/* Simple Trust Line */}
            <p className="text-xs text-foreground-muted flex items-center gap-2 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>100% genuine products</span>
              <span>•</span>
              <span>Fast 15-20 min delivery</span>
              <span>•</span>
              <span>Verified partner brands</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/subscribe"
                className="px-6 py-3 rounded-xl bg-surface border border-border hover:bg-surface-muted text-foreground font-semibold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Daily Subscription</span>
              </Link>
            </div>
          </div>

          {/* ── Right Spotlight Product Card (Splash Showcase) ── */}
          <div
            className="lg:col-span-5 relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentProduct ? (
              <div className="relative bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-2xs transition-all duration-200">
                
                {/* Header Info */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-foreground-muted">
                    Featured Spotlight
                  </span>

                  <span className="text-xs font-medium text-foreground-muted tabular-nums">
                    {currentIndex + 1} of {total}
                  </span>
                </div>

                {/* Product Image Stage - fills card space with object-cover */}
                <Link
                  href={`/products/${currentProduct.id}`}
                  className="block relative w-full aspect-square max-h-[280px] sm:max-h-[320px] rounded-xl overflow-hidden mb-3 bg-surface-muted group"
                >
                  <Image
                    key={currentProduct.id}
                    src={currentProduct.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={currentProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Product Details (Pure Information & Photos - No Price / No Add to Cart) */}
                <div className="space-y-1.5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {currentProduct.brand || 'Gjanand Sarkar Farm Direct'}
                    </span>
                    {weight && (
                      <span className="text-xs font-semibold text-foreground-muted bg-surface-muted px-2 py-0.5 rounded-md">
                        {weight}
                      </span>
                    )}
                  </div>

                  <Link href={`/products/${currentProduct.id}`}>
                    <h3 className="text-base sm:text-lg font-black text-foreground hover:text-primary transition-colors line-clamp-1">
                      {currentProduct.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-foreground-muted line-clamp-2">
                    {currentProduct.description || 'Pure, natural, lab-tested essentials direct from certified farms.'}
                  </p>
                </div>

                {/* ── Apple-Style Slider Indicator Controls ── */}
                <div className="pt-3 mt-1 border-t border-border/60 flex items-center justify-between gap-3">
                  {/* Apple Growing Pill & Dots */}
                  <div className="flex items-center gap-2">
                    {featured.map((p, idx) => {
                      const isActive = idx === currentIndex;
                      return (
                        <button
                          key={p.id || idx}
                          type="button"
                          onClick={() => handleSelectSlide(idx)}
                          className={`relative h-2.5 rounded-full transition-all duration-300 cursor-pointer overflow-hidden ${
                            isActive
                              ? 'w-10 sm:w-12 bg-foreground/15 ring-1 ring-primary/40'
                              : 'w-2.5 bg-foreground/20 hover:bg-foreground/45'
                          }`}
                          aria-label={`Go to slide ${idx + 1}: ${p.name}`}
                          title={p.name}
                        >
                          {isActive && (
                            <span
                              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-75 ease-linear"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Prev / Next Step Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors cursor-pointer active:scale-95"
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-muted flex items-center justify-center text-foreground transition-colors cursor-pointer active:scale-95"
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
