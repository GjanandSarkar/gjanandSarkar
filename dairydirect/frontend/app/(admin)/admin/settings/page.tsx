'use client';

import { useState } from 'react';
import { Store, Bell, Shield, Wallet, Save } from 'lucide-react';

const C = {
  green: '#3f6530', greenPale: '#c2efac',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2', surfaceMid: '#eeeee7',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', errorBg: '#ffdad6', teal: '#3b644c',
};

const tabs = [
  { id: 'general', label: 'General Info', icon: Store },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'payments', label: 'Payments', icon: Wallet },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Setup</p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>System Settings</h2>
        </div>
        <button onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          backgroundColor: saved ? C.brown : C.green, color: '#fff', fontSize: '14px', fontWeight: 700,
          boxShadow: '0 4px 14px rgba(63,101,48,0.2)', transition: 'all 0.2s',
        }}>
          <Save size={18} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        
        {/* Sidebar Nav */}
        <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '16px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '14px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: active ? 'rgba(194,239,172,0.35)' : 'transparent',
                  color: active ? C.green : C.muted, fontWeight: active ? 700 : 500, fontSize: '14px',
                  transition: 'all 0.15s ease',
                }}>
                  <Icon size={18} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '32px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, borderBottom: `1px solid ${C.surfaceHi}`, paddingBottom: '16px' }}>Store Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '8px' }}>Store Name</label>
                  <input defaultValue="DairyDirect Official" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${C.surfaceHi}`, outline: 'none', backgroundColor: C.surfaceLow, color: C.text, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '8px' }}>Support Email</label>
                  <input defaultValue="support@dairydirect.com" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${C.surfaceHi}`, outline: 'none', backgroundColor: C.surfaceLow, color: C.text, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '8px' }}>Store Address</label>
                <textarea defaultValue="12, Green Farms Road, Dairy Town" style={{ width: '100%', minHeight: '80px', padding: '14px', borderRadius: '12px', border: `1px solid ${C.surfaceHi}`, outline: 'none', backgroundColor: C.surfaceLow, color: C.text, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, borderBottom: `1px solid ${C.surfaceHi}`, paddingBottom: '16px' }}>Email & SMS Alerts</h3>
              {[
                { label: 'Order Confirmations', desc: 'Send emails to customers when they place an order.', active: true },
                { label: 'Out for Delivery SMS', desc: 'Send an SMS when order status changes to out for delivery.', active: true },
                { label: 'Weekly Summary', desc: 'Receive internal summary report of sales every Monday.', active: false },
                { label: 'New Complaint Alerts', desc: 'Get notified immediately for High Priority complaints.', active: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: i < 3 ? `1px dashed ${C.surfaceHi}` : 'none' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: C.text }}>{item.label}</p>
                    <p style={{ fontSize: '13px', color: C.muted, marginTop: '2px' }}>{item.desc}</p>
                  </div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: item.active ? C.green : C.surfaceHi, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', left: item.active ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, borderBottom: `1px solid ${C.surfaceHi}`, paddingBottom: '16px' }}>Password & Security</h3>
              <div style={{ display: 'grid', gap: '16px', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '8px' }}>Current Password</label>
                  <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${C.surfaceHi}`, outline: 'none', backgroundColor: C.surfaceLow, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '8px' }}>New Password</label>
                  <input type="password" placeholder="Enter new password" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${C.surfaceHi}`, outline: 'none', backgroundColor: C.surfaceLow, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, borderBottom: `1px solid ${C.surfaceHi}`, paddingBottom: '16px' }}>Payment Gateways connected</h3>
              <div style={{ backgroundColor: C.surfaceLow, borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#333' }}>
                    Pay
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>Razorpay</h4>
                    <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>Live Mode Active</p>
                  </div>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(195,201,187,0.4)', backgroundColor: C.white, color: C.text, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Manage</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
