"use client";

import React from 'react';
import Link from 'next/link';
import { LocationSelector } from './LocationSelector';
import { SearchTrigger } from './SearchTrigger';
import { CartButton } from './CartButton';
import { AccountMenu } from './AccountMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  return (
    <header 
      className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-border"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Location */}
        <div className="flex items-center gap-4 md:gap-8 shrink-0">
          <Link href="/home" className="flex items-center active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <img src="/logo.svg" alt="Gjanand Sarkar" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
          </Link>
          
          <div className="hidden sm:block border-l border-border h-8 mx-2" />
          
          <LocationSelector className="hidden sm:flex" />
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
          <SearchTrigger />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <NotificationBell />
          <AccountMenu className="hidden sm:flex" />
          <CartButton className="hidden md:flex" />
        </div>
      </div>
      
      {/* Mobile Location & Search (Below Header for narrow screens) */}
      <div className="md:hidden px-4 pb-3 flex flex-col gap-3">
        <LocationSelector />
        <SearchTrigger />
      </div>
    </header>
  );
}
