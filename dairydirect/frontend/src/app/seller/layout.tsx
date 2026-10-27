"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import Link from 'next/link';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const sellerStore = useStore((state) => state.sellerStore);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthLoading = useStore((state) => state.isAuthLoading);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Only sellers and admins can access the seller hub
    if (user.role !== 'seller' && user.role !== 'admin') {
      router.replace('/become-seller');
    }
  }, [user, pathname, router, isAuthLoading]);

  if (isAuthLoading || !user || (user.role !== 'seller' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const storeName = sellerStore?.store_name || user?.name || 'Seller Store';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface-container-low)' }}>
      <Suspense fallback={<aside className="hidden md:flex w-[260px] h-screen fixed top-0 left-0 bg-surface border-r border-border" />}>
        <SellerSidebar />
      </Suspense>

      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden flex flex-col">
        {/* Mobile Header matching Admin layout */}
        <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary">
              <span className="font-bold text-xs">GS</span>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none text-foreground">Seller Hub</h1>
              <p className="text-[10px] text-foreground-muted mt-0.5 truncate max-w-[160px]">{storeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Quick Navigation Bar */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 bg-surface border-b border-border">
          <Link
            href="/seller/dashboard"
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              pathname === '/seller/dashboard'
                ? 'bg-primary text-on-primary'
                : 'text-foreground-muted hover:bg-surface-muted'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/seller/dashboard?tab=products"
            className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg text-foreground-muted hover:bg-surface-muted transition-colors"
          >
            Products
          </Link>
          <Link
            href="/seller/orders"
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              pathname === '/seller/orders'
                ? 'bg-primary text-on-primary'
                : 'text-foreground-muted hover:bg-surface-muted'
            }`}
          >
            Orders
          </Link>
          <Link
            href="/seller/returns"
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              pathname === '/seller/returns'
                ? 'bg-primary text-on-primary'
                : 'text-foreground-muted hover:bg-surface-muted'
            }`}
          >
            Returns
          </Link>
          <Link
            href="/seller/dashboard?tab=quality-reports"
            className="px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg text-foreground-muted hover:bg-surface-muted transition-colors"
          >
            Quality
          </Link>
          <Link
            href="/seller/store"
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              pathname === '/seller/store'
                ? 'bg-primary text-on-primary'
                : 'text-foreground-muted hover:bg-surface-muted'
            }`}
          >
            Store Profile
          </Link>
          <Link
            href="/seller/activity"
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors ${
              pathname === '/seller/activity'
                ? 'bg-primary text-on-primary'
                : 'text-foreground-muted hover:bg-surface-muted'
            }`}
          >
            Activity
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
