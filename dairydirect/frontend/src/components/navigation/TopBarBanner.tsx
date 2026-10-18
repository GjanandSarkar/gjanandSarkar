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
      // Check session storage
      const dismissedInSession = sessionStorage.getItem(STORAGE_KEY) === 'true';
      // Also check document.cookie as a fallback
      const dismissedInCookie = document.cookie.includes(`${STORAGE_KEY}=true`);
      if (dismissedInSession || dismissedInCookie) {
        setIsDismissed(true);
      }
    } catch {
      // Ignore security errors in restricted environments
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      // Set session cookie (expires when browser session ends)
      document.cookie = `${STORAGE_KEY}=true; path=/; SameSite=Lax`;
    } catch {
      // Ignore
    }
  };

  // If dismissed during this session, do not render
  if (isMounted && isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 md:px-8 border-b border-slate-800 transition-all duration-200">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between font-medium gap-2">
        {/* Left Notice */}
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span className="font-medium text-slate-200 truncate">Pure Indian Farm Products</span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
          <span className="text-slate-400 hidden sm:inline truncate">
            Direct from Certified Ethical Farms
          </span>
        </div>

        {/* Right Section: Delivery Notice + Dismiss Cross Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Truck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>
              Free delivery above{' '}
              <strong className="text-white tabular-nums">
                ₹{freeDeliveryThreshold}
              </strong>
            </span>
          </div>

          {/* Dismiss Cross Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="p-1 -mr-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss for this session"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
