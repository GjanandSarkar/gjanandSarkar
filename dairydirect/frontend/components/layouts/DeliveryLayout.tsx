'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, CheckSquare2 } from 'lucide-react';

const navItems = [
  { icon: ClipboardList, label: 'Tasks',    href: '/delivery' },
  { icon: CheckSquare2,  label: 'Complete', href: '/delivery/complete' },
];

export function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/delivery';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf3', paddingBottom: '72px' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'rgba(250,250,243,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#3f6530' }}>DairyDirect</div>
          <div style={{ fontSize: '11px', color: '#73796d', fontWeight: 500 }}>Delivery Portal</div>
        </div>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#c2efac', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#3f6530',
        }}>D</div>
      </header>

      <main>{children}</main>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 20px 20px',
        background: 'rgba(250,250,243,0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(195,201,187,0.3)',
        zIndex: 50,
      }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '8px 24px', borderRadius: '12px', textDecoration: 'none',
              backgroundColor: active ? 'rgba(194,239,172,0.45)' : 'transparent',
              color: active ? '#3f6530' : '#73796d',
            }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '11px', fontWeight: active ? 600 : 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
