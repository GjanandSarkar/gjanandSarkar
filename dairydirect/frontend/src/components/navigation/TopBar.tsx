import React from 'react';
import { Truck } from 'lucide-react';

import { getFreeDeliveryThreshold } from '@/lib/api/settings';

/**
 * Sitewide announcement bar.
 *
 * Was a client component with the free-shipping threshold hardcoded at ₹499,
 * while the pricing engine gives free delivery above ₹299 — so every page
 * advertised a different threshold from the one the cart applied. It has no
 * interactivity, so it is now a server component that reads the real value
 * (cached for an hour) and ships no JavaScript at all.
 */
export async function TopBar() {
  const freeDeliveryThreshold = await getFreeDeliveryThreshold();

  return (
    <div className="w-full bg-[#0d3b24] text-white text-[11px] md:text-xs py-1.5 px-4 md:px-8 border-b border-[#144f31]">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between font-medium">
        {/* Left Notice */}
        <div className="flex items-center gap-2">
          <span className="text-sm" aria-hidden="true">🇮🇳</span>
          <span className="font-semibold text-white/95">100% Made in India</span>
          <span className="text-white/40 hidden sm:inline" aria-hidden="true">|</span>
          <span className="text-white/80 hidden sm:inline">
            One verified brand per category
          </span>
        </div>

        {/* Right Notice */}
        <div className="flex items-center gap-1.5 text-emerald-200/90 font-medium">
          <Truck className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>
            Free delivery over{' '}
            <strong className="text-white tabular-nums">
              ₹{freeDeliveryThreshold}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
