'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Search, ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/lib/context';
import Link from 'next/link';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surface: '#fafaf3', surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
};

const categories = ['All Products', 'Milk', 'Buttermilk', 'Paneer', 'Ghee'];

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [search, setSearch] = useState('');
  
  const { products, cart, addToCart, removeFromCart } = useAppContext();

  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  const totalPrice = cart.reduce((sum, p) => sum + p.qty * p.price, 0);

  const filtered = products.filter(p =>
    (activeCategory === 'All Products' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      {/* Header */}
      <header className="mobile-only-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        background: 'rgba(250,250,243,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>DairyDirect</span>
        <div style={{ position: 'relative' }}>
          <Link href="/cart">
            <ShoppingCart size={22} color={C.green} />
          </Link>
          {totalItems > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              minWidth: '16px', height: '16px', borderRadius: '9999px',
              backgroundColor: C.brown, color: '#fff',
              fontSize: '10px', fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>{totalItems}</span>
          )}
        </div>
      </header>

      <div style={{ padding: '16px 20px', paddingBottom: totalItems > 0 ? '110px' : '20px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color={C.faint} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search milk, curd, paneer..."
            style={{
              width: '100%', padding: '13px 14px 13px 44px',
              borderRadius: '12px', border: 'none', outline: 'none',
              backgroundColor: C.surfaceHi, color: C.text,
              fontSize: '14px', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category Tabs */}
        <div className="no-scroll-area" style={{
          display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none',
          borderBottom: '1px solid rgba(195,201,187,0.25)', marginBottom: '20px',
          margin: '0 -20px 20px', padding: '0 20px',
        }}>
          {categories.map(cat => {
            const active = cat === activeCategory;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 18px 10px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
                  fontWeight: active ? 600 : 500,
                  color: active ? C.green : C.muted,
                  borderBottom: active ? `3px solid ${C.green}` : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px',
                }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
          {filtered.map(product => {
            const qty = cart.find(i => i.id === product.id)?.qty || 0;
            return (
              <div key={product.id} style={{
                backgroundColor: C.white, borderRadius: '18px', overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(63,101,48,0.08)',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Image */}
                <div style={{ position: 'relative', height: '150px', backgroundColor: C.surfaceLow }}>
                  <img src={product.image} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {product.badge && (
                    <span style={{
                      position: 'absolute', top: '8px',
                      left: product.badge === 'BESTSELLER' ? '8px' : undefined,
                      right: product.badge === 'FRESH' ? '8px' : undefined,
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: '9999px',
                      backgroundColor: product.badge === 'BESTSELLER' ? C.brown : C.greenPale,
                      color: product.badge === 'BESTSELLER' ? '#fff' : '#042100',
                    }}>{product.badge}</span>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontSize: '13px', fontWeight: 700, color: C.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px',
                  }}>{product.name}</h3>
                  <p style={{ fontSize: '11px', color: C.faint, marginBottom: '10px' }}>{product.weight}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: C.green }}>₹{product.price}</span>
                    {qty === 0 ? (
                      <button onClick={() => addToCart(product)} style={{
                        width: '34px', height: '34px', borderRadius: '10px', border: 'none',
                        backgroundColor: C.green, color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Plus size={16} /></button>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        backgroundColor: 'rgba(63,101,48,0.1)', borderRadius: '10px', padding: '4px',
                      }}>
                        <button onClick={() => removeFromCart(product.id)} style={{
                          width: '26px', height: '26px', borderRadius: '7px', border: 'none',
                          backgroundColor: C.white, color: C.green, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Minus size={12} /></button>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: C.green, minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                        <button onClick={() => addToCart(product)} style={{
                          width: '26px', height: '26px', borderRadius: '7px', border: 'none',
                          backgroundColor: C.green, color: '#fff', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Plus size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed', left: '12px', right: '12px', bottom: '88px', zIndex: 45,
          maxWidth: '1080px', margin: '0 auto', display: 'flex', justifyContent: 'center'
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', backgroundColor: C.greenLight,
            borderRadius: '18px', padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(63,101,48,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingCart size={16} color="#fff" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {totalItems} items · ₹{totalPrice}
              </span>
            </div>
            <Link href="/cart" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              VIEW CART <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
        .no-scroll-area::-webkit-scrollbar { display: none; }
      `}</style>
    </MobileLayout>
  );
}
