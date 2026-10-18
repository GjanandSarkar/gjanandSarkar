"use client";

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
    { href: '/categories', icon: LayoutGrid, label: 'Categories' },
    { href: '/offers', icon: BadgePercent, label: 'Offers' },
    { href: '/orders', icon: Package, label: 'Orders' },
    { href: '/profile', icon: User, isAvatar: true, label: t('navProfile') || 'Profile' },
  ];

  if (pathname === '/checkout' || pathname?.startsWith('/checkout/')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around z-50 md:hidden bg-surface/95 backdrop-blur-md border-t border-border"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
        paddingTop: '6px',
        height: 'calc(54px + max(env(safe-area-inset-bottom, 0px), 6px))',
      }}
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const isActive = item.href === '/home' 
          ? pathname === '/home' 
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none"
          >
            <div className="relative flex items-center justify-center">
              {item.isAvatar ? (
                <div
                  className={cn(
                    "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center transition-all duration-150 border",
                    isActive
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/80"
                  )}
                >
                  <img
                    src={user?.avatar_url || '/profile/profile.jpg'}
                    alt={user?.name || 'Profile'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                    }}
                  />
                </div>
              ) : (
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-150",
                    isActive ? "text-primary stroke-[2.5]" : "text-foreground-muted stroke-[1.75]"
                  )}
                />
              )}
            </div>

            <span
              className={cn(
                "text-[10px] font-medium tracking-tight mt-1 transition-colors leading-none",
                isActive ? "text-primary font-bold" : "text-foreground-muted"
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
