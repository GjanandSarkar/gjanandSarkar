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
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* Hero Banner */}
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-muted text-primary text-xs font-medium mb-6 border border-border">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Championing Brands Made in India</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight mb-5">
            One Platform. <br className="hidden sm:block" />
            <span>One Trusted Brand Per Category.</span>
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
            Gjanand Sarkar was founded on a simple promise: make it effortless to
            buy genuine Indian products. We partner with exactly one verified company
            in every category, so what you see is what you get — every time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/home"
              className="px-6 py-2.5 rounded-lg bg-surface text-foreground hover:bg-surface-muted font-medium text-xs sm:text-sm transition-colors shadow-xs min-h-[44px] flex items-center"
            >
              Explore Products
            </Link>
            <Link
              href="/become-seller"
              className="px-6 py-2.5 rounded-lg border border-white/40 text-white hover:bg-white/10 font-medium text-xs sm:text-sm transition-colors min-h-[44px] flex items-center"
            >
              Become a Partner Brand
            </Link>
          </div>
        </div>
      </section>

      {/* Core Mission & Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold text-primary">Our Genesis</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-1 mb-4">
              Why Gjanand Sarkar was born
            </h2>
            <div className="space-y-4 text-sm text-foreground-muted leading-relaxed">
              <p>
                Shopping online in India means scrolling past twenty near-identical
                listings for the same thing, from sellers you have never heard of, with
                no reliable way to tell the genuine article from a counterfeit. Good
                Indian brands get buried; buyers get burned.
              </p>
              <p>
                We asked a simple question: <strong className="text-foreground font-medium">what if we picked one brand per category, and stood behind it?</strong> Not the
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

          <div className="bg-surface rounded-lg p-6 sm:p-8 border border-border shadow-xs">
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-foreground">The Gjanand Sarkar Standard</h3>
              <ul className="space-y-3.5 text-xs sm:text-sm text-foreground-muted">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Verified before listing:</strong> Business registration, GST and every licence a category requires.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Made in India:</strong> Every product on the platform is manufactured or crafted in India.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">One partner, one category:</strong> A single accountable brand per category — never competing duplicates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">We take the complaint:</strong> If something is wrong, we resolve it — you never chase an anonymous seller.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="bg-surface-muted py-14 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-primary">Our Pillars</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-1">
              Built On Integrity &amp; Transparency
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((pillar, idx) => (
              <div key={idx} className="bg-surface p-5 rounded-lg border border-border shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-surface-muted text-primary flex items-center justify-center mb-3.5">
                  <pillar.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-1.5">{pillar.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-primary">Growth &amp; Impact</span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-1">
            Our Journey So Far
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {milestones.map((m, i) => (
            <div key={i} className="bg-surface p-5 rounded-lg border border-border shadow-xs">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-xs font-medium mb-2.5">
                {m.year}
              </span>
              <h3 className="text-xs font-semibold text-foreground mb-1">{m.title}</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner verification & certifications */}
      <section id="verification" className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-2 pb-8">
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-surface-muted text-primary flex items-center justify-center shrink-0 border border-border">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-2">
              <span>Partner Verification &amp; Certifications</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-muted text-primary font-medium border border-border">Verified</span>
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
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
