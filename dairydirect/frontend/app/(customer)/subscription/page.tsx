'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Pencil } from 'lucide-react';
import { useAppContext } from '@/lib/context';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
};

export default function SubscriptionPage() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Active', 'Paused'];
  
  const { subscriptions, toggleSubscription } = useAppContext();

  const filtered = subscriptions.filter(s => filter === 'All' || s.status === filter);

  return (
    <MobileLayout>
      <header className="mobile-only-header" style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '14px 20px',
        background: 'rgba(250,250,243,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(195,201,187,0.3)',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: C.green }}>DairyDirect</span>
      </header>

      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: C.text, marginBottom: '4px' }}>My Subscriptions</h2>
          <p style={{ fontSize: '13px', color: C.muted }}>Manage your recurring farm-fresh deliveries.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: filter === f ? 600 : 500,
              backgroundColor: filter === f ? C.green : C.surfaceHi,
              color: filter === f ? '#fff' : C.muted,
              transition: 'all 0.15s ease',
            }}>{f}</button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '15px', color: C.muted, fontWeight: 600 }}>No subscriptions found</p>
            </div>
          ) : (
            filtered.map(sub => {
              const active = sub.status === 'Active';
              return (
                <div key={sub.id} style={{
                  backgroundColor: C.white, borderRadius: '20px', padding: '18px',
                  boxShadow: '0 2px 16px rgba(63,101,48,0.07)',
                  opacity: active ? 1 : 0.85,
                }}>
                  {/* Top */}
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0,
                      backgroundColor: C.surfaceLow,
                      filter: active ? 'none' : 'grayscale(1)',
                    }}>
                      <img src={sub.image} alt={sub.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        display: 'inline-block', fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '3px 10px', borderRadius: '9999px', marginBottom: '8px',
                        backgroundColor: active ? C.greenPale : C.brownPale,
                        color: active ? '#042100' : '#311300',
                      }}>{sub.status}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '3px' }}>{sub.productName}</h3>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: active ? C.green : C.brown }}>{sub.detail}</p>
                    </div>
                  </div>

                  {/* Delivery info */}
                  {sub.nextDelivery ? (
                    <div style={{
                      backgroundColor: C.surfaceLow, borderRadius: '12px', padding: '14px',
                      display: 'flex', justifyContent: 'space-between', marginBottom: '16px',
                    }}>
                      <div>
                        <p style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Next Delivery</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{sub.nextDelivery}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Frequency</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{sub.frequency}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'rgba(244,244,237,0.5)', borderRadius: '12px', padding: '14px',
                      border: '1px dashed rgba(195,201,187,0.5)', textAlign: 'center', marginBottom: '16px',
                    }}>
                      <p style={{ fontSize: '12px', color: C.faint, fontStyle: 'italic' }}>No upcoming deliveries scheduled.</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => toggleSubscription(sub.id)} style={{
                      flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      backgroundColor: active ? C.green : C.brown, color: '#fff',
                      fontSize: '14px', fontWeight: 700,
                    }}>
                      {active ? 'Pause Subscription' : 'Resume Delivery'}
                    </button>
                    <button style={{
                      width: '44px', height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      backgroundColor: C.surfaceHi, color: C.muted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Pencil size={16} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bento stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ backgroundColor: C.greenMint, borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>💰</div>
            <p style={{ fontSize: '11px', color: '#264f38', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Savings</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#002111' }}>₹145</p>
          </div>
          <div style={{ backgroundColor: C.surfaceHi, borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⭐</div>
            <p style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Delivery Streak</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: C.text }}>12 <span style={{ fontSize: '14px', fontWeight: 500 }}>Weeks</span></p>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .mobile-only-header { display: none !important; }
        }
      `}</style>
    </MobileLayout>
  );
}
