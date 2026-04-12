'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Search, ShoppingCart, ChevronRight, Plus, Minus, Leaf, CalendarDays } from 'lucide-react';
import { useAppContext } from '@/lib/context';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surface: '#fafaf3', surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
};

const categories = ['All Items', 'Milk', 'Paneer', 'Ghee', 'Buttermilk'];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All Items');
  const { products, cart, addToCart, removeFromCart } = useAppContext();

  // Desktop check via a class is handled in MobileLayout, but here we just render the content.
  // The MobileLayout hides the mobile header on desktop. So we let MobileLayout handle the top nav on desktop,
  // but we still need a mobile header inside the page for < 768px.
  // Wait, I put a desktop-header in MobileLayout. I should hide the mobile header on desktop here.

  return (
    <MobileLayout>
      {/* Mobile Header */}
      <header className="mobile-only-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        background: 'rgba(250,250,243,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: C.green, letterSpacing: '-0.5px' }}>
          DairyDirect
        </span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Search size={22} color={C.muted} />
          <div style={{ position: 'relative' }}>
            <Link href="/cart">
              <ShoppingCart size={22} color={C.green} />
            </Link>
            {cart.reduce((a,b)=>a+b.qty,0) > 0 && (
               <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: C.brown,
              }} />
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: '0 20px 20px' }}>
        {/* Greeting */}
        <div style={{ padding: '24px 0 20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: C.text, lineHeight: 1.25, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Good morning,<br />Priya <Leaf size={28} color={C.green} />
          </h1>
          <p style={{ fontSize: '14px', color: C.muted, marginTop: '6px' }}>
            Your fresh farm delivery is ready.
          </p>
        </div>

        {/* Subscription Banner */}
        <Link href="/subscription" style={{ textDecoration: 'none', display: 'block', marginBottom: '28px' }}>
          <div style={{
            borderRadius: '20px', background: 'linear-gradient(135deg, #8a5025 0%, #6b3a19 100%)',
            padding: '24px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(138,80,37,0.3)',
          }}>
            <div style={{
              position: 'absolute', right: '-20px', bottom: '-20px',
              width: '140px', height: '140px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', filter: 'blur(24px)',
            }} />
            <div style={{ position: 'absolute', right: '16px', bottom: '12px', opacity: 0.15 }}>
              <CalendarDays size={100} color="#ffffff" strokeWidth={1} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)' }}>
                Premium Member
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '6px 0 8px', lineHeight: 1.2 }}>
                Save 20% on Daily Essentials
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', maxWidth: '200px', marginBottom: '20px' }}>
                Subscribe to our A2 Buffalo Milk &amp; Paneer combo.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#fff', color: C.brown, fontSize: '13px', fontWeight: 700,
                padding: '10px 20px', borderRadius: '12px',
              }}>
                Explore Subscriptions <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </Link>

        {/* Category Chips */}
        <div className="no-scroll-area" style={{
          display: 'flex', gap: '8px', overflowX: 'auto', margin: '0 -20px 24px',
          padding: '0 20px 4px', scrollbarWidth: 'none',
        }}>
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '9px 18px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
                backgroundColor: active ? C.green : C.surfaceHi,
                color: active ? '#fff' : C.muted,
                boxShadow: active ? '0 2px 12px rgba(63,101,48,0.25)' : 'none',
                transition: 'all 0.15s ease', flexShrink: 0,
              }}>{cat}</button>
            );
          })}
        </div>

        {/* Products Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text }}>Daily Fresh</h3>
          <Link href="/store" style={{ fontSize: '13px', fontWeight: 600, color: C.green, textDecoration: 'none' }}>
            View all
          </Link>
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {products.filter(p => activeCategory === 'All Items' || p.category === activeCategory).map(p => {
             const qty = cart.find(i => i.id === p.id)?.qty || 0;
             return (
              <div key={p.id} style={{
                backgroundColor: C.white, borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(63,101,48,0.07)', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ height: '140px', backgroundColor: C.surfaceLow, overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{
                    fontSize: '13px', fontWeight: 700, color: C.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px',
                  }}>{p.name}</h4>
                  <span style={{ fontSize: '11px', color: C.faint }}>{p.weight}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: C.green }}>₹{p.price}</span>
                    {qty === 0 ? (
                      <button onClick={() => addToCart(p)} style={{
                        width: '32px', height: '32px', borderRadius: '10px', border: 'none',
                        backgroundColor: C.green, color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Plus size={16} />
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(63,101,48,0.1)', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => removeFromCart(p.id)} style={{ width: '24px', height: '24px', borderRadius: '7px', border: 'none', backgroundColor: C.white, color: C.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: C.green, minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => addToCart(p)} style={{ width: '24px', height: '24px', borderRadius: '7px', border: 'none', backgroundColor: C.green, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Nav Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <Link href="/orders" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: C.greenPale, borderRadius: '16px', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '16px', height: '100%'
            }}>
              <span style={{ fontSize: '28px' }}>📦</span>
              <div>
                <p style={{ fontWeight: 700, color: C.green, fontSize: '14px' }}>My Orders</p>
                <p style={{ fontSize: '12px', color: C.greenLight }}>Track deliveries</p>
              </div>
            </div>
          </Link>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: C.brownPale, borderRadius: '16px', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '16px', height: '100%'
            }}>
              <span style={{ fontSize: '28px' }}>📊</span>
              <div>
                <p style={{ fontWeight: 700, color: C.brown, fontSize: '14px' }}>Admin Panel</p>
                <p style={{ fontSize: '12px', color: '#774117' }}>Manage all orders</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
        .no-scroll-area::-webkit-scrollbar { display: none; }
      `}</style>
    </MobileLayout>
  );
}
