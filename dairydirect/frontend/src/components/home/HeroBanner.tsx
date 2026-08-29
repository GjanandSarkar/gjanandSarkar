"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, PackageOpen } from 'lucide-react';
import type { ProductWithVariants } from '@/lib/api/products';

interface ShowcaseProduct {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  image: string;
  href: string;
  tagColor: string;
}

interface HeroBannerProps {
  products?: ProductWithVariants[];
}

const badgeColors = ['#d97706', '#0f3e26', '#15803d', '#c88a23', '#047857', '#b45309'];
const badges = ['VEDIC BILONA GHEE', 'ARTISANAL HERITAGE', 'HANDCRAFTED FRESH', 'PROBIOTIC PURITY', 'AUTHENTIC DESI', '100% ORGANIC'];

export function HeroBanner({ products }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Map database products to showcase products
  const rawItems: ShowcaseProduct[] = (products || []).map((p, idx) => ({
    id: p.id,
    name: p.name,
    subtitle: p.category || '100% Pure & Vedic',
    badge: badges[idx % badges.length],
    badgeBg: badgeColors[idx % badgeColors.length],
    image: p.image_url || '/milk.png',
    href: `/products/${p.id}`,
    tagColor: 'text-[#0f3e26]'
  }));

  let showcaseProducts = rawItems;
  if (showcaseProducts.length > 0 && showcaseProducts.length < 3) {
    while (showcaseProducts.length < 6) {
      showcaseProducts = [...showcaseProducts, ...rawItems];
    }
    showcaseProducts = showcaseProducts.slice(0, 6);
  }

  const total = showcaseProducts.length;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Automatic seamless rotation timer every 2.8s
  useEffect(() => {
    if (isPaused || total === 0) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2800);

    return () => clearInterval(timer);
  }, [isPaused, handleNext, total]);

  // Calculate position offset for 3D carousel orbit
  const getCardStyle = (index: number) => {
    if (total === 0) return {};
    let diff = (index - currentIndex) % total;
    if (diff < -Math.floor(total / 2)) diff += total;
    if (diff > Math.floor(total / 2)) diff -= total;

    // Center Active Card
    if (diff === 0) {
      return {
        transform: 'translateX(-50%) translateZ(80px) rotateY(0deg) scale(1.08)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto' as const,
        filter: 'drop-shadow(0 20px 25px rgba(200, 138, 35, 0.25))'
      };
    }
    // Left Neighbor Card
    if (diff === -1) {
      return {
        transform: 'translateX(calc(-50% - 150px)) translateZ(-30px) rotateY(16deg) scale(0.86)',
        opacity: 0.85,
        zIndex: 20,
        pointerEvents: 'auto' as const,
        filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.08))'
      };
    }
    // Right Neighbor Card
    if (diff === 1) {
      return {
        transform: 'translateX(calc(-50% + 150px)) translateZ(-30px) rotateY(-16deg) scale(0.86)',
        opacity: 0.85,
        zIndex: 20,
        pointerEvents: 'auto' as const,
        filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.08))'
      };
    }
    // Far Left Card
    if (diff < -1) {
      return {
        transform: 'translateX(calc(-50% - 270px)) translateZ(-120px) rotateY(32deg) scale(0.65)',
        opacity: 0,
        zIndex: 10,
        pointerEvents: 'none' as const
      };
    }
    // Far Right Card
    return {
      transform: 'translateX(calc(-50% + 270px)) translateZ(-120px) rotateY(-32deg) scale(0.65)',
      opacity: 0,
      zIndex: 10,
      pointerEvents: 'none' as const
    };
  };

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#fbf8f2] via-[#f7f1e5] to-[#f4ebe0] border-b border-[#e9dfd0]">
      
      {/* Decorative Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.045] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#c88a23 1.2px, transparent 1.2px), radial-gradient(#0f3e26 1.2px, #fbf8f2 1.2px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-14 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* ── Left Hero Copy ── */}
        <div className="flex-1 max-w-xl text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f3e26]/10 text-[#0f3e26] text-xs font-black uppercase tracking-wider mb-4 border border-[#0f3e26]/15">
            <span className="text-sm">🦚</span>
            <span>Empowering Bharat</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-[#0f3e26] leading-[1.12] tracking-tight mb-4">
            Proudly Indian. <br />
            <span className="text-[#1b5e39]">Purely Authentic.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-700 font-normal leading-relaxed mb-8 max-w-lg">
            Your one-stop platform for Made in India products from trusted businesses, local dairy farms, and heritage craftsmen.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/products"
              className="px-7 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white font-black text-sm rounded-xl shadow-lg shadow-[#0f3e26]/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-4 h-4 text-[#c88a23]" />
            </Link>

            <Link
              href="/become-seller"
              className="px-7 py-3.5 bg-white/70 hover:bg-white text-[#925f0e] border border-[#c88a23] font-bold text-sm rounded-xl active:scale-95 transition-all shadow-2xs"
            >
              Become a Seller
            </Link>
          </div>
        </div>

        {/* ── Right Animated 3D Rotating Carousel Showcase / Empty State ── */}
        {total > 0 ? (
          <div 
            className="flex-1 w-full max-w-2xl relative flex flex-col items-center justify-center select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            
            {/* Main 3D Orbit Stage */}
            <div className="relative w-full aspect-[4/3] max-h-[420px] flex items-center justify-center p-2 sm:p-4 perspective-1000">
              
              {/* Background Concentric Sacred Geometry Circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <svg 
                  viewBox="0 0 600 450" 
                  className="w-full h-full stroke-[#c88a23]/35 fill-none animate-spin-slow" 
                  strokeWidth="1"
                >
                  <circle cx="300" cy="225" r="210" strokeDasharray="6 6" />
                  <circle cx="300" cy="225" r="160" strokeDasharray="4 4" />
                  <circle cx="300" cy="225" r="110" />
                  
                  <path d="M 300,15 L 585,225 L 300,435 L 15,225 Z" strokeDasharray="4 4" strokeWidth="0.8" opacity="0.6" />
                  <line x1="300" y1="15" x2="300" y2="435" strokeDasharray="6 6" opacity="0.3" />
                  <line x1="15" y1="225" x2="585" y2="225" strokeDasharray="6 6" opacity="0.3" />
                </svg>
              </div>

              {/* Glowing Aura behind center */}
              <div className="absolute w-48 h-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

              {/* 3D Orbit Container with Rotating Cards */}
              <div className="relative w-full h-full flex items-center justify-center preserve-3d">
                {showcaseProducts.map((product, idx) => {
                  const style = getCardStyle(idx);
                  const isCenter = (idx - currentIndex) % total === 0;

                  return (
                    <div
                      key={`${product.id}-${idx}`}
                      className="absolute left-1/2 top-1/2 -translate-y-1/2 transition-all duration-700 ease-out preserve-3d"
                      style={{
                        transform: style.transform,
                        opacity: style.opacity,
                        zIndex: style.zIndex,
                        pointerEvents: style.pointerEvents
                      }}
                    >
                      <Link
                        href={product.href}
                        className={`block w-40 sm:w-52 md:w-60 h-52 sm:h-68 md:h-76 rounded-3xl p-3 sm:p-4 backdrop-blur-xl border transition-all duration-500 cursor-pointer overflow-visible group ${
                          isCenter 
                            ? 'bg-white/95 border-2 border-[#c88a23] shadow-2xl' 
                            : 'bg-white/80 border-amber-200/70 shadow-lg hover:bg-white/90'
                        }`}
                      >
                        {/* Top Golden Pill Badge */}
                        {isCenter && (
                          <div 
                            className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[9px] sm:text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1.5 animate-pulse-gentle z-30"
                            style={{ backgroundColor: product.badgeBg }}
                          >
                            <Sparkles className="w-3 h-3 text-amber-200" />
                            <span>{product.badge}</span>
                          </div>
                        )}

                        {/* Product Image */}
                        <div className="w-full flex-1 h-32 sm:h-44 md:h-48 flex items-center justify-center p-1 sm:p-2 mt-1">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className={`w-full h-full object-contain drop-shadow-xl transition-all duration-500 ${
                              isCenter 
                                ? 'animate-float-subtle group-hover:scale-110' 
                                : 'group-hover:scale-105'
                            }`} 
                          />
                        </div>

                        {/* Product Name & Subtitle */}
                        <div className="w-full text-center pt-2 pb-1">
                          <h3 className={`font-black text-[#0f3e26] line-clamp-1 ${
                            isCenter ? 'text-xs sm:text-sm md:text-base' : 'text-[11px] sm:text-xs'
                          }`}>
                            {product.name}
                          </h3>
                          <p className={`font-bold truncate ${
                            isCenter ? 'text-[10px] sm:text-xs text-amber-800' : 'text-[9px] sm:text-[10px] text-amber-700'
                          }`}>
                            {product.subtitle}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Left Prev Navigation Button */}
              <button
                onClick={handlePrev}
                aria-label="Previous product"
                className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-amber-200 text-[#0f3e26] hover:bg-[#0f3e26] hover:text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Next Navigation Button */}
              <button
                onClick={handleNext}
                aria-label="Next product"
                className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 border border-amber-200 text-[#0f3e26] hover:bg-[#0f3e26] hover:text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

            </div>

            {/* Interactive Indicator Dots */}
            <div className="flex items-center gap-2 mt-2 z-30">
              {showcaseProducts.map((p, idx) => (
                <button
                  key={`${p.id}-${idx}-dot`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide to ${p.name}`}
                  className={`transition-all duration-500 rounded-full cursor-pointer ${
                    currentIndex === idx 
                      ? 'w-7 h-2 bg-[#c88a23] shadow-xs' 
                      : 'w-2 h-2 bg-amber-300/80 hover:bg-amber-400'
                  }`}
                />
              ))}
            </div>

          </div>
        ) : (
          /* Empty Database State Card */
          <div className="flex-1 w-full max-w-md relative flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-amber-300/80 text-center shadow-lg my-4">
            <div className="w-16 h-16 rounded-full bg-amber-100/80 flex items-center justify-center mb-4 text-[#0f3e26] shadow-xs">
              <PackageOpen className="w-8 h-8 text-[#c88a23]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#0f3e26] mb-2">
              No Products Available
            </h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              The product database is currently empty. New items will automatically appear here once sellers list their products.
            </p>
            <Link
              href="/become-seller"
              className="px-6 py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              List Products as Seller
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

