'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const C = {
  green: '#3f6530', greenPale: '#c2efac',
  brown: '#8a5025',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', teal: '#3b644c',
};

const revenueData = [
  { month: 'Jun', value: 42000 },
  { month: 'Jul', value: 51000 },
  { month: 'Aug', value: 48000 },
  { month: 'Sep', value: 63000 },
  { month: 'Oct', value: 71000 },
  { month: 'Nov', value: 84500 },
];
const maxVal = Math.max(...revenueData.map(d => d.value));

const forecast = [
  { product: 'A2 Buffalo Milk (1L)', current: '2,400 units', projected: '2,680 units', trend: 'up', change: '+11.6%' },
  { product: 'Malai Paneer (200g)', current: '850 units', projected: '940 units', trend: 'up', change: '+10.5%' },
  { product: 'Pure Desi Ghee (500ml)', current: '320 units', projected: '298 units', trend: 'down', change: '-6.8%' },
  { product: 'Probiotic Curd (400g)', current: '1,100 units', projected: '1,280 units', trend: 'up', change: '+16.3%' },
  { product: 'Buttermilk (500ml)', current: '640 units', projected: '580 units', trend: 'down', change: '-9.3%' },
];

export default function AdminForecastPage() {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Analytics</p>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>Revenue & Forecast</h2>
      </div>

      {/* Revenue Chart */}
      <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '28px', marginBottom: '24px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Monthly Revenue</h4>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: C.green }}>₹84,500</span>
            <span style={{ fontSize: '13px', color: C.teal, fontWeight: 600 }}>+19% vs last month</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '200px', paddingTop: '20px' }}>
          {revenueData.map(d => {
            const isLast = d.month === 'Nov';
            const isHovered = hoveredMonth === d.month;
            return (
              <div 
                key={d.month} 
                onMouseEnter={() => setHoveredMonth(d.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
              >
                <div style={{ 
                  fontSize: '11px', fontWeight: 700, 
                  color: isHovered || isLast ? C.green : C.faint,
                  opacity: isHovered || isLast ? 1 : 0.6,
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  ₹{(d.value / 1000).toFixed(0)}k
                </div>
                <div style={{
                  width: '100%', borderRadius: '10px 10px 0 0',
                  height: `${(d.value / maxVal) * 150}px`,
                  backgroundColor: isHovered ? C.green : (isLast ? '#4f7d3e' : C.greenPale),
                  boxShadow: isHovered ? '0 4px 12px rgba(63,101,48,0.3)' : 'none',
                  transform: isHovered ? 'scaleY(1.02)' : 'none',
                  transformOrigin: 'bottom',
                  opacity: isHovered || isLast ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                }} />
                <span style={{ 
                  fontSize: '11px', fontWeight: isHovered ? 700 : 600, 
                  color: isHovered || isLast ? C.green : C.faint 
                }}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demand Forecast */}
      <div style={{ backgroundColor: C.white, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
        <div style={{ padding: '20px 28px', backgroundColor: 'rgba(244,244,237,0.4)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>Next Month Demand Forecast</h4>
          <p style={{ fontSize: '13px', color: C.muted, marginTop: '4px' }}>Based on historical trends and seasonal patterns</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(195,201,187,0.3)' }}>
                {['Product', 'Current Demand', 'Next Month Projection', 'Trend'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.map((item, i) => (
                <tr key={item.product} style={{ borderBottom: i < forecast.length - 1 ? '1px solid rgba(195,201,187,0.2)' : 'none' }}>
                  <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 600, color: C.text }}>{item.product}</td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: C.muted }}>{item.current}</td>
                  <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 700, color: C.green }}>{item.projected}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.trend === 'up'
                        ? <TrendingUp size={16} color={C.green} />
                        : <TrendingDown size={16} color={C.error} />
                      }
                      <span style={{ fontSize: '13px', fontWeight: 700, color: item.trend === 'up' ? C.green : C.error }}>{item.change}</span>
                    </div>
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
