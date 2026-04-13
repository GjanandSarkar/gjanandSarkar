"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, Receipt, CalendarDays, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { NotificationBell } from './NotificationPanel';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const logoutLocal = useStore(state => state.logout);
  const user = useStore(state => state.user);
  const router = useRouter();

  const navItems = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/products', icon: Grid3x3, label: t('navProducts') },
    { href: '/orders', icon: Receipt, label: t('navOrders') },
    { href: '/subscribe', icon: CalendarDays, label: t('navSubscribe') },
    { href: '/profile', icon: User, label: t('navProfile') },
  ];

  const handleLogout = async () => {
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-50"
      style={{ background: 'var(--color-surface-container-lowest)' }}>
      
      {/* Ambient top glow */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-20 rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'var(--color-primary-fixed)' }} suppressHydrationWarning />

      {/* Brand */}
      <div className="h-[72px] flex items-center px-6 relative z-10">
        <Link href="/home" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="DairyDirect Logo" className="w-9 h-9 object-contain" />
          <div className="flex flex-col">
            <span className="font-extrabold text-[17px] leading-none tracking-tight"
              style={{ color: 'var(--color-on-surface)' }}>DairyDirect</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
              style={{ color: 'var(--color-primary)' }}>Farm to Doorstep</span>
          </div>
        </Link>
      </div>

      {/* User Greeting */}
      {user && (
        <div className="mx-4 mb-2 px-4 py-3 rounded-[14px]"
          style={{ background: 'var(--color-surface-container-low)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-outline)' }}>Good morning</p>
          <p className="font-bold text-[15px] leading-tight mt-0.5"
            style={{ color: 'var(--color-on-surface)' }}>
            {user.name?.split(' ')[0] || 'Guest'} 👋
          </p>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'var(--color-outline)' }}>Navigation</p>

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] transition-all duration-200 group relative",
                isActive
                  ? "font-bold"
                  : "font-medium hover:bg-[#f0f4ec]"
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, #eaf4e2, #ddf2d0)',
                color: 'var(--color-primary)',
              } : {
                color: 'var(--color-on-surface-variant)',
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ background: 'var(--color-primary)' }} />
              )}
              <div className={cn(
                "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-all",
                isActive ? "shadow-sm" : "group-hover:bg-white/70"
              )}
                style={isActive ? {
                  background: 'var(--color-primary-fixed)',
                  color: 'var(--color-primary)',
                } : {}}>
                <Icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[14px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider tonal */}
      <div className="mx-4 h-[1px] opacity-40" style={{ background: 'var(--color-outline-variant)' }} />

      {/* Bottom — Notifications + Logout */}
      <div className="p-3 pb-6 flex flex-col gap-1">
        {/* Notification Bell — desktop dropdown */}
        <div className="relative px-0.5">
          <div className="flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] w-full"
            style={{ color: 'var(--color-on-surface-variant)' }}>
            <NotificationBell variant="desktop" />
            <span className="text-[14px] font-medium">{t('notifications')}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] w-full transition-all duration-200 hover:bg-red-50 group"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut className="w-[17px] h-[17px]" strokeWidth={2} />
          </div>
          <span className="text-[14px] font-medium group-hover:text-red-600">Logout</span>
        </button>
      </div>
    </aside>
  );
}
