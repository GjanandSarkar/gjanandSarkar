"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Truck, LogOut, Leaf, ShieldCheck, Bell, Settings, Tags, CalendarDays, User, Building2, Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/sellers', icon: Store, label: 'Sellers' },
  { href: '/admin/vendor-inquiries', icon: Building2, label: 'Seller Inquiries' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/subscriptions', icon: CalendarDays, label: 'Subscriptions' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
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
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed top-0 left-0 z-50"
      style={{ background: 'var(--color-surface-container-lowest)' }}>

      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-48 opacity-10 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #3f6530 0%, transparent 100%)' }} />

      {/* ── Brand Logo ── */}
      <div className="px-6 py-5 relative z-10">
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
              <span className="text-xl md:text-2xl font-black tracking-tight leading-none">
                <span className="text-[#0f3e26]">Gjanand</span>
              </span>
              <span className="text-[10px] md:text-[11px] tracking-[0.2em] font-black text-[#c88a23] uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Admin user chip */}
      <div className="mx-4 mb-3 px-3.5 py-3 rounded-[12px] flex items-center gap-3"
        style={{ background: 'var(--color-surface-container-low)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 bg-[#0f3e26] border border-[#0f3e26]/10 relative overflow-hidden">
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Signed in as</p>
          <p className="font-extrabold text-[13px] text-gray-900 truncate">
            {user?.name || 'Admin'}
          </p>
          <p className="text-[10px] font-medium text-gray-500 truncate mt-0.5">
            {user?.phone ? `+91 ${user.phone}` : (user?.email || 'Administrator')}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: 'var(--color-outline)' }}>Management</p>

        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] transition-all duration-200 relative"
              style={active ? {
                background: 'linear-gradient(135deg, #eaf4e2, #ddf2d0)',
                color: 'var(--color-primary)',
                fontWeight: 700,
              } : {
                color: 'var(--color-on-surface-variant)',
                fontWeight: 500,
              }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ background: 'var(--color-primary)' }} />
              )}
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={active ? {
                  background: 'var(--color-primary-fixed)',
                  color: 'var(--color-primary)',
                } : {}}>
                <Icon className="w-[17px] h-[17px]" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[14px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 pb-5">
        <div className="h-px mb-3 opacity-30" style={{ background: 'var(--color-outline-variant)' }} />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] w-full transition-all duration-200 hover:bg-red-50 group"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut className="w-[17px] h-[17px]" strokeWidth={2} />
          </div>
          <span className="text-[14px] font-medium group-hover:text-red-600">Logout</span>
        </button>
      </div>
    </aside>
  );
}
