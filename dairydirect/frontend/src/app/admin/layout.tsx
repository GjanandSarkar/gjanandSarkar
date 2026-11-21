"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
<<<<<<< HEAD
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { Loader2 } from 'lucide-react';
=======
import { AdminRailProvider, useAdminRail } from '@/components/admin/AdminRailContext';
import { ADMIN_NAV_GROUPS } from './_nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import {
  Loader2,
  Menu,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
<<<<<<< HEAD
  const isAuthLoading = useStore(state => state.isAuthLoading);

  // Mobile Slide-In Sidebar Drawer State (Edit #40)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

=======
  const logout = useStore((state) => state.logout);
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const { isCollapsed, isMobileOpen, setIsMobileOpen, badgeCounts } = useAdminRail();

  // RBAC Guard — unchanged per rules
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/home');
    }
  }, [user, pathname, router, isAuthLoading]);

<<<<<<< HEAD
  // Close mobile sidebar on route transition
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F5] dark:bg-black text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
=======
  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>
    );
  }

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

  return (
<<<<<<< HEAD
    <div className="flex min-h-screen bg-[#F5F6F5] dark:bg-black text-foreground">
      {/* Viewport-Pinned Desktop Sidebar + Slide-in Mobile Drawer */}
      <AdminSidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden flex flex-col bg-[#F5F6F5] dark:bg-black text-foreground">
        {/* Floating Rounded Frosted Mobile Top Bar (Edit #40) */}
        <AdminMobileNav
          portalType="admin"
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <div className="w-full flex-1 flex flex-col">
=======
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Persistent / Collapsible Left Rail (240px / 68px) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 min-h-screen overflow-x-hidden flex flex-col transition-[margin] duration-200 ease-in-out',
          isCollapsed ? 'lg:ml-0' : 'lg:ml-0'
        )}
      >
        {/* Mobile Header (56px) */}
        <header className="lg:hidden h-14 bg-surface border-b border-border sticky top-0 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-[var(--radius-md)] text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs select-none shadow-xs">
                GS
              </div>
              <div>
                <h1 className="text-xs font-bold text-foreground leading-tight">Admin Console</h1>
                <p className="text-[10px] text-foreground-muted leading-none">Operations & Catalog</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface-muted text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Sheet Drawer */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw] flex flex-col justify-between">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Navigation</SheetTitle>
              <SheetDescription>Administrative console navigation drawer</SheetDescription>
            </SheetHeader>

            <div>
              <div className="h-14 flex items-center gap-3 px-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs select-none shadow-xs">
                  GS
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">Gjanand Sarkar</p>
                  <p className="text-[10px] text-foreground-muted">Administration Console</p>
                </div>
              </div>

              <nav className="p-3 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
                {ADMIN_NAV_GROUPS.map((grp) => (
                  <div key={grp.group} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                      {grp.group}
                    </div>
                    <div className="space-y-0.5">
                      {grp.items.map((item) => {
                        const isActive = isItemActive(item.href, item.exact);
                        const Icon = item.icon;
                        const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] ?? 0 : 0;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-colors',
                              isActive
                                ? 'bg-secondary text-on-secondary font-semibold shadow-xs'
                                : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted'
                            )}
                          >
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-on-secondary' : 'text-foreground-muted')} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {badgeCount > 0 && (
                              <Badge variant={isActive ? 'neutral' : 'danger'} size="sm" className="tabular">
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
            </div>

            <div className="p-3 border-t border-border">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-bg rounded-[var(--radius-md)] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Content */}
        <div className="flex-1 w-full min-w-0">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRailProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminRailProvider>
  );
}
