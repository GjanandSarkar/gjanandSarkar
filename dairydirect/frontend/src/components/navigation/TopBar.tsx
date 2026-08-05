"use client";

import React from 'react';
import { Truck } from 'lucide-react';

export function TopBar() {
  return (
    <div className="w-full bg-[#0d3b24] text-white text-[11px] md:text-xs py-1.5 px-4 md:px-8 border-b border-[#144f31]">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between font-medium">
        {/* Left Notice */}
        <div className="flex items-center gap-2">
          <span className="text-sm">🇮🇳</span>
          <span className="font-semibold text-white/95">100% Made in India</span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-white/80 hidden sm:inline">Supporting Indian Businesses & Artisans</span>
        </div>

        {/* Right Notice */}
        <div className="flex items-center gap-1.5 text-emerald-200/90 font-medium">
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>Free Shipping on Orders Above <strong className="text-white">₹499</strong></span>
        </div>
      </div>
    </div>
  );
}
