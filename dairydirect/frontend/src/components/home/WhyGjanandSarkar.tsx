import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Leaf,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';

import { CATEGORIES } from '@/lib/constants/categories';

/**
 * Replaces the former ImpactAndTestimonial section.
 *
 * That section showed four invented counters ("50K+ Happy Families",
 * "15K+ Partner Brands", "10K+ Pincodes Reached", "4.9 star Customer
 * Rating") and three fabricated customer testimonials with invented names,
 * cities and initials, each carrying a "Verified Buyer" badge. None of it
 * came from the database, and the platform has not launched, so every
 * number and quote was false.
 *
 * Inventing social proof is a poor trade in general; on a brand whose entire
 * pitch is verified authenticity it actively contradicts the product. It is
 * also a misleading-advertising exposure under the Consumer Protection Act
 * 2019, and a fake "Verified Buyer" badge is exactly the pattern the CCPA's
 * 2022 dark-patterns guidance targets.
 *
 * What replaces it is only things the company itself controls and can
 * evidence: the operating model, the verification criteria, and the category
 * count (derived from the taxonomy, so it cannot drift).
 *
 * Real testimonials belong here once the `reviews` table has genuine
 * verified-purchase entries. Render them from that table, not from a
 * constant.
 *
 * This is a server component: it has no interactivity, so it ships no
 * JavaScript. The version it replaces was a client component carrying a
 * carousel's worth of state.
 */

const pillars = [
  {
    icon: Award,
    title: 'One brand per category',
    body: 'We partner with a single company in each category. No duplicate listings and no guessing which seller is genuine.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified before listing',
    body: 'Business registration, GST and every licence the category requires are checked before a product goes live.',
  },
  {
    icon: Leaf,
    title: 'Made in India',
    body: 'Every product on the platform is manufactured or crafted in India. That is the entry condition, not a filter.',
  },
  {
    icon: HeartHandshake,
    title: 'We take the complaint',
    body: 'One accountable partner per category means we resolve problems directly instead of sending you to chase a seller.',
  },
];

export function WhyGjanandSarkar() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c88a23]">
              How we work
            </span>
            <h2 className="text-xl md:text-2xl font-black text-[#0f3e26] tracking-tight mt-1">
              Fewer choices. Far better ones.
            </h2>
          </div>

          {/* Derived from the taxonomy, so this number cannot go stale. */}
          <p className="text-xs text-gray-500 font-medium">
            <strong className="text-[#0f3e26] font-black tabular-nums">
              {CATEGORIES.length}
            </strong>{' '}
            categories live, one partner brand each
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center border border-emerald-100">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-gray-900 leading-snug">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] font-bold text-gray-500 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Every partner verified before listing
          </span>

          <Link
            href="/about#verification"
            className="text-xs font-black text-[#c88a23] hover:text-[#0f3e26] inline-flex items-center gap-1 transition-colors"
          >
            <span>How we verify partners</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
