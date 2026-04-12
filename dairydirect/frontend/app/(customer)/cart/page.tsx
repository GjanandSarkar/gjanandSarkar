'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Truck, Minus, Plus, ArrowRight, Tag, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/lib/context';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025',
  surface: '#fafaf3', surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  teal: '#3b644c',
};

export default function CartPage() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, checkout } = useAppContext();
  const [coupon, setCoupon] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal > 0 ? 25.00 : 0;
  const discount = subtotal > 0 ? 50.00 : 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const handleCheckout = () => {
    checkout();
    router.push('/orders');
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="mobile-only-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(250,250,243,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={24} color={C.text} />
        </button>
        <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>DairyDirect</span>
      </header>

      <div style={{ padding: '20px', paddingBottom: '120px' }}>
        {/* Delivery Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: C.greenMint, borderRadius: '12px', padding: '12px 16px',
          marginBottom: '20px', color: '#264f38',
        }}>
          <Truck size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Estimated delivery: Tomorrow morning</span>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 800, color: C.green, marginBottom: '20px' }}>Your Basket</h2>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '16px', color: C.muted, fontWeight: 600 }}>Your basket is empty</p>
            <p style={{ fontSize: '13px', color: C.faint, marginTop: '8px' }}>Add some fresh dairy products to proceed.</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  backgroundColor: C.white, borderRadius: '16px', padding: '14px',
                  display: 'flex', gap: '14px', alignItems: 'center',
                  boxShadow: '0 2px 12px rgba(63,101,48,0.06)',
                }}>
                  <div style={{ width: '76px', height: '76px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, backgroundColor: C.surfaceLow }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>{item.name}</h3>
                    <p style={{ fontSize: '12px', color: C.faint, marginBottom: '10px' }}>{item.weight}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: C.green }}>₹{item.price * item.qty}</span>
                      {/* Stepper */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0',
                        backgroundColor: C.surfaceLow, borderRadius: '10px', overflow: 'hidden',
                      }}>
                        <button onClick={() => removeFromCart(item.id)} style={{
                          width: '34px', height: '34px', border: 'none', background: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted,
                        }}><Minus size={14} /></button>
                        <span style={{ minWidth: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: C.text }}>{item.qty}</span>
                        <button onClick={() => addToCart(item)} style={{
                          width: '34px', height: '34px', border: 'none', background: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted,
                        }}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div style={{
              backgroundColor: C.surfaceLow, borderRadius: '16px', padding: '14px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={16} color={C.faint} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    placeholder="Enter coupon code"
                    style={{
                      width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px',
                      border: 'none', outline: 'none', backgroundColor: C.white,
                      fontSize: '13px', color: C.text, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button style={{
                  padding: '0 20px', borderRadius: '12px', border: 'none',
                  backgroundColor: C.brown, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                }}>Apply</button>
              </div>
            </div>

            {/* Price Summary */}
            <div style={{
              backgroundColor: C.surfaceLow, borderRadius: '16px', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {[
                { label: 'Subtotal', value: `₹${subtotal}`, color: C.muted },
                { label: 'Delivery Fee', value: `₹${delivery}`, color: C.muted },
                { label: 'First Order Discount', value: `-₹${discount}`, color: C.teal },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: r.color }}>{r.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: r.color }}>{r.value}</span>
                </div>
              ))}
              <div style={{
                borderTop: '1px solid rgba(195,201,187,0.3)', paddingTop: '14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Total Amount</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>₹{total}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout CTA */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '12px', right: '12px', zIndex: 45,
          maxWidth: '1080px', margin: '0 auto', display: 'flex', justifyContent: 'center'
        }}>
          <button onClick={handleCheckout} style={{
            width: '100%', maxWidth: '400px', padding: '18px', borderRadius: '18px', border: 'none',
            background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            color: '#fff', fontSize: '17px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 8px 32px rgba(63,101,48,0.35)',
          }}>
            Proceed to Checkout <ArrowRight size={20} />
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
      `}</style>
    </MobileLayout>
  );
}
