"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Grid3x3, Receipt, User, LogOut, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { NotificationBell } from './NotificationPanel';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface SidebarItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

export interface SidebarProps {
  items?: SidebarItem[];
  title?: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const logoutLocal = useStore(state => state.logout);
  const user = useStore(state => state.user);
  const router = useRouter();

  const defaultNavItems: SidebarItem[] = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/products', icon: Grid3x3, label: t('navProducts') },
    { href: '/orders', icon: Receipt, label: t('navOrders') },
    { href: '/profile', icon: User, label: t('navProfile') },
  ];

  const navItems = items || defaultNavItems;

  const handleLogout = async () => {
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-50 bg-surface border-r border-border">
      {/* ── Brand Logo ── */}
      <div className="h-18 flex items-center px-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2 shrink-0 group">
          <img
            src="/application logo/gjanand sarkar logo.png"
            alt="Gjanand Sarkar"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-primary leading-none">
              Gjanand
            </span>
            <span className="text-xs font-semibold text-secondary leading-none mt-1">
              SARKAR
            </span>
          </div>
        </Link>
      </div>

      {/* User Greeting */}
      {user && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg flex items-center gap-2.5 bg-surface-muted border border-border">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs text-on-primary shrink-0 bg-primary overflow-hidden">
            <img 
              src={user.avatar_url || '/profile/profile.jpg'} 
              alt="Profile" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground-muted">Welcome back,</p>
            <p className="font-medium text-sm text-foreground truncate">
              {user.name?.split(' ')[0] || 'Guest'}
            </p>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        <p className="px-3 py-1.5 text-xs font-medium text-foreground-muted">
          {title || "Navigation"}
        </p>

        {navItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 group",
                active
                  ? "bg-primary-fixed text-primary font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-muted font-normal"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-foreground-muted group-hover:text-foreground")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-border flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-foreground-muted">Theme</span>
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className="min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-error hover:bg-error-bg transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
