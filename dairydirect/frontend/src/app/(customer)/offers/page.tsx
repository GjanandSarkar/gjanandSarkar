import React from 'react';
import { Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import { getActiveCouponsServer } from '@/lib/api/coupons.server';

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
  const coupons = await getActiveCouponsServer();


  return (
<<<<<<< HEAD
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Special Offers & Coupons</h1>
        <p className="text-foreground-muted mb-8">Save more on your daily dairy needs with our exclusive discounts.</p>
        
        {coupons.length === 0 ? (
          <div className="bg-surface rounded-xl shadow-sm border border-border p-12 text-center">
            <h2 className="text-xl font-medium text-foreground mb-2">No active offers right now</h2>
            <p className="text-foreground-muted mb-6">Check back later for new discounts and deals.</p>
            <Link href="/" className="px-6 py-2 bg-success text-on-success rounded-lg hover:bg-success transition">
              Continue Shopping
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon: any) => (
<<<<<<< HEAD
              <div key={coupon.id} className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-success-bg border-b border-success-bg p-6 flex flex-col items-center justify-center text-center">
                  <span className="inline-block px-4 py-1.5 bg-surface text-success font-bold tracking-widest text-lg md:text-xl border-2 border-dashed border-success rounded uppercase">
                    {coupon.code}
                  </span>
                  <div className="mt-4 font-bold text-2xl text-success">
=======
              <div key={coupon.id} className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col shadow-xs">
                <div className="bg-primary/5 border-b border-primary/10 p-5 flex flex-col items-center justify-center text-center">
                  <span className="inline-block px-3 py-1 bg-surface text-primary font-mono font-bold tracking-widest text-base border-2 border-dashed border-primary/30 rounded-lg uppercase">
                    {coupon.code}
                  </span>
                  <div className="mt-3 font-extrabold text-xl text-primary">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    {coupon.type === 'percentage' 
                      ? `${coupon.value || coupon.discount_amount}% OFF` 
                      : `₹${coupon.value || coupon.discount_amount} OFF`}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  {coupon.min_order_amount && (
<<<<<<< HEAD
                    <p className="text-foreground font-medium mb-2">
                      On minimum order of ₹{coupon.min_order_amount}
                    </p>
                  )}
                  {coupon.valid_until && (
                    <div className="flex items-center text-sm text-foreground-muted mt-auto pt-4 border-t border-border">
                      <Clock className="w-4 h-4 mr-2" />
=======
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Applicable on orders above ₹{coupon.min_order_amount}
                    </p>
                  )}
                  {coupon.valid_until && (
                    <div className="flex items-center text-[11px] text-muted pt-3 border-t border-border/60">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
