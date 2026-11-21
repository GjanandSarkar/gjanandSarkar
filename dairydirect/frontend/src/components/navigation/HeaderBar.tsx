"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getUnreadCount, subscribeToNotifications } from '@/lib/api/notifications';
import { SearchBar } from './SearchBar';
import { LocationSheet } from './LocationSheet';
import { CartButton } from './CartButton';
import { AccountMenu } from './AccountMenu';
import { cn } from '@/lib/utils';

export function HeaderBar() {
  const user = useStore((state) => state.user);
  const wishlist = useStore((state) => state.wishlist);
  const setNotificationDrawerOpen = useStore((state) => state.setNotificationDrawerOpen);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const tickingRef = useRef(false);

  // Notifications subscription
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationsCount(0);
      return;
    }
    getUnreadCount(user.id, user.role).then(setUnreadNotificationsCount);
    const unsubscribe = subscribeToNotifications(user.id, () => {
      setUnreadNotificationsCount((c) => c + 1);
    });
    return unsubscribe;
  }, [user]);

  // Passive rAF scroll listener (after 64px, elevate + translate mobile row 1)
  useEffect(() => {
    const handleScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 64);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)]",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="max-w-[var(--w-content)] mx-auto px-3 sm:px-6">
        {/* ─── MOBILE VIEW (≤639px): 2 rows, total 104px ─── */}
        <div className="flex md:hidden flex-col justify-between py-2 min-h-[104px]">
          {/* Row 1 (28px height): Location + ETA Chip + Bell + Avatar */}
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)] h-7",
              isScrolled && "-translate-y-2 opacity-90"
            )}
          >
            <LocationSheet />

            <div className="flex items-center gap-2">
              <span className="bg-success-bg text-success text-[11px] font-bold px-2 h-6 rounded-full inline-flex items-center tracking-tight shadow-xs select-none">
                in 18 min
              </span>

              <button
                type="button"
                onClick={() => setNotificationDrawerOpen(true)}
                className="relative p-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer select-none"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error" />
                )}
              </button>

              <AccountMenu />
            </div>
          </div>

          {/* Row 2 (44px): Full-width search pill */}
          <div className="w-full pt-1">
            <SearchBar />
          </div>
        </div>

        {/* ─── DESKTOP VIEW (≥768px): Single row 72px ─── */}
        <div className="hidden md:flex items-center justify-between gap-6 h-[72px]">
          {/* Brand Logo & Location */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              href="/home"
              className="flex items-center gap-2 group active:scale-95 transition-transform"
              aria-label="Gjanand Sarkar Home"
            >
              <img
                src="/application logo/gjanand sarkar logo.png"
                alt="Gjanand Sarkar"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col ml-1">
                <span className="text-xl font-black tracking-tight leading-none text-brand-ink font-display">
                  Gjanand
                </span>
                <span className="text-[9px] tracking-[0.25em] font-extrabold text-foreground-muted uppercase leading-none mt-0.5">
                  SARKAR
                </span>
              </div>
            </Link>

            <LocationSheet />
          </div>

          {/* Search Bar (flex-1, max-w-xl) */}
          <div className="flex-1 max-w-xl mx-auto">
            <SearchBar />
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="h-11 w-11 flex items-center justify-center rounded-[var(--radius-md)] bg-surface hover:bg-surface-muted text-foreground border border-border transition-colors relative cursor-pointer select-none active:scale-95"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-foreground-muted hover:text-error transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-error text-foreground-inverse text-[9px] font-bold flex items-center justify-center tabular">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setNotificationDrawerOpen(true)}
              className="h-11 w-11 flex items-center justify-center rounded-[var(--radius-md)] bg-surface hover:bg-surface-muted text-foreground border border-border transition-colors relative cursor-pointer select-none active:scale-95"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground-muted" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-error text-foreground-inverse text-[9px] font-bold flex items-center justify-center tabular">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <CartButton />

            {/* Account Dropdown */}
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

