import React from 'react';
import { Tag, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getActiveCoupons() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/coupons`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.coupons || [];
  } catch (err) {
    console.error('Failed to fetch coupons', err);
    return [];
  }
}

export default async function OffersPage() {
  const coupons = await getActiveCoupons();

  return (
    <div className="w-full bg-background min-h-screen text-foreground pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-foreground mb-1">Bank & Promo Offers</h1>
          <p className="text-xs text-muted">Use coupon codes at checkout for instant order discounts.</p>
        </div>
        
        {coupons.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-md mx-auto">
            <h2 className="text-sm font-bold text-foreground mb-1">No active offers right now</h2>
            <p className="text-xs text-muted mb-5">Check back later for seasonal flash coupons and deals.</p>
            <Link href="/home" className="inline-block px-5 py-2.5 bg-primary hover:bg-primary-hover text-foreground-inverse font-bold text-xs rounded-xl shadow-xs">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon: any) => (
              <div key={coupon.id} className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col shadow-xs">
                <div className="bg-primary/5 border-b border-primary/10 p-5 flex flex-col items-center justify-center text-center">
                  <span className="inline-block px-3 py-1 bg-surface text-primary font-mono font-bold tracking-widest text-base border-2 border-dashed border-primary/30 rounded-lg uppercase">
                    {coupon.code}
                  </span>
                  <div className="mt-3 font-extrabold text-xl text-primary">
                    {coupon.type === 'percentage' 
                      ? `${coupon.value || coupon.discount_amount}% OFF` 
                      : `₹${coupon.value || coupon.discount_amount} OFF`}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  {coupon.min_order_amount && (
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Applicable on orders above ₹{coupon.min_order_amount}
                    </p>
                  )}
                  {coupon.valid_until && (
                    <div className="flex items-center text-[11px] text-muted pt-3 border-t border-border/60">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Valid until {new Date(coupon.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
