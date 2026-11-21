"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
<<<<<<< HEAD
import { Home, LayoutGrid, Search, User } from 'lucide-react';
=======
import { Home, LayoutGrid, BadgePercent, Package, User } from 'lucide-react';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';

interface BottomNavItem {
  href: string;
  icon: typeof Home;
  label: string;
  badge?: number;
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
<<<<<<< HEAD

  const navItems: BottomNavItem[] = [
    { href: '/home', icon: Home, label: t('navHome') || 'Home' },
    { href: '/products', icon: LayoutGrid, label: t('categories') || 'Categories' },
    { href: '/search', icon: Search, label: t('search') || 'Search' },
    { href: '/profile', icon: User, label: t('navProfile') || 'Account' },
  ];

  const hideOn = ['/checkout', '/order-confirmed', '/login', '/onboarding'];
  if (hideOn.some(p => pathname.startsWith(p))) {
=======
  const user = useStore((state) => state.user);

  const navItems = [
    { href: '/home', icon: Home, label: t('navHome') || 'Home' },
    { href: '/categories', icon: LayoutGrid, label: 'Shop' },
    { href: '/offers', icon: BadgePercent, label: 'Offers' },
    { href: '/orders', icon: Package, label: 'Orders' },
    { href: '/profile', icon: User, label: t('navProfile') || 'Account' },
  ];

  // Hide on checkout
  if (pathname === '/checkout' || pathname?.startsWith('/checkout/')) {
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    return null;
  }

  return (
<<<<<<< HEAD
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center z-50 md:hidden bg-surface/95 backdrop-blur-md border-t border-border h-16 pb-[max(env(safe-area-inset-bottom),0px)]">
      {navItems.map((item) => {
        const isActive = item.href !== '#' && pathname.startsWith(item.href);
        const Icon = item.icon;
        
        const content = (
          <div className="flex flex-col items-center justify-center gap-1 py-1 relative w-full h-full min-h-[44px] cursor-pointer">
            <div className="relative flex items-center justify-center">
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors duration-150",
                  isActive ? "text-primary stroke-[2.2]" : "text-foreground-muted stroke-[1.75]"
                )}
              />
              {item.badge ? (
                <span
                  key={item.badge}
                  className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-xs font-semibold text-on-primary bg-primary tabular-nums"
                >
                  {item.badge}
                </span>
              ) : null}
            </div>

            <span className={cn(
              "text-xs leading-none transition-colors duration-150",
              isActive ? "font-semibold text-primary" : "font-normal text-foreground-muted"
            )}>
              {item.label}
            </span>
          </div>
        );
=======
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around z-50 md:hidden bg-surface/95 backdrop-blur-md border-t border-border select-none"
      style={{
        height: 'calc(var(--h-bottomnav) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/home'
            ? pathname === '/home'
            : pathname.startsWith(item.href);
        const Icon = item.icon;
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

        return (
          <Link
            key={item.href}
            href={item.href}
<<<<<<< HEAD
            className="flex-1 flex items-center justify-center min-h-[44px]"
=======
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors relative"
            aria-current={isActive ? 'page' : undefined}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          >
            {/* Icon container with pill background on active */}
            <div className="relative flex items-center justify-center w-12 h-7">
              {isActive && (
                <div
                  className="absolute inset-0 w-[34px] h-[26px] mx-auto rounded-full bg-primary-fixed transition-all duration-300"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-300 ease-[var(--ease-spring)]",
                  isActive
                    ? "text-brand-ink scale-110 -translate-y-0.5 stroke-[2.4]"
                    : "text-foreground-muted stroke-[1.8]"
                )}
              />

              {/* Status indicators */}
              {item.href === '/profile' && user && (
                <span
                  className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-brand-ink ring-2 ring-surface"
                  aria-hidden="true"
                />
              )}
            </div>

            <span
              className={cn(
                "text-[10px] tracking-tight leading-none mt-1 transition-colors",
                isActive ? "text-brand-ink font-bold" : "text-foreground-muted font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
