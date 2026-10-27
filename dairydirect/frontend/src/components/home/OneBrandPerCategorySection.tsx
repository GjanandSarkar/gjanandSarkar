"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Factory, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants/categories';
import { useTranslation } from '@/lib/i18n';

export function OneBrandPerCategorySection() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Award,
      title: t('oneCategoryOneBrand') || "One Category, One Master Brand",
      description:
        t('oneCategoryOneBrandDesc') || "We reject marketplace chaos. Instead of thousands of unverified sellers fighting on price, we contract exactly one vetted Indian manufacturer per category.",
    },
    {
      icon: Factory,
      title: t('directFromMaker') || "Direct From The Maker",
      description:
        t('directFromMakerDesc') || "Every order ships directly from the partner's verified production facility or farm. No wholesaler markups, no unauthorized distributors.",
    },
    {
      icon: ShieldCheck,
      title: t('auditedAuthenticated') || "Audited & Authenticated",
      description:
        t('auditedAuthenticatedDesc') || "From GST compliance and manufacturing licenses to lab purity certifications, every partner undergoes exhaustive verification before their first product lists.",
    },
  ];

  return (
    <section className="hidden md:block w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="bg-surface rounded-2xl border border-border p-6 md:p-10 shadow-xs">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-medium mb-2 border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>{t('ourOperatingModel') || 'Our Operating Model'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {t('oneTrustedBrand') || 'One Trusted Brand Per Category'}
            </h2>
            <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
              {t('oneTrustedBrandSub') || "Why browse hundreds of dubious listings? Gjanand Sarkar handpicks India's finest single manufacturing partner in every product category."}
            </p>
          </div>

          <Link
            href="/about#verification"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors shrink-0"
          >
            <span>{t('learnVerification') || 'Learn About Our Verification'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="flex flex-col p-5 rounded-lg bg-surface-muted/60 border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary mb-3.5 shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Live Partner Taxonomy Preview */}
        <div className="bg-surface-muted rounded-lg p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-foreground font-medium">
              Active across {CATEGORIES.length} essential categories — Dairy, Groceries, Spices, Oils, Wellness, Handicrafts & more.
            </p>
          </div>
          <Link
            href="/become-seller"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover transition-colors inline-flex items-center justify-center shrink-0"
          >
            Apply to Represent a Category
          </Link>
        </div>

      </div>
    </section>
  );
}
