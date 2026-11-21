'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  Bell, 
  Loader2, 
  ExternalLink,
  Circle
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FRANCHISE_NAV } from './_nav';
import { getSellerDashboard } from '@/lib/api/sellers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';

export default function FranchiseLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);
  const isAuthLoading = useStore((s) => s.isAuthLoading);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthData, setHealthData] = useState<{
    pendingOrders: number;
    todayRevenue: number;
    status: string;
  }>({
    pendingOrders: 0,
    todayRevenue: 0,
    status: 'online',
  });

  // Auth Guard: redirect unauthenticated or non-seller users
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace('/login?redirect=/seller/dashboard');
      return;
    }
    if (user.role !== 'seller' && user.role !== 'admin') {
      router.replace('/home');
    }
  }, [user, isAuthLoading, router]);

  // Load store summary for health card
  useEffect(() => {
    if (!user?.id) return;
    let isCancelled = false;

    getSellerDashboard(user.id)
      .then((data) => {
        if (isCancelled || !data) return;
        setHealthData({
          pendingOrders: data.metrics?.pendingDeliveries ?? 0,
          todayRevenue: data.metrics?.grossRevenue ?? 0,
          status: data.store?.status ?? 'active',
        });
        if (data.store && !sellerStore) {
          useStore.getState().setSellerStore(data.store as any);
        }
      })
      .catch((err) => {
        console.error('Failed to load seller health summary:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [user?.id, sellerStore]);

  // Close mobile sheet on navigation
  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  if (isAuthLoading || !user || (user.role !== 'seller' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  const storeName = sellerStore?.store_name || user.name || 'Store Console';
  const storeId = sellerStore?.id ? sellerStore.id.slice(0, 6).toUpperCase() : 'MAIN';
  const monogram = storeName.slice(0, 2).toUpperCase();

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs">
            {monogram}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate leading-tight">
              {storeName}
            </p>
            <p className="text-[10px] text-foreground-muted font-medium tracking-wide tabular">
              Store #{storeId}
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1" aria-label="Franchise Navigation">
          {FRANCHISE_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  'w-full h-11 px-3 rounded-[var(--radius-md)] flex items-center gap-3 text-[14px] font-medium transition-colors text-left cursor-pointer',
                  isActive
                    ? 'bg-secondary text-on-secondary font-semibold shadow-xs'
                    : 'text-foreground hover:bg-surface-muted'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-on-secondary' : 'text-foreground-muted')} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === '/seller/orders' && healthData.pendingOrders > 0 && (
                  <Badge 
                    variant={isActive ? 'neutral' : 'warning'} 
                    size="sm"
                    className="tabular"
                  >
                    {healthData.pendingOrders}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Health & Switcher Card */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Store Health Strip */}
        <div className="p-3 rounded-[var(--radius-md)] bg-surface-muted/60 border border-border text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground-muted">Store Health</span>
            <div className="flex items-center gap-1.5">
              <Circle className={cn(
                'w-2 h-2 fill-current',
                healthData.status === 'suspended' ? 'text-danger' : 'text-success'
              )} />
              <span className="text-[10px] font-medium capitalize text-foreground-muted">
                {healthData.status === 'suspended' ? 'Suspended' : 'Online'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-foreground">
            <span className="text-foreground-muted text-[11px]">Action needed:</span>
            <span className="font-semibold tabular text-[11px]">
              {healthData.pendingOrders} {healthData.pendingOrders === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <div className="flex items-center justify-between text-foreground">
            <span className="text-foreground-muted text-[11px]">Revenue:</span>
            <span className="font-bold tabular text-brand-ink text-[11px]">
              ₹{healthData.todayRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Quick link back to Customer storefront */}
        <Link
          href="/home"
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-[var(--radius-sm)] transition-colors"
        >
          <span>Customer Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Desktop Fixed Left Rail (240px) */}
      <aside className="hidden lg:flex w-[240px] flex-col shrink-0 h-dvh sticky top-0 bg-surface border-r border-border z-30">
        {renderNavContent()}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar (56px) */}
        <header className="lg:hidden h-14 bg-surface border-b border-border sticky top-0 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-foreground hover:bg-surface-muted rounded-[var(--radius-sm)] cursor-pointer"
              aria-label="Open task console navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-secondary text-on-secondary flex items-center justify-center font-bold text-[10px]">
                {monogram}
              </div>
              <span className="font-bold text-sm text-foreground truncate max-w-[180px]">
                {storeName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavClick('/seller/dashboard?tab=notifications')}
              className="p-2 text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-[var(--radius-sm)] relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-over Sheet Navigation */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw] flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Franchise Console Navigation</SheetTitle>
              <SheetDescription>Store operations navigation menu</SheetDescription>
            </SheetHeader>
            {renderNavContent()}
          </SheetContent>
        </Sheet>

        {/* Page Content */}
        <main className="flex-1 w-full mx-auto max-w-[var(--w-franchise)] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
