"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Loader2,
  Menu,
  X,
  LayoutDashboard,
  Store,
  Building2,
  ShieldCheck,
  Package,
  Tags,
  ShoppingBag,
  RotateCcw,
  CalendarDays,
  Users,
  Truck,
  BarChart3,
  Leaf,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const mobileNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products', exact: true },
  { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/admin/subscriptions', icon: CalendarDays, label: 'Subscriptions' },
  { href: '/admin/sellers', icon: Store, label: 'Sellers' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/delivery', icon: Truck, label: 'Deliveries' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/returns', icon: RotateCcw, label: 'Returns' },
  { href: '/home', icon: Leaf, label: 'Visit Storefront' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const logout = useStore(state => state.logout);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isAuthLoading = useStore(state => state.isAuthLoading);

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

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-150">
      <AdminSidebar />
      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden flex flex-col">
        {/* Mobile Header with Hamburger Drawer */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border z-40 sticky top-0 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-xl bg-surface-muted border border-border text-foreground hover:bg-surface-elevated transition-colors"
              aria-label="Open operations menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-foreground-inverse">
                <span className="font-black text-xs">GS</span>
              </div>
              <div>
                <h1 className="font-black text-xs text-foreground leading-tight">Admin Console</h1>
                <p className="text-[10px] text-muted leading-none">Operations & Orders</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Staff spend whole shifts in here, so the theme choice has to be
                reachable from the admin shell itself, not only the storefront. */}
            <ThemeToggle />
            <Link
              href="/home"
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-foreground-inverse transition-colors"
            >
              Storefront →
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-xs md:hidden"
                onClick={() => setIsMobileNavOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="fixed top-0 bottom-0 left-0 w-72 bg-surface border-r border-border z-[90] p-4 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto"
              >
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-border mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
                        GS
                      </div>
                      <span className="font-black text-sm text-foreground">Operations Hub</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen(false)}
                      className="p-1 rounded-lg text-muted hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {mobileNavItems.map((item) => {
                      const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-primary text-foreground-inverse shadow-2xs'
                              : 'text-muted hover:bg-surface-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.replace('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-error hover:bg-error-bg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="max-w-[1400px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
