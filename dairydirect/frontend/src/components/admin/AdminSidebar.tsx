"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Truck, LogOut, Leaf, ShieldCheck, Bell, Settings, Tags, CalendarDays, User, Building2, Store, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/sellers', icon: Store, label: 'Sellers' },
  { href: '/admin/vendor-inquiries', icon: Building2, label: 'Seller Applications' },
  { href: '/admin/products/approvals', icon: ShieldCheck, label: 'Product Approvals' },
  { href: '/admin/products', icon: Package, label: 'Products', exact: true },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders', exact: true },
  { href: '/admin/seller-orders', icon: Store, label: 'All Seller Orders List' },
  { href: '/admin/returns', icon: RotateCcw, label: 'Returns & Cancellations' },
  { href: '/admin/subscriptions', icon: CalendarDays, label: 'Subscriptions' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/delivery', icon: Truck, label: 'Deliveries' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/coupons', icon: Package, label: 'Coupons' },
  { href: '/admin/audit-log', icon: ShieldCheck, label: 'Audit Log' },
  { href: '/home', icon: Leaf, label: 'Visit Storefront' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useStore(state => state.logout);
  const user = useStore(state => state.user);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    if (item.href === '/admin/products' && pathname.startsWith('/admin/products/approvals')) {
      return false;
    }
    if (item.href === '/admin/orders' && pathname.startsWith('/admin/seller-orders')) {
      return false;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-50 bg-surface border-r border-border">
      {/* ── Brand Logo ── */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/home" className="flex items-center gap-2.5 shrink-0 group active:scale-95 transition-transform">
          <img
            src="/application logo/gjanand sarkar logo.png"
            alt="Gjanand Sarkar"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none text-foreground">
              Gjanand
            </span>
            <span className="text-[10px] tracking-[0.2em] font-black text-secondary uppercase leading-none mt-0.5">
              SARKAR
            </span>
          </div>
        </Link>
      </div>

      {/* Admin user chip */}
      <div className="mx-3 my-3 p-3 rounded-xl bg-surface-muted/60 border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 bg-primary overflow-hidden">
          <img
            src={user?.avatar_url || '/profile/profile.jpg'}
            alt="Profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Admin Console</p>
          <p className="font-bold text-xs text-foreground truncate">
            {user?.name || 'Administrator'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
          Platform Operations
        </p>

        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                active 
                  ? 'bg-primary-fixed text-primary font-bold shadow-2xs' 
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
