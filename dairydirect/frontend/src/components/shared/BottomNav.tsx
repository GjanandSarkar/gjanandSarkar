"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, Receipt, CalendarDays, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/products', icon: Grid3x3, label: t('navProducts') },
    { href: '/orders', icon: Receipt, label: t('navOrders') },
    { href: '/subscribe', icon: CalendarDays, label: t('navSubscribe') },
    { href: '/profile', icon: User, label: t('navProfile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-end z-50 md:hidden pb-safe"
      style={{ 
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        paddingTop: '8px',
      }}>
      
      {/* Top tonal line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-25"
        style={{ background: 'var(--color-outline-variant)' }} />

      {navItems.map((item, idx) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 flex-1 py-1 relative"
          >
            {/* Active indicator pill */}
            <div className={cn(
              "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300",
              isActive 
                ? "scale-100" 
                : "scale-90 opacity-0 pointer-events-none"
            )}
              style={isActive ? { 
                background: 'linear-gradient(135deg, #c2efac, #a7d392)',
              } : {}}>
              {/* ghost */}
            </div>
            
            {/* Icon positioned over pill */}
            <div className="absolute top-1 flex items-center justify-center w-12 h-7">
              <Icon 
                className="transition-all duration-200"
                style={{ 
                  width: '20px', 
                  height: '20px',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-outline)',
                  strokeWidth: isActive ? 2.5 : 1.75,
                }} 
              />
            </div>

            <span className="text-[10px] font-semibold leading-none mt-[30px]"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-outline)' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
