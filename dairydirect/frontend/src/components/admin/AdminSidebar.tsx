'use client';

import React from 'react';
<<<<<<< HEAD
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Truck, ShieldCheck, Tags, Building2, Store, RotateCcw,
  Megaphone, Boxes, Ticket, History, Settings, ShieldAlert
} from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/shared/Sidebar';

const adminNavItems: SidebarItem[] = [
  // ── Overview ──
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, section: 'Overview' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },

  // ── Operations & Orders ──
  { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders', exact: true, section: 'Operations' },
  { href: '/admin/seller-orders', icon: Store, label: 'All Seller Orders' },
  { href: '/admin/delivery', icon: Truck, label: 'Deliveries' },
  { href: '/admin/returns', icon: RotateCcw, label: 'Returns & Refunds' },

  // ── Catalog & Stock ──
  { href: '/admin/products', icon: Package, label: 'Products', exact: true, section: 'Catalog & Stock' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventory & Stock' },
  { href: '/admin/products/approvals', icon: ShieldCheck, label: 'Product Approvals' },

  // ── Sellers & Vendors ──
  { href: '/admin/sellers', icon: Store, label: 'Sellers', section: 'Sellers' },
  { href: '/admin/vendor-inquiries', icon: Building2, label: 'Seller Inquiries' },
  { href: '/admin/quality-reports', icon: ShieldAlert, label: 'Quality Reports' },

  // ── Customers & Marketing ──
  { href: '/admin/customers', icon: Users, label: 'Customers', section: 'Customers & Growth' },
  { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/admin/campaigns', icon: Megaphone, label: 'Ad Campaigns' },

  // ── System & Audit ──
  { href: '/admin/audit', icon: History, label: 'Audit Log', section: 'System' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}
=======
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  LogOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ADMIN_NAV_GROUPS } from '@/app/admin/_nav';
import { useAdminRail } from './AdminRailContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const { isCollapsed, toggleRail, badgeCounts } = useAdminRail();

  const handleLogout = async () => {
    try {
      const { logout: apiLogout } = await import('@/lib/api/auth');
      await apiLogout();
    } catch {}
    logout();
    router.replace('/login');
  };

  const isItemActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === '/admin/products' && pathname.startsWith('/admin/products/approvals')) return false;
    if (href === '/admin/orders' && pathname.startsWith('/admin/seller-orders')) return false;
    return pathname.startsWith(href);
  };
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

export function AdminSidebar({ isOpenMobile, onCloseMobile }: AdminSidebarProps = {}) {
  return (
<<<<<<< HEAD
    <Sidebar
      items={adminNavItems}
      title="Admin Portal"
      isOpenMobile={isOpenMobile}
      onCloseMobile={onCloseMobile}
    />
=======
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 h-dvh sticky top-0 bg-surface border-r border-border z-30 transition-[width] duration-200 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* ─── Rail Header ─── */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-border shrink-0">
        <Link 
          href="/admin" 
          className="flex items-center gap-2.5 min-w-0"
          title="Admin Dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs">
            GS
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 truncate">
              <span className="text-xs font-black tracking-tight text-foreground block truncate leading-tight">
                Gjanand Sarkar
              </span>
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">
                Ops Console
              </span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={toggleRail}
          className="p-1.5 rounded-[var(--radius-sm)] text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Navigation Groups ─── */}
      <nav 
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 no-scrollbar"
        aria-label="Admin Navigation Rail"
      >
        {ADMIN_NAV_GROUPS.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted select-none">
                {grp.group}
              </div>
            ) : (
              <div className="my-2 border-t border-border/60 mx-1.5" />
            )}

            <div className="space-y-0.5">
              {grp.items.map((item) => {
                const isActive = isItemActive(item.href, item.exact);
                const Icon = item.icon;
                const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] ?? 0 : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors relative select-none',
                      isCollapsed ? 'h-10 justify-center px-0' : 'h-9 px-2.5',
                      isActive
                        ? 'bg-secondary/10 text-secondary font-semibold border-l-[3px] border-secondary'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted',
                      isActive && !isCollapsed && 'pl-[7px]'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!isCollapsed && badgeCount > 0 && (
                      <Badge variant="danger" size="sm" className="tabular ml-auto">
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bottom Actions & User Profile ─── */}
      <div className="p-2.5 border-t border-border space-y-2 shrink-0">
        {/* Quick link to Storefront */}
        <Link
          href="/home"
          title={isCollapsed ? 'Visit Storefront' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-sm)] text-xs text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors',
            isCollapsed ? 'h-9 justify-center' : 'px-2.5 py-1.5'
          )}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="truncate">Storefront</span>}
        </Link>

        {/* User Card & Logout */}
        <div
          className={cn(
            'flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] bg-surface-muted/60 border border-border',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-surface-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={user?.avatar_url || '/profile/profile.jpg'}
                alt={user?.name || 'Admin'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-foreground-muted truncate capitalize">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1 text-foreground-muted hover:text-danger rounded-[var(--radius-sm)] transition-colors cursor-pointer shrink-0"
            title="Log Out"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
  );
}
