"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  RotateCcw,
  ShieldCheck,
  Store,
  BarChart3,
  Layers,
  Leaf,
  LogOut,
  Shield,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface SellerNavItem {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  exact?: boolean;
}

interface SellerSidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  pendingReturnsCount?: number;
  pendingProductsCount?: number;
}

function SellerSidebarContent({
  activeTab,
  onSelectTab,
  pendingReturnsCount = 0,
  pendingProductsCount = 0,
}: SellerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);
  const logoutLocal = useStore((s) => s.logout);

  const navItems: SellerNavItem[] = [
    { id: 'overview', href: '/seller/dashboard', exact: true, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', href: '/seller/dashboard?tab=products', icon: Package, label: 'Products & Catalog', badge: pendingProductsCount },
    { id: 'orders', href: '/seller/orders', icon: ShoppingBag, label: 'Seller Orders' },
    { id: 'returns', href: '/seller/returns', icon: RotateCcw, label: 'Returns & Claims', badge: pendingReturnsCount },
    { id: 'quality-reports', href: '/seller/dashboard?tab=quality-reports', icon: ShieldCheck, label: 'Quality Test Reports' },
    { id: 'inventory', href: '/seller/dashboard?tab=inventory', icon: Layers, label: 'Inventory & Stock' },
    { id: 'store', href: '/seller/store', icon: Store, label: 'Store Profile' },
    { id: 'activity', href: '/seller/activity', icon: Shield, label: 'Activity Log' },
    { id: 'analytics', href: '/seller/dashboard?tab=analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const handleLogout = async () => {
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  const currentTab = searchParams.get('tab') || 'overview';

  const isItemActive = (item: SellerNavItem) => {
    if (activeTab) {
      return activeTab === item.id;
    }
    if (item.href.startsWith('/seller/dashboard?tab=')) {
      const tabParam = item.href.split('tab=')[1];
      return pathname === '/seller/dashboard' && currentTab === tabParam;
    }
    if (item.href === '/seller/dashboard') {
      return pathname === '/seller/dashboard' && (!searchParams.get('tab') || currentTab === 'overview');
    }
    return pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-50 bg-surface border-r border-border">
      {/* Brand Header */}
      <div className="h-18 flex items-center px-6 border-b border-border">
        <Link href="/seller/dashboard" className="flex items-center gap-2 shrink-0 group">
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
            <span className="text-xs font-semibold text-secondary leading-none mt-1 uppercase tracking-wider">
              Seller Hub
            </span>
          </div>
        </Link>
      </div>

      {/* Seller Greeting / Store Badge */}
      <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg flex items-center gap-2.5 bg-surface-muted border border-border">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs text-on-primary shrink-0 bg-primary overflow-hidden">
          {(sellerStore as any)?.logo_url ? (
            <img src={(sellerStore as any).logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Store className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-foreground-muted font-medium">Verified Partner</p>
          <p className="font-semibold text-xs text-foreground truncate">
            {sellerStore?.store_name || user?.name || 'Seller Store'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        <p className="px-3 py-1.5 text-xs font-medium text-foreground-muted">
          Seller Portal
        </p>

        {navItems.map((item) => {
          const isActive = isItemActive(item);
          const Icon = item.icon;

          // If on dashboard and item is a dashboard tab and onSelectTab is provided, allow fast state switch
          const handleClick = (e: React.MouseEvent) => {
            if (pathname === '/seller/dashboard' && onSelectTab && item.href.startsWith('/seller/dashboard')) {
              e.preventDefault();
              onSelectTab(item.id);
              window.history.pushState(null, '', item.href);
            }
          };

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 group cursor-pointer text-left w-full",
                isActive
                  ? "bg-primary-fixed text-primary font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-muted font-normal"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-primary" : "text-foreground-muted group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-secondary border border-secondary/20">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-foreground-muted">Theme</span>
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className="min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-error hover:bg-error-bg transition-colors w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function SellerSidebar(props: SellerSidebarProps) {
  return (
    <Suspense fallback={<aside className="hidden md:flex w-[260px] h-screen fixed top-0 left-0 bg-surface border-r border-border" />}>
      <SellerSidebarContent {...props} />
    </Suspense>
  );
}
