import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Heart, 
  Leaf, 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Truck, 
  Clock, 
  MapPin 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Gjanand Sarkar brings India\u2019s best brands onto one platform \u2014 one verified partner per category, across dairy, groceries, wellness, home, fashion and electronics.',
};

export default function AboutPage() {
  const pillars = [
    {
      icon: Award,
      title: 'One Brand Per Category',
      desc: 'We partner with exactly one company in each category. No duplicate listings, no counterfeits, no guessing which seller is the real one.'
    },
    {
      icon: ShieldCheck,
      title: 'Every Partner Verified',
      desc: 'Business registration, GST and all category-specific licences are checked before a partner can list, and reviewed for as long as they stay active.'
    },
    {
      icon: Leaf,
      title: 'Made in India, Always',
      desc: 'Every product on the platform is made in India. We exist to give Indian manufacturers and craftspeople a storefront that does them justice.'
    },
    {
      icon: Heart,
      title: 'Fair Terms For Partners',
      desc: 'Transparent commissions and predictable payouts, so the people actually making the product keep a fair share of what you pay.'
    }
  ];

  const milestones = [
    {
      year: '2022',
      title: 'Humble Beginnings',
      desc: 'Started in Gujarat with a single category and a handful of local producers, delivering to families in Ahmedabad and Gandhinagar.'
    },
    {
      year: '2023',
      title: 'The One-Partner Model',
      desc: 'Moved from an open seller model to a curated one \u2014 a single verified brand per category, accountable for quality end to end.'
    },
    {
      year: '2024',
      title: 'Multi-Category Expansion',
      desc: 'Opened groceries, cold-pressed oils, spices, Ayurveda and wellness, and home and kitchen alongside the original dairy category.'
    },
    {
      year: '2025+',
      title: 'Pan-India Marketplace',
      desc: 'Building towards full national coverage across every major category \u2014 from everyday staples to fashion, handicrafts and electronics.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-900 pb-20">
      
      {/* Hero Banner */}
      <section className="relative bg-[#082615] text-white py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
            <path d="M50 10 C65 25 80 45 70 70 C60 90 40 95 30 75 C20 55 35 25 50 10 Z" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-[#c88a23]/40 text-[#c88a23] text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Championing Brands Made in India</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            One Platform. <br className="hidden sm:block" />
            <span className="text-[#c88a23]">One Trusted Brand Per Category.</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Gjanand Sarkar was founded on a simple promise: make it effortless to
            buy genuine Indian products. We partner with exactly one verified company
            in every category, so what you see is what you get — every time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/home"
              className="px-6 py-3 rounded-xl bg-[#c88a23] hover:bg-[#b0781c] text-white font-extrabold text-sm transition-all shadow-md active:scale-95"
            >
              Explore Products
            </Link>
            <Link
              href="/become-seller"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-all"
            >
              Become a Partner Brand
            </Link>
          </div>
        </div>
      </section>

      {/* Core Mission & Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Our Genesis</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f3e26] mt-2 mb-4">
              Why Gjanand Sarkar was born
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Shopping online in India means scrolling past twenty near-identical
                listings for the same thing, from sellers you have never heard of, with
                no reliable way to tell the genuine article from a counterfeit. Good
                Indian brands get buried; buyers get burned.
              </p>
              <p>
                We asked a simple question: <strong className="text-gray-900 font-semibold">what if we picked one brand per category, and stood behind it?</strong> Not the
                cheapest listing, not the highest bidder — one company we have
                verified, whose products we would put in our own homes.
              </p>
              <p>
                That constraint is the whole product. It means fewer choices, and far
                better ones — across dairy, groceries, spices, wellness, home, fashion
                and electronics.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f3e26] to-[#082615] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black text-amber-300">The Gjanand Sarkar Standard</h3>
              <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-100">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Verified before listing:</strong> Business registration, GST and every licence a category requires.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>Made in India:</strong> Every product on the platform is manufactured or crafted in India.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>One partner, one category:</strong> A single accountable brand per category — never competing duplicates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#c88a23] shrink-0 mt-0.5" />
                  <span><strong>We take the complaint:</strong> If something is wrong, we resolve it — you never chase an anonymous seller.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="bg-emerald-50/60 py-16 border-y border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Our Pillars</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f3e26] mt-1">
              Built On Integrity & Science
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-emerald-200/70 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-[#0f3e26] flex items-center justify-center mb-4">
                  <pillar.icon className="w-6 h-6 text-[#0f3e26]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{pillar.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#c88a23]">Growth & Impact</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f3e26] mt-1">
            Our Journey So Far
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {milestones.map((m, i) => (
            <div key={i} className="relative bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#0f3e26] text-white text-[11px] font-black tracking-wider mb-3">
                {m.year}
              </span>
              <h3 className="text-xs font-bold text-gray-900 mb-1">{m.title}</h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner verification & certifications */}
      <section id="verification" className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-8">
        <div className="bg-white border border-amber-300/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-[#c88a23] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1 flex items-center gap-2">
              <span>Partner Verification &amp; Certifications</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Verified</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every partner brand is verified for business registration, GST and the
              licences its category requires before a single product goes live. For food
              and beverage categories that includes a valid FSSAI licence — Gjanand
              Sarkar operates under FSSAI License No. <strong>10724026000189</strong>, and
              partner facilities adhere to FSSAI Schedule 4 hygiene standards. Non-food
              categories are held to the equivalent standards for their sector.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
