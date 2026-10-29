import React from 'react';
import { Truck, ShieldCheck } from 'lucide-react';

import { getFreeDeliveryThreshold } from '@/lib/api/settings';

/**
 * Sitewide announcement bar.
 */
export async function TopBar() {
  const freeDeliveryThreshold = await getFreeDeliveryThreshold();

  return (
    <div className="w-full bg-primary text-on-primary text-xs py-2 px-4 md:px-8 border-b border-primary-hover">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between font-normal">
        {/* Left Notice */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-on-primary shrink-0" aria-hidden="true" />
          <span className="font-medium text-on-primary">100% Made in India</span>
          <span className="text-on-primary/40 hidden sm:inline" aria-hidden="true">|</span>
          <span className="text-on-primary/80 hidden sm:inline">
            One verified brand per category
          </span>
        </div>

        {/* Right Notice */}
        <div className="flex items-center gap-1.5 text-on-primary/90 font-normal">
          <Truck className="w-3.5 h-3.5 text-on-primary/80" aria-hidden="true" />
          <span>
            Free delivery over{' '}
            <strong className="text-on-primary font-semibold tabular-nums">
              ₹{freeDeliveryThreshold}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
