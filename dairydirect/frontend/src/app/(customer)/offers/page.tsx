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
    <div className="w-full bg-[#fafaf8] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Special Offers & Coupons</h1>
        <p className="text-gray-600 mb-8">Save more on your daily dairy needs with our exclusive discounts.</p>
        
        {coupons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-xl font-medium text-gray-800 mb-2">No active offers right now</h2>
            <p className="text-gray-500 mb-6">Check back later for new discounts and deals.</p>
            <Link href="/" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon: any) => (
              <div key={coupon.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex flex-col items-center justify-center text-center">
                  <span className="inline-block px-4 py-1.5 bg-white text-emerald-700 font-bold tracking-widest text-lg md:text-xl border-2 border-dashed border-emerald-300 rounded uppercase">
                    {coupon.code}
                  </span>
                  <div className="mt-4 font-bold text-2xl text-emerald-900">
                    ₹{coupon.discount_amount} OFF
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  {coupon.min_order_amount && (
                    <p className="text-gray-700 font-medium mb-2">
                      On minimum order of ₹{coupon.min_order_amount}
                    </p>
                  )}
                  {coupon.valid_until && (
                    <div className="flex items-center text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
                      <Clock className="w-4 h-4 mr-2" />
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
