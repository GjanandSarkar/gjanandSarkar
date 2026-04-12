'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ReceiptText, CalendarDays, UserCircle, Bell, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/lib/context';

const navItems = [
  { icon: Home,         label: 'Home',      href: '/' },
  { icon: ShoppingBag,  label: 'Products',   href: '/store' },
  { icon: ReceiptText,  label: 'Orders',     href: '/orders' },
  { icon: CalendarDays, label: 'Subscribe',  href: '/subscription' },
  { icon: UserCircle,   label: 'Profile',    href: '/profile' },
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { cart } = useAppContext();
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100svh', backgroundColor: '#fafaf3' }}>
      
      {/* 
        DESKTOP SIDEBAR 
        Visible only on >= 768px
      */}
      <aside className="desktop-sidebar" style={{
        width: '240px',
        backgroundColor: '#f4f4ed',
        borderRight: '1px solid rgba(195,201,187,0.3)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
      }}>
        <div style={{ padding: '24px 20px 32px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#3f6530', letterSpacing: '-0.5px' }}>DairyDirect</span>
        </div>
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px',
                backgroundColor: active ? 'rgba(194,239,172,0.45)' : 'transparent',
                color: active ? '#3f6530' : '#43493e',
                textDecoration: 'none', fontWeight: active ? 600 : 500,
                transition: 'all 0.15s ease',
              }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span style={{ fontSize: '15px' }}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 
        MAIN CONTENT CONTAINER 
      */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* DESKTOP HEADER */}
        <header className="desktop-header" style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(250,250,243,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(195,201,187,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 32px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1c18' }}>
            {navItems.find(n => n.href === pathname)?.label || 'DairyDirect'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Bell size={22} color="#43493e" />
            </button>
            <Link href="/cart" style={{ position: 'relative', display: 'block' }}>
              <ShoppingCart size={22} color="#3f6530" />
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  backgroundColor: '#8a5025', color: '#fff', fontSize: '10px', fontWeight: 700,
                  minWidth: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{totalItems}</span>
              )}
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <main className="content-area" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* 
        MOBILE BOTTOM NAV 
        Visible only on < 768px
      */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 8px 20px',
        background: 'rgba(250,250,243,0.92)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(195,201,187,0.3)',
        zIndex: 50,
      }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '8px 12px', borderRadius: '14px',
              backgroundColor: active ? 'rgba(194,239,172,0.45)' : 'transparent',
              color: active ? '#3f6530' : '#73796d',
              textDecoration: 'none', transition: 'all 0.15s ease', minWidth: '56px',
            }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 500, letterSpacing: '0.02em' }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        /* Mobile by default */
        .desktop-sidebar { display: none !important; }
        .desktop-header { display: none !important; }
        .mobile-bottom-nav { display: flex !important; }
        .content-area { padding-bottom: 80px; }
        
        /* Desktop override */
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-header { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
          .main-content { margin-left: 240px; }
          .content-area { padding-bottom: 0px; max-width: 1080px; margin: 0 auto; width: 100%; }
        }
      `}</style>
    </div>
  );
}
