'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { ChevronRight, CheckCircle2, Search, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import Link from 'next/link';

const C = {
  green: '#3f6530', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2', surfaceMid: '#eeeee7',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  teal: '#3b644c', error: '#ba1a1a', errorBg: '#ffdad6',
};

const getStatusStyles = (status: string) => {
  if (status === 'DELIVERED') return { bg: C.surfaceHi, color: C.muted };
  if (status === 'OUT FOR DELIVERY') return { bg: C.greenMint, color: '#264f38' };
  if (status === 'PROCESSING' || status === 'PENDING') return { bg: C.greenPale, color: '#042100' };
  return { bg: C.errorBg, color: '#93000a' }; // cancelled
};

const filters = ['All', 'Pending', 'Delivered'];

export default function OrdersPage() {
  const [filter, setFilter] = useState('All');
  const { cart, orders } = useAppContext();
  
  const totalItems = cart.reduce((a, b) => a + b.qty, 0);

  const filteredOrders = orders.filter(o => 
    filter === 'All' || 
    (filter === 'Pending' && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') ||
    (filter === 'Delivered' && o.status === 'DELIVERED')
  );

  return (
    <MobileLayout>
      {/* Header */}
      <header className="mobile-only-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        background: 'rgba(250,250,243,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>DairyDirect</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Search size={20} color={C.faint} />
          <div style={{ position: 'relative' }}>
            <Link href="/cart">
              <ShoppingCart size={20} color={C.green} />
            </Link>
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                minWidth: '16px', height: '16px', borderRadius: '9999px',
                backgroundColor: C.brown, color: '#fff', fontSize: '9px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{totalItems}</span>
            )}
          </div>
        </div>
      </header>

      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginBottom: '4px' }}>My Orders</h2>
          <p style={{ fontSize: '13px', color: C.muted }}>Track your farm-fresh deliveries and history.</p>
        </div>

        {/* Filters */}
        <div className="no-scroll-area" style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '20px', paddingBottom: '4px' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: filter === f ? 600 : 500, whiteSpace: 'nowrap', flexShrink: 0,
              backgroundColor: filter === f ? C.green : C.surfaceHi,
              color: filter === f ? '#fff' : C.muted,
              transition: 'all 0.15s ease',
            }}>{f}</button>
          ))}
        </div>

        {/* Order Cards */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '15px', color: C.muted, fontWeight: 600 }}>No orders found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredOrders.map(order => {
              const sts = getStatusStyles(order.status);
              const previewItem = order.items[0];
              const otherItemsCount = order.items.reduce((s,i)=>s+i.qty,0) - (previewItem?.qty || 0);

              return (
                <div key={order.id} style={{
                  backgroundColor: C.white, borderRadius: '18px', padding: '18px',
                  boxShadow: '0 2px 16px rgba(63,101,48,0.07)',
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                        ORDER #{order.id}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{order.date}</div>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px',
                      backgroundColor: sts.bg, color: sts.color,
                    }}>{order.status}</span>
                  </div>

                  {/* Item preview */}
                  <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    backgroundColor: C.surfaceLow, borderRadius: '12px', padding: '12px', marginBottom: '14px',
                  }}>
                    {previewItem && (
                      <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: C.surfaceHi }}>
                        <img src={previewItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {previewItem ? `${previewItem.name} (${previewItem.weight}) ×${previewItem.qty}` : 'No items'}
                        {otherItemsCount > 0 ? `, + others` : ''}
                      </p>
                      <p style={{ fontSize: '11px', color: C.faint, marginTop: '2px' }}>
                         {order.items.reduce((s,i)=>s+i.qty,0)} items total
                      </p>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: C.green, flexShrink: 0 }}>₹{order.total}</span>
                  </div>

                  {/* Bottom row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {order.deliveredDays !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color={C.teal} />
                        <span style={{ fontSize: '12px', color: C.muted }}>Delivered {order.deliveredDays} days ago</span>
                      </div>
                    ) : (
                      order.status !== 'CANCELLED' ? (
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${C.green}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      ) : <div />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: C.green, fontSize: '13px', fontWeight: 600 }}>
                      View Details <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subscribe CTA */}
        <div style={{
          marginTop: '28px', backgroundColor: C.surfaceLow, borderRadius: '18px', padding: '28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <span style={{ fontSize: '40px', marginBottom: '12px' }}>📅</span>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>Looking for subscriptions?</h4>
          <p style={{ fontSize: '13px', color: C.muted, maxWidth: '260px', marginBottom: '20px', lineHeight: 1.5 }}>
            Manage your recurring weekly deliveries in the Subscribe tab.
          </p>
          <Link href="/subscription" style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', textDecoration: 'none',
            backgroundColor: C.brown, color: '#fff', fontSize: '13px', fontWeight: 700,
          }}>Manage Subscriptions</Link>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
        .no-scroll-area::-webkit-scrollbar { display: none; }
      `}</style>
    </MobileLayout>
  );
}
