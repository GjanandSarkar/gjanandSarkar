"use client";

import Link from 'next/link';
import { ShieldCheck, Truck, BadgeIndianRupee, ArrowRight } from 'lucide-react';
import { ShapeDivider } from '@/components/ui/ShapeDivider';

/**
 * Homepage hero.
 *
 * Every strong storefront is organised around one promise. Blinkit's is "10
 * minutes" and everything on the page reinforces it. We cannot make that
 * claim — there are no dark stores behind this — and leading on discounts is
 * a fight against Flipkart and Amazon that a new marketplace loses.
 *
 * What is actually true here, and enforced in the database by
 * `uniq_active_seller_per_category`, is that exactly one vetted company
 * supplies each category. That is the structural difference worth shouting
 * about: the customer never has to compare forty unknown sellers and guess
 * which one is genuine. So the hero sells curation, and delivery is a
 * supporting proof point rather than the headline.
 *
 * No carousel. Auto-rotating heroes are routinely ignored, push real content
 * below the fold, and on a phone the second slide is almost never seen.
 */

const PROOF_POINTS = [
  {
    icon: ShieldCheck,
    title: 'One vetted brand per category',
    detail: 'We do the shortlisting so you do not have to',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Honest pricing',
    detail: 'Real prices, no invented discounts',
  },
  {
    icon: Truck,
    title: 'Delivered across India',
    detail: 'Tracked from dispatch to doorstep',
  },
];

export function CurationHero({ categoryCount }: { categoryCount: number }) {
  return (
    <section className="relative w-full bg-primary text-on-primary overflow-hidden">
      {/* Soft radial wash. Pure CSS, no image request, and it keeps the flat
          colour block from looking like an untextured slab. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, #ffffff 0%, transparent 45%), radial-gradient(circle at 85% 0%, #ffffff 0%, transparent 40%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 pt-10 pb-6 md:pt-16 md:pb-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-on-accent px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rise-in">
            India-wide marketplace
          </span>

          <h1
            className="mt-4 text-[28px] leading-[1.15] sm:text-4xl md:text-5xl font-black tracking-tight rise-in"
            style={{ ['--i' as string]: 1 }}
          >
            One brand we trust,
            <br />
            for every category.
          </h1>

          <p
            className="mt-3 text-sm sm:text-base text-on-primary/80 max-w-xl rise-in"
            style={{ ['--i' as string]: 2 }}
          >
            We partner with a single verified company in each of our{' '}
            {categoryCount} categories — so every product you see has already
            been checked, and you are never left comparing sellers you have
            never heard of.
          </p>

          <div
            className="mt-6 flex flex-wrap items-center gap-3 rise-in"
            style={{ ['--i' as string]: 3 }}
          >
            <Link
              href="/products"
              className="press focus-ring inline-flex items-center gap-2 rounded-xl bg-accent text-on-accent px-5 py-3 text-sm font-extrabold shadow-[var(--shadow-card-hover)]"
            >
              Start shopping
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/become-seller"
              className="press focus-ring inline-flex items-center gap-2 rounded-xl border border-on-primary/30 px-5 py-3 text-sm font-bold hover:bg-on-primary/10 transition-colors"
            >
              Partner with us
            </Link>
          </div>
        </div>

        {/* Proof points. Three concrete claims, each one defensible. */}
        <ul className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROOF_POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <li
                key={p.title}
                className="rise-in flex items-start gap-3 rounded-xl bg-on-primary/10 backdrop-blur-[2px] px-3.5 py-3 border border-on-primary/15"
                style={{ ['--i' as string]: 4 + i }}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold leading-tight">{p.title}</p>
                  <p className="text-[11px] text-on-primary/70 leading-snug mt-0.5">
                    {p.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Flows into the page background below. */}
      <ShapeDivider variant="wave" color="var(--background)" height={40} />
    </section>
  );
}
