"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Sparkles, ArrowDown, Store, CheckCircle2 } from 'lucide-react';

interface SellerHeroBannerProps {
  onScrollToForm?: () => void;
}

export function SellerHeroBanner({ onScrollToForm }: SellerHeroBannerProps) {
  const scrollToForm = () => {
    if (onScrollToForm) {
      onScrollToForm();
    } else {
      const el = document.getElementById('seller-application-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-surface border-b border-border bg-dot-pattern">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Top Badges & Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Exclusive Marketplace Partnership</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight leading-[1.15]">
            Proudly Indian. <br />
            <span className="text-primary">Purely Authentic.</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground-muted font-normal leading-relaxed max-w-2xl mx-auto">
            Connecting India's finest manufacturers directly with conscious consumers. Partner with Gjanand Sarkar to represent your product category with single-brand exclusivity.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={scrollToForm}
              className="min-h-[44px] px-6 py-2.5 bg-primary hover:bg-primary-hover text-on-primary font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Store className="w-4 h-4 text-on-primary" />
              <span>Apply for Category Exclusivity</span>
              <ArrowDown className="w-4 h-4 text-on-primary" />
            </button>

            <Link
              href="/home"
              className="min-h-[44px] px-6 py-2.5 bg-surface hover:bg-surface-muted text-foreground border border-border font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>

        {/* 3 Core Value Pillars (Image 3 Showcase) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 max-w-5xl mx-auto">
          
          {/* Card 1: 100% Authentic */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col items-center text-center hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-success-bg text-primary flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              100% Authentic
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Direct from source, lab-tested purity, and guaranteed genuine Indian manufacturing with zero middlemen.
            </p>
          </div>

          {/* Card 2: Verified Sellers */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col items-center text-center hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-warning-bg text-secondary flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              Verified Sellers
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Stringent quality and FSSAI standards. Only legally compliant Indian businesses are approved to sell.
            </p>
          </div>

          {/* Card 3: One Category, One Brand */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col items-center text-center hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">
              One Category, One Brand
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Curated excellence. No endless scrolling or internal price wars — your brand owns its category exclusively.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
