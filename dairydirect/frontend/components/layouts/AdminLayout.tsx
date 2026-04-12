'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, CalendarDays,
  MessageSquare, BarChart2, Settings,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/admin' },
  { icon: ShoppingBag,     label: 'Orders',        href: '/admin/orders' },
  { icon: Users,           label: 'Customers',     href: '/admin/users' },
  { icon: CalendarDays,    label: 'Subscriptions', href: '/admin/subscriptions' },
  { icon: MessageSquare,   label: 'Complaints',    href: '/admin/complaints', badge: 4 },
  { icon: BarChart2,       label: 'Analytics',     href: '/admin/forecast' },
  { icon: Settings,        label: 'Settings',      href: '/admin/settings' },
];

const S = {
  sidebar: {
    position: 'fixed' as const,
    left: 0, top: 0, bottom: 0,
    width: '240px',
    backgroundColor: '#f4f4ed',
    borderRight: '1px solid rgba(195,201,187,0.35)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 40,
    overflowY: 'auto' as const,
  },
  logoArea: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(195,201,187,0.25)',
  },
  logo: { fontSize: '18px', fontWeight: 800, color: '#3f6530', letterSpacing: '-0.5px' },
  logoSub: { fontSize: '11px', color: '#73796d', marginTop: '2px', fontWeight: 500 },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: active ? 600 : 500,
    color: active ? '#3f6530' : '#43493e',
    backgroundColor: active ? 'rgba(194,239,172,0.35)' : 'transparent',
    transition: 'all 0.15s ease',
    position: 'relative' as const,
  }),
  badge: {
    marginLeft: 'auto',
    backgroundColor: '#ba1a1a',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '9999px',
  },
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafaf3' }}>
      {/* Sidebar — hidden on mobile */}
      <aside style={S.sidebar} className="hidden-mobile-sidebar">
        <div style={S.logoArea}>
          <div style={S.logo}>DairyDirect</div>
          <div style={S.logoSub}>Admin Panel</div>
        </div>
        <nav style={S.nav}>
          {navItems.map(({ icon: Icon, label, href, badge }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={S.navItem(active)}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
                {badge && <span style={S.badge}>{badge}</span>}
              </Link>
            );
          })}
        </nav>
        {/* Admin avatar */}
        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid rgba(195,201,187,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#c2efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#3f6530',
            }}>A</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1c18' }}>Admin</div>
              <div style={{ fontSize: '11px', color: '#73796d' }}>Operations</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 32px',
          background: 'rgba(250,250,243,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(195,201,187,0.3)',
        }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1a1c18' }}>
            {navItems.find(n => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#e8e9e2', padding: '8px 14px', borderRadius: '10px',
              fontSize: '13px', color: '#43493e',
            }}>
              <span>🔍</span>
              <span>Search...</span>
            </div>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#c2efac', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#3f6530',
            }}>A</div>
          </div>
        </header>
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile-sidebar { display: none !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
