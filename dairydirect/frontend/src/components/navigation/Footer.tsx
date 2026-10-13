"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Leaf,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-surface-elevated text-foreground border-t border-border relative overflow-hidden transition-colors duration-150">
      
      {/* ── Top Quality & Cold-Chain Promise Strip (Airy & Breathable) ── */}
      <div className="w-full border-b border-border/80 bg-surface/60 py-8 md:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">70+ Purity Tests</h4>
                <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                  Every single batch lab-tested for zero adulteration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">6:30 AM Cold Chain</h4>
                <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                  Daily morning doorstep delivery at 4°C freshness.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">100% Direct From Farms</h4>
                <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                  Ethical goshalas & verified Indian partner producers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">Vedic Authenticity</h4>
                <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                  Traditional Bilona & wood-pressed ancient techniques.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Footer Navigation & Breathable Content ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pt-16 md:pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-border/80">
          
          {/* Column 1: Brand & Sourcing Bio (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/application logo/gjanand sarkar logo.png"
                alt="Gjanand Sarkar"
                className="h-11 w-auto object-contain drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-foreground">
                  Gjanand
                </span>
                <span className="text-[10px] tracking-[0.22em] font-black text-secondary uppercase leading-none mt-0.5">
                  SARKAR
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm">
              Empowering Indian families with lab-tested pure A2 Gir cow milk, Vedic Bilona ghee, and ethically sourced farm staples. One verified producer brand per category.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-muted">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cold-chain hubs active across major cities</span>
            </div>
          </div>

          {/* Column 2: Products & Categories (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-secondary">
              Pure Dairy & Pantry
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted">
              <li>
                <Link href="/products?category=milk" className="hover:text-primary transition-colors">
                  Gir Cow A2 Milk
                </Link>
              </li>
              <li>
                <Link href="/products?category=ghee" className="hover:text-primary transition-colors">
                  Vedic Bilona Ghee
                </Link>
              </li>
              <li>
                <Link href="/products?category=paneer" className="hover:text-primary transition-colors">
                  Fresh Malai Paneer
                </Link>
              </li>
              <li>
                <Link href="/products?category=curd" className="hover:text-primary transition-colors">
                  Desi Dahi & Chaas
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-primary">
                  <span>All Products</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Services (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-secondary">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-muted">
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">
                  Track Morning Delivery
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-primary transition-colors">
                  Daily Subscription Planner
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors">
                  Purity Guarantee & Returns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Direct Farm Support & FAQ
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-primary transition-colors">
                  Partner As Ethical Goshala
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Verification (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-secondary">
              Purity Alerts & Offers
            </h4>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Subscribe for new batch harvest announcements and morning delivery alerts.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2.5 pt-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface border border-border text-foreground placeholder-muted outline-none focus:border-primary transition-colors shadow-2xs"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-foreground-inverse font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{subscribed ? 'Subscribed to Fresh Batches!' : 'Join Fresh Club'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* ── Sub-Footer / Copyright & Clean Legal Links ── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Gjanand Sarkar. Authentic Bharat Commerce.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">•</span>
            <Link href="/about" className="hover:text-foreground transition-colors">
              Lab Reports
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>Direct From Ethical Bharat Farms</span>
            <span className="text-sm">🇮🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
