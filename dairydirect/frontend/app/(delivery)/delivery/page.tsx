'use client';

import { useState } from 'react';
import { MapPin, Phone, CheckCircle2, Loader2 } from 'lucide-react';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
};

const initialTasks = [
  { id: 'T-001', customer: 'Priya Sharma', address: 'B-204, Sunrise Apartments, Bopal', items: 'A2 Milk ×2, Paneer ×1', time: '7:00 AM', status: 'pending', phone: '+91 98765 43210' },
  { id: 'T-002', customer: 'Rahul Mehta', address: '15, Green Park Society, Prahlad Nagar', items: 'Greek Yogurt ×1, Ghee ×1', time: '7:30 AM', status: 'in-progress', phone: '+91 87654 32109' },
  { id: 'T-003', customer: 'Deepa Nair', address: 'C-12, Silver Oak, Satellite Road', items: 'Low Fat Milk ×4', time: '8:00 AM', status: 'completed', phone: '+91 76543 21098' },
  { id: 'T-004', customer: 'Arjun Kumar', address: '302, Om Complex, Vastrapur', items: 'Desi Ghee 500ml ×1', time: '8:30 AM', status: 'pending', phone: '+91 65432 10987' },
];

export default function DeliveryDashboardPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [otpTask, setOtpTask] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    setOtpTask(null);
    setOtp(['', '', '', '']);
  };

  const total = tasks.length;
  const pending = tasks.filter(t => t.status !== 'completed').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  const getStatusDot = (status: string) => {
    if (status === 'completed') return C.green;
    if (status === 'in-progress') return C.brown;
    return C.greenPale;
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: total, bg: C.greenPale, color: C.green },
          { label: 'Pending', value: pending, bg: C.brownPale, color: C.brown },
          { label: 'Done', value: completed, bg: C.greenMint, color: '#3b644c' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: s.color, marginTop: '6px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.text, marginBottom: '16px' }}>Today&apos;s Route</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tasks.map(task => (
          <div key={task.id} style={{
            backgroundColor: C.white, borderRadius: '18px', padding: '18px',
            boxShadow: '0 2px 14px rgba(63,101,48,0.07)',
            opacity: task.status === 'completed' ? 0.7 : 1,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusDot(task.status), flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.green }}>{task.id}</span>
                <span style={{ fontSize: '11px', color: C.faint }}>· {task.time}</span>
              </div>
              {task.status === 'completed' && <CheckCircle2 size={20} color={C.green} />}
              {task.status === 'in-progress' && <Loader2 size={20} color={C.brown} className="animate-spin" />}
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '4px' }}>{task.customer}</h3>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '8px' }}>{task.items}</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '16px' }}>
              <MapPin size={14} color={C.faint} style={{ marginTop: '2px', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: C.faint, lineHeight: 1.4 }}>{task.address}</p>
            </div>

            {task.status !== 'completed' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`tel:${task.phone}`} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '12px 16px', borderRadius: '12px', textDecoration: 'none',
                  backgroundColor: C.surfaceLow, color: C.muted, fontSize: '14px', fontWeight: 600,
                }}>
                  <Phone size={16} /> Call
                </a>
                <button onClick={() => setOtpTask(task.id)} style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  backgroundColor: C.green, color: '#fff', fontSize: '14px', fontWeight: 700,
                }}>
                  Deliver with OTP
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* OTP Modal */}
      {otpTask && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', maxWidth: '480px', backgroundColor: C.white,
            borderRadius: '24px 24px 0 0', padding: '32px 24px 36px',
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: '8px' }}>Enter Delivery OTP</h3>
            <p style={{ fontSize: '14px', color: C.muted, textAlign: 'center', marginBottom: '28px' }}>Ask the customer for their 4-digit OTP</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '28px' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const newOtp = [...otp];
                    newOtp[i] = e.target.value;
                    setOtp(newOtp);
                  }}
                  style={{
                    width: '60px', height: '60px', textAlign: 'center', fontSize: '26px', fontWeight: 700,
                    borderRadius: '14px', border: `2px solid ${digit ? C.green : 'rgba(195,201,187,0.5)'}`,
                    backgroundColor: C.surfaceLow, color: C.text, outline: 'none',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setOtpTask(null); setOtp(['', '', '', '']); }} style={{
                flex: 1, padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                backgroundColor: C.surfaceHi, color: C.muted, fontSize: '15px', fontWeight: 700,
              }}>Cancel</button>
              <button onClick={() => completeTask(otpTask)} style={{
                flex: 1, padding: '15px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                backgroundColor: C.green, color: '#fff', fontSize: '15px', fontWeight: 700,
              }}>Confirm Delivery</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
