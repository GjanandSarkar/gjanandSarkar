"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Grid3x3, Receipt, User, LogOut, LucideIcon, 
  MoreVertical, SunMoon, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

export interface SidebarItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  section?: string;
}

export interface SidebarProps {
  items?: SidebarItem[];
  title?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ items, title, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const logoutLocal = useStore(state => state.logout);
  const user = useStore(state => state.user);
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const defaultNavItems: SidebarItem[] = [
    { href: '/home', icon: Home, label: t('navHome') },
    { href: '/products', icon: Grid3x3, label: t('navProducts') },
    { href: '/orders', icon: Receipt, label: t('navOrders') },
    { href: '/profile', icon: User, label: t('navProfile') },
  ];

  const navItems = items || defaultNavItems;

  const handleLogout = async () => {
    setIsMenuOpen(false);
    onCloseMobile?.();
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

<<<<<<< HEAD
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

  // Reusable Navigation Content
  const renderNavContent = (isMobile = false) => (
    <>
      {/* ── Brand Logo & Header ── */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link 
          href="/admin" 
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
            <span className="text-[10px] font-semibold text-secondary-ink tracking-wider leading-none mt-0.5">
              SARKAR
            </span>
=======
      {/* ── Brand Logo ── */}
      <div className="h-[72px] flex items-center px-6 relative z-10">
        <Link href="/home" className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform">
          <div className="relative flex items-center">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt="Gjanand Sarkar"
              className="h-12 md:h-14 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tight leading-none text-foreground">
                <span className="text-primary">Gjanand</span>
              </span>
              <span className="text-[10px] md:text-[11px] tracking-[0.2em] font-bold text-muted-foreground uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </Link>

        {/* Right Header Actions: Close Button on Mobile, Browser History Buttons on Desktop */}
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

<<<<<<< HEAD
      {/* ── Nav Items with clearance padding so items scroll behind floating profile ── */}
      <nav className="flex-1 px-3 py-3 pb-24 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
        {navItems.map((item, idx) => {
          const active = isItemActive(item);
=======
      {/* User Greeting */}
      {user && (
        <div className="mx-4 mb-2 px-4 py-3 rounded-[14px] flex items-center gap-3"
          style={{ background: 'var(--color-surface-container-low)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 bg-primary border border-primary/10 relative overflow-hidden">
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
            <p className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-on-surface-variant)' }}>Good morning</p>
            <p className="font-bold text-[15px] leading-tight mt-0.5 truncate"
              style={{ color: 'var(--color-on-surface)' }}>
              {user.name?.split(' ')[0] || 'Guest'}
            </p>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'var(--color-on-surface-variant)' }}>Navigation</p>

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          const Icon = item.icon;
          const showSection = item.section && (idx === 0 || navItems[idx - 1].section !== item.section);

          return (
            <React.Fragment key={item.href}>
              {showSection && (
                <div className="pt-2 pb-1">
                  {idx > 0 && (
                    <div className="h-px bg-border/60 mx-1 mb-2.5" />
                  )}
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted/70">
                    {item.section}
                  </div>
                </div>
              )}
              <Link
                href={item.href}
                onClick={() => isMobile && onCloseMobile?.()}
                className={cn(
                  "min-h-[42px] flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group",
                  active
                    ? "bg-primary-fixed text-primary font-bold shadow-xs"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    active ? "text-primary" : "text-foreground-muted group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
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
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-bold text-foreground truncate">
                    {user.name || 'Admin'}
                  </p>
                  <p className="text-[11px] text-foreground-muted truncate">
                    {user.email || 'administrator'}
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
              <p className="font-semibold text-[13px] text-foreground truncate leading-tight">
                {user.name?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-[11px] text-foreground-muted truncate capitalize leading-tight mt-0.5">
                {user.role || 'Admin'}
              </p>
            </div>
            <div className="p-1 rounded-md text-foreground-muted hover:text-foreground">
              <MoreVertical className="w-4 h-4" />
            </div>
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
