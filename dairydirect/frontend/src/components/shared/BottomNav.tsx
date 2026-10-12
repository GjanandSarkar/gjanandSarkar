"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const cart = useStore(state => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/search', icon: Search, label: 'Search' },
    // The unread badge was hardcoded to 2, so every user permanently saw two
    // phantom notifications they could never clear. There is no unread count
    // in the store yet, so no badge is shown until one exists.
    { href: '#', isNotification: true, icon: Bell, label: 'Alerts', badge: 0 },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems },
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
        const isActive = item.href !== '#' && pathname.startsWith(item.href);
        const Icon = item.icon;
        
        const content = (
          <div className="flex flex-col items-center gap-1 flex-1 py-1 relative w-full h-full cursor-pointer">
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
              {item.badge ? (
                <span
                  key={item.badge}
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white bg-secondary border border-white pop tabular-nums"
                >
                  {item.badge}
                </span>
              ) : null}
            </div>

            <span className="text-[10px] font-semibold leading-none mt-[30px]"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-outline)' }}>
              {item.label}
            </span>
          </div>
        );

        // If it's the notification trigger, we use a separate handler instead of Link
        if (item.isNotification) {
          return (
            <NotificationTrigger key="notifications" content={content} />
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1"
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useState } from 'react';

function NotificationTrigger({ content }: { content: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="flex-1" onClick={() => setIsOpen(true)}>
        {content}
      </div>
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
