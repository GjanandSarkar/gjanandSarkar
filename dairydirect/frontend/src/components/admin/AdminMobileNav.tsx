"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ArrowRight, ChevronRight, User as UserIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface AdminMobileNavProps {
  portalType?: 'admin' | 'seller';
  onOpenSidebar: () => void;
  titleOverride?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/orders': 'Admin Orders',
  '/admin/seller-orders': 'Seller Orders',
  '/admin/delivery': 'Deliveries',
  '/admin/returns': 'Returns & Refunds',
  '/admin/products': 'Products & Catalog',
  '/admin/categories': 'Categories',
  '/admin/inventory': 'Inventory & Stock',
  '/admin/products/approvals': 'Product Approvals',
  '/admin/sellers': 'Sellers',
  '/admin/vendor-inquiries': 'Seller Inquiries',
  '/admin/quality-reports': 'Quality Reports',
  '/admin/customers': 'Customers',
  '/admin/coupons': 'Coupons',
  '/admin/campaigns': 'Campaigns',
  '/admin/audit': 'Audit Log',
  '/admin/settings': 'Settings',
  '/seller/dashboard': 'Seller Dashboard',
  '/seller/orders': 'Seller Orders',
  '/seller/returns': 'Returns & Claims',
  '/seller/store': 'Store Profile',
  '/seller/activity': 'Activity Log',
};

export function AdminMobileNav({
  portalType = 'admin',
  onOpenSidebar,
  titleOverride,
}: AdminMobileNavProps) {
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);

  // Derive active screen title from path or override
  let screenTitle = titleOverride;
  if (!screenTitle) {
    if (ROUTE_TITLES[pathname]) {
      screenTitle = ROUTE_TITLES[pathname];
    } else {
      // Find matching prefix or fallback
      const match = Object.keys(ROUTE_TITLES).find((k) => pathname.startsWith(k) && k !== '/admin' && k !== '/seller/dashboard');
      if (match) {
        screenTitle = ROUTE_TITLES[match];
      } else {
        screenTitle = portalType === 'seller' ? 'Seller Hub' : 'Admin Portal';
      }
    }
  }

  const portalLabel = portalType === 'seller' 
    ? (sellerStore?.store_name || 'Seller Hub') 
    : 'Admin Operations';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Seller';

  return (
    <header className="md:hidden fixed top-3 left-3.5 right-3.5 z-40 px-3.5 py-2.5 rounded-2xl bg-surface/85 dark:bg-[#121212]/85 backdrop-blur-md border border-border/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 select-none transition-all">
      {/* Left: Button to slide open sidebar drawer from left to right */}
      <button
        type="button"
        onClick={onOpenSidebar}
        title="Open Navigation Menu"
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-muted/90 hover:bg-surface border border-border/80 text-foreground transition-all active:scale-95 cursor-pointer shrink-0"
      >
        <Menu className="w-4 h-4 text-primary" strokeWidth={2.2} />
      </button>

      {/* Center: Left-aligned screen name and portal label */}
      <div className="flex-1 flex flex-col min-w-0 px-1">
        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider leading-tight truncate">
          {portalLabel}
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[14px] font-bold text-foreground tracking-tight truncate leading-snug">
            {screenTitle}
          </span>
          <ChevronRight className="w-3 h-3 text-foreground-muted/60 shrink-0" />
        </div>
      </div>

      {/* Right: User Avatar - also clickable to reveal the sidebar drawer */}
      <button
        type="button"
        onClick={onOpenSidebar}
        title={`Logged in as ${user?.name || roleLabel}. Click to open menu.`}
        className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-surface-muted/60 transition-all cursor-pointer shrink-0 active:scale-95 group"
      >
        <div className="hidden xs:flex flex-col text-right">
          <span className="text-[11px] font-bold text-foreground leading-tight truncate max-w-[80px]">
            {user?.name?.split(' ')[0] || roleLabel}
          </span>
          <span className="text-[9px] font-medium text-foreground-muted leading-none">
            {roleLabel}
          </span>
        </div>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs group-hover:scale-105 transition-transform">
            {userInitial}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
        </div>
      </button>
    </header>
  );
}
