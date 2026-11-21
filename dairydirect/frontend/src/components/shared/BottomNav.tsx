"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, BadgePercent, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
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
    return null;
  }

  return (
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

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors relative"
            aria-current={isActive ? 'page' : undefined}
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
