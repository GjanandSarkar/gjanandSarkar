"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, User } from 'lucide-react';
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

  const navItems: BottomNavItem[] = [
    { href: '/home', icon: Home, label: t('navHome') || 'Home' },
    { href: '/products', icon: LayoutGrid, label: t('categories') || 'Categories' },
    { href: '/search', icon: Search, label: t('search') || 'Search' },
    { href: '/profile', icon: User, label: t('navProfile') || 'Account' },
  ];

  const hideOn = ['/checkout', '/order-confirmed', '/login', '/onboarding'];
  if (hideOn.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
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

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex items-center justify-center min-h-[44px]"
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
