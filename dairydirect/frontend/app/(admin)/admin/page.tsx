'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBasket, RefreshCw, AlertTriangle, IndianRupee, MoreHorizontal, Download, PlusCircle } from 'lucide-react';

const C = {
  green: '#3f6530', greenLight: '#577f46', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025', brownPale: '#ffdcc7',
  teal: '#3b644c', tealPale: '#bfedce',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2', surfaceMid: '#eeeee7',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', errorBg: '#ffdad6',
};

const kpis = [
  { label: "Today's Orders", value: '148', change: '+12%', icon: ShoppingBasket, color: C.green, bg: C.greenPale, border: C.green },
  { label: 'Subscriptions', value: '2,840', change: '+5.4%', icon: RefreshCw, color: C.teal, bg: C.tealPale, border: C.teal },
  { label: 'Pending Issues', value: '14', change: 'Urgent', icon: AlertTriangle, color: C.error, bg: C.errorBg, border: C.error, urgent: true },
  { label: "Today's Revenue", value: '₹84,290', change: '+8%', icon: IndianRupee, color: C.brown, bg: C.brownPale, border: C.brown },
];

const orders = [
  { id: '#DD-8291', customer: 'Priya Sharma', items: '2× A2 Milk, 1× Paneer', total: '₹274', status: 'DELIVERED', statusBg: C.greenMint, statusColor: '#264f38' },
  { id: '#DD-8290', customer: 'Rahul Mehta', items: '1× Greek Yogurt, 1× Ghee', total: '₹512', status: 'IN TRANSIT', statusBg: C.brownPale, statusColor: '#6e3910' },
  { id: '#DD-8289', customer: 'Anita Patel', items: '4× Low Fat Milk', total: '₹260', status: 'PROCESSING', statusBg: C.greenPale, statusColor: '#042100' },
  { id: '#DD-8288', customer: 'Vikram Singh', items: '1× Desi Ghee 500ml', total: '₹450', status: 'CANCELLED', statusBg: C.errorBg, statusColor: '#93000a' },
];

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const weekData = [82, 110, 95, 140, 128, 165, 148];
const maxD = Math.max(...weekData);

export default function AdminDashboardPage() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  return (
    <>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overview</p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>Today&apos;s Summary</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px',
            borderRadius: '12px', border: '1px solid rgba(195,201,187,0.5)',
            backgroundColor: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={16} /> Export
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px',
            borderRadius: '12px', border: 'none',
            backgroundColor: C.green, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            <PlusCircle size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const hrefs = ['/admin/orders', '/admin/subscriptions', '/admin/complaints', '/admin/forecast'];
          return (
            <Link href={hrefs[idx]} key={kpi.label} style={{ textDecoration: 'none' }}>
              <div 
                style={{
                  backgroundColor: C.white, borderRadius: '18px', padding: '22px',
                  borderBottom: `3px solid ${kpi.border}`,
                  boxShadow: '0 4px 20px rgba(63,101,48,0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  height: '100%', boxSizing: 'border-box'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(63,101,48,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(63,101,48,0.06)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: kpi.bg, display: 'flex' }}>
                    <Icon size={20} color={kpi.color} />
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px',
                    backgroundColor: `${kpi.bg}99`,
                    color: kpi.color,
                  }}>{kpi.change}</span>
                </div>
                <p style={{ fontSize: '13px', color: C.muted, marginBottom: '4px' }}>{kpi.label}</p>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: C.text }}>{kpi.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px, 340px)', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Bar Chart */}
        <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '28px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Orders This Week</h4>
            <select style={{ borderRadius: '10px', border: 'none', padding: '7px 14px', fontSize: '12px', fontWeight: 600, backgroundColor: C.surfaceLow, color: C.text, cursor: 'pointer' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px' }}>
            {weekData.map((val, i) => {
              const isHovered = hoveredDay === i;
              const isToday = i === 6;
              return (
                <div 
                  key={weekDays[i]} 
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
                >
                  <div style={{ 
                    fontSize: '10px', fontWeight: 700, 
                    color: isHovered || isToday ? C.green : C.faint,
                    opacity: isHovered || isToday ? 1 : 0.6,
                    transform: isHovered ? 'translateY(-4px)' : 'none',
                    transition: 'all 0.2s ease',
                  }}>{val}</div>
                  <div style={{
                    width: '100%', borderRadius: '8px 8px 0 0',
                    height: `${(val / maxD) * 120}px`,
                    backgroundColor: isHovered ? C.green : (isToday ? '#4f7d3e' : C.greenPale),
                    boxShadow: isHovered ? '0 4px 12px rgba(63,101,48,0.3)' : 'none',
                    transform: isHovered ? 'scaleY(1.02)' : 'none',
                    transformOrigin: 'bottom',
                    opacity: isHovered || isToday ? 1 : 0.8,
                    transition: 'all 0.2s ease',
                  }} />
                  <span style={{ 
                    fontSize: '10px', fontWeight: isHovered ? 700 : 600, 
                    color: isHovered || isToday ? C.green : C.faint 
                  }}>{weekDays[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ring Chart */}
        <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '28px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '24px', alignSelf: 'flex-start' }}>Capacity Utilized</h4>
          <div 
            style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="64" fill="none" stroke={C.surfaceHi} strokeWidth="14" />
              <circle cx="80" cy="80" r="64" fill="none" stroke={C.green} strokeWidth="14"
                strokeDasharray="402" strokeDashoffset="88" strokeLinecap="round" 
                style={{ transition: 'stroke-width 0.2s ease', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.strokeWidth = '18'}
                onMouseLeave={e => e.currentTarget.style.strokeWidth = '14'}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: C.text }}>78%</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subscribed</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: C.muted, textAlign: 'center', marginTop: '20px', lineHeight: 1.55 }}>
            <strong style={{ color: C.green }}>142 slots</strong> remaining for morning route.
          </p>
          <button style={{
            width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', border: 'none',
            backgroundColor: C.surfaceLow, color: C.green, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.surfaceHi}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.surfaceLow}
          >View Fleet Logistics</button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: C.white, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
        <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(244,244,237,0.4)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Recent Orders</h4>
          <Link href="/admin/orders" style={{ fontSize: '13px', fontWeight: 700, color: C.green, textDecoration: 'none' }}>View All</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(195,201,187,0.3)' }}>
                {['Order ID', 'Customer', 'Products', 'Total', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(195,201,187,0.2)' : 'none' }}>
                  <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 600, color: C.text }}>{order.id}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: C.greenPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: C.green, flexShrink: 0 }}>
                        {order.customer[0]}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: C.text }}>{order.customer}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: C.muted }}>{order.items}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 700, color: C.green }}>{order.total}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px', backgroundColor: order.statusBg, color: order.statusColor }}>{order.status}</span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.faint }}><MoreHorizontal size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
