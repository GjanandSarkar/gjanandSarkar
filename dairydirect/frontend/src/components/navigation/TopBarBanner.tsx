"use client";

import React, { useState, useEffect } from 'react';
import { Truck, X } from 'lucide-react';

interface TopBarBannerProps {
  freeDeliveryThreshold: number;
}

const STORAGE_KEY = 'gs_topbar_dismissed';

export function TopBarBanner({ freeDeliveryThreshold }: TopBarBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const dismissedInSession = sessionStorage.getItem(STORAGE_KEY) === 'true';
      const dismissedInCookie = document.cookie.includes(`${STORAGE_KEY}=true`);
      if (dismissedInSession || dismissedInCookie) {
        setIsDismissed(true);
      }
    } catch {
      // Ignore in restricted environments
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      document.cookie = `${STORAGE_KEY}=true; path=/; SameSite=Lax`;
    } catch {
      // Ignore
    }
  };

  if (isMounted && isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-primary text-on-primary h-8 px-3 sm:px-6 border-b border-primary-active/20 transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)] select-none">
      <div className="max-w-[var(--w-content)] mx-auto h-full flex items-center justify-between text-[11px] sm:text-xs font-semibold gap-2">
        {/* Left Notice */}
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-on-primary shrink-0" />
          <span className="truncate">Pure Indian Farm Products</span>
          <span className="opacity-40 hidden sm:inline" aria-hidden="true">|</span>
          <span className="opacity-90 hidden sm:inline truncate">
            Direct from Certified Ethical Farms
          </span>
        </div>

        {/* Right Section: Free delivery notice + Dismiss */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <Truck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Free delivery above{' '}
              <span className="tabular font-black">
                ₹{freeDeliveryThreshold}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="p-1 -mr-1 rounded-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            title="Dismiss for this session"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
