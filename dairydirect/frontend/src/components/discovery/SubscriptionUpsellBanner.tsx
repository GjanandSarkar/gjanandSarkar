"use client";

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SubscriptionUpsellBannerProps {
  category: string;
}

export function SubscriptionUpsellBanner({ category }: SubscriptionUpsellBannerProps) {
  // Only upsell subscriptions for Milk
  if (category !== 'Milk') return null;

  return (
    <Link href="/subscribe/new" className="block mb-6">
      <div className="bg-gradient-to-r from-mint/50 to-primary/10 rounded-[16px] p-4 border border-primary/20 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black text-dark tracking-tight">Subscribe & Save 5%</h4>
            <p className="text-[11px] font-bold text-primary/80 uppercase tracking-widest">Daily Morning Delivery</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
