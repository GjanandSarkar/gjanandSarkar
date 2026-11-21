"use client";

import React, { Suspense, useState, useRef, useEffect } from 'react';
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
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SunMoon,
  LucideIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export interface SellerNavItem {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  section: string;
  badge?: number;
  exact?: boolean;
}

export interface SellerSidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
  pendingReturnsCount?: number;
  pendingProductsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

function SellerSidebarContent({
  activeTab,
  onSelectTab,
  pendingReturnsCount = 0,
  pendingProductsCount = 0,
  isOpenMobile,
  onCloseMobile,
}: SellerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);
  const logoutLocal = useStore((s) => s.logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems: SellerNavItem[] = [
    // ── Overview ──
    { id: 'overview', href: '/seller/dashboard', exact: true, icon: LayoutDashboard, label: 'Dashboard', section: 'Overview' },
    
    // ── Catalog & Inventory ──
    { id: 'products', href: '/seller/dashboard?tab=products', icon: Package, label: 'Products & Catalog', section: 'Catalog & Inventory', badge: pendingProductsCount },
    { id: 'inventory', href: '/seller/dashboard?tab=inventory', icon: Layers, label: 'Inventory & Stock', section: 'Catalog & Inventory' },
    { id: 'quality-reports', href: '/seller/dashboard?tab=quality-reports', icon: ShieldCheck, label: 'Quality Test Reports', section: 'Catalog & Inventory' },
    
    // ── Orders & Delivery ──
    { id: 'orders', href: '/seller/orders', icon: ShoppingBag, label: 'Seller Orders', section: 'Orders & Delivery' },
    { id: 'returns', href: '/seller/returns', icon: RotateCcw, label: 'Returns & Claims', section: 'Orders & Delivery', badge: pendingReturnsCount },
    
    // ── Store Management ──
    { id: 'analytics', href: '/seller/dashboard?tab=analytics', icon: BarChart3, label: 'Analytics', section: 'Store Management' },
    { id: 'store', href: '/seller/store', icon: Store, label: 'Store Profile', section: 'Store Management' },
    { id: 'activity', href: '/seller/activity', icon: Shield, label: 'Activity Log', section: 'Store Management' },
  ];

  const handleLogout = async () => {
    setIsMenuOpen(false);
    onCloseMobile?.();
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

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const storeName = sellerStore?.store_name || user?.name || 'Seller Store';

  const renderNavContent = (isMobile = false) => (
    <>
      {/* ── Brand Header with Browser History Buttons (Desktop) or Close Button (Mobile) ── */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link 
          href="/seller/dashboard" 
          onClick={() => isMobile && onCloseMobile?.()}
          className="flex items-center gap-2 shrink-0 group"
        >
          <img
            src="/application logo/gjanand sarkar logo.png"
            alt="Gjanand Sarkar"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-primary leading-none">
              Gjanand
            </span>
            <span className="text-[10px] font-semibold text-secondary-ink tracking-wider leading-none mt-0.5 uppercase">
              SELLER HUB
            </span>
          </div>
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            title="Close menu"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-surface-muted/70 border border-border/80">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.history.back();
              }}
              title="Go back"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.history.forward();
              }}
              title="Go forward"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation Links with clearance padding for floating profile card ── */}
      <nav className="flex-1 px-3 py-3 pb-24 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
        {navItems.map((item, idx) => {
          const isActive = isItemActive(item);
          const Icon = item.icon;
          const showSection = item.section && (idx === 0 || navItems[idx - 1].section !== item.section);

          const handleClick = (e: React.MouseEvent) => {
            if (isMobile) {
              onCloseMobile?.();
            }
            if (pathname === '/seller/dashboard' && onSelectTab && item.href.startsWith('/seller/dashboard')) {
              e.preventDefault();
              onSelectTab(item.id);
              window.history.pushState(null, '', item.href);
            }
          };

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="pt-2 pb-1">
                  {idx > 0 && <div className="h-px bg-border/60 mx-1 mb-2.5" />}
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted/70">
                    {item.section}
                  </div>
                </div>
              )}

              <Link
                href={item.href}
                onClick={handleClick}
                className={cn(
                  "min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group cursor-pointer text-left w-full",
                  isActive
                    ? "bg-primary-fixed text-primary font-bold shadow-xs"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-muted font-normal"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-foreground-muted group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── Floating User Profile Card over Sidebar Nav (Theme & Logout) ── */}
      {user && (
        <div ref={menuRef} className="absolute bottom-3 left-3 right-3 z-30 pointer-events-auto">
          {/* Frosted Glass Dropdown Menu (Opens Upwards) */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute bottom-[calc(100%+8px)] left-0 right-0 rounded-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-2xl bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 shadow-[0_12px_36px_rgba(0,0,0,0.14)]"
              >
                {/* Store & User Info Header */}
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-bold text-foreground truncate">
                    {storeName}
                  </p>
                  <p className="text-[11px] text-foreground-muted truncate">
                    {user.email || 'seller.partner@gjanand'}
                  </p>
                </div>

                {/* Theme Switch Row */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <SunMoon className="w-4 h-4 text-foreground-muted" />
                    <span className="text-xs font-semibold text-foreground">Theme</span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error-bg/70 transition-colors w-full text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-error" />
                  <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Pure White User Card Trigger with crisp contrast (Edit #32) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-label="User account menu"
            className={cn(
              "w-full px-3 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all text-left cursor-pointer border",
              "shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-md",
              isMenuOpen
                ? "bg-white dark:bg-[#18181b] border-primary/50 ring-2 ring-primary/20 text-foreground"
                : "bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-[#18181b] border-zinc-200/90 dark:border-zinc-800 text-foreground"
            )}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs text-on-primary shrink-0 bg-primary overflow-hidden shadow-xs ring-1 ring-border/50">
              {(sellerStore as any)?.logo_url ? (
                <img src={(sellerStore as any).logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate leading-tight">
                {storeName}
              </p>
              <p className="text-[11px] text-foreground-muted truncate capitalize leading-tight mt-0.5">
                Verified Seller Partner
              </p>
            </div>
            <MoreVertical className="w-4 h-4 text-foreground-muted shrink-0" />
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Desktop Viewport-Pinned Sidebar (Edit #35) ── */}
      <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-40 bg-surface border-r border-border select-none">
        {renderNavContent(false)}
      </aside>

      {/* ── Mobile Slide-In Sidebar Drawer (Edit #40) ── */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-in Drawer from Left */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 27, stiffness: 280 }}
              className="relative w-[280px] max-w-[85vw] h-full bg-surface dark:bg-[#0a0a0a] border-r border-border shadow-2xl flex flex-col select-none z-10"
            >
              {renderNavContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SellerSidebar(props: SellerSidebarProps) {
  return (
    <Suspense fallback={<aside className="hidden md:flex w-[260px] h-screen fixed top-0 left-0 bg-surface border-r border-border" />}>
      <SellerSidebarContent {...props} />
    </Suspense>
  );
}
