"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, ArrowRight } from 'lucide-react';

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
    <footer id="main-footer" className="w-full bg-surface text-foreground border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-20 md:pt-12 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 pb-6 md:pb-10 border-b border-border">
          
          {/* Column 1: Brand & Bio (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <Link href="/home" className="flex items-center gap-2.5 shrink-0">
              <img
                src="/application logo/gjanand sarkar logo.png"
                alt="Gjanand Sarkar"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xl font-bold tracking-tight text-foreground">
                Gjanand Sarkar
              </span>
            </Link>

            <p className="text-xs text-foreground-muted leading-relaxed max-w-sm">
              One trusted brand per category. Genuine Indian groceries, farm essentials, and pantry staples delivered directly to your doorstep.
            </p>
          </div>

          {/* Column 2: Quick Links (2 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li>
                <Link href="/categories/milk" className="hover:text-primary transition-colors">
                  A2 Milk & Dairy
                </Link>
              </li>
              <li>
                <Link href="/categories/ghee" className="hover:text-primary transition-colors">
                  Bilona Ghee
                </Link>
              </li>
              <li>
                <Link href="/categories/sweets" className="hover:text-primary transition-colors">
                  Traditional Sweets
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-primary transition-colors">
                  Special Offers
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors font-semibold text-primary inline-flex items-center gap-1">
                  <span>Browse All Products</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-primary transition-colors">
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Help & Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-primary transition-colors">
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Stay Updated
            </h4>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Receive updates on seasonal harvest batches and exclusive offers.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted border border-border text-foreground placeholder:text-foreground-muted outline-none focus:border-primary transition-colors"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{subscribed ? 'Subscribed!' : 'Subscribe'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* ── Sub-Footer / Copyright & Legal Links ── */}
        <div className="pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-foreground-muted">
          <div>
            <span>© {new Date().getFullYear()} Gjanand Sarkar. All rights reserved.</span>
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
              About Us
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
