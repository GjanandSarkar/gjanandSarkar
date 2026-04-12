'use client';

import { useState } from 'react';
import { MoreHorizontal, Filter, Download, Search } from 'lucide-react';

const C = {
  green: '#3f6530', greenPale: '#c2efac', greenMint: '#bfedce',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', errorBg: '#ffdad6', teal: '#3b644c',
};

const orders = [
  { id: '#DD-9021', customer: 'Priya Sharma', date: 'Oct 24, 2023', items: 'A2 Milk ×2, Paneer ×1', total: '₹274', status: 'OUT FOR DELIVERY', statusBg: C.greenMint, statusColor: '#264f38' },
  { id: '#DD-9020', customer: 'Rahul Mehta', date: 'Oct 24, 2023', items: 'Greek Yogurt ×1, Ghee ×1', total: '₹512', status: 'PROCESSING', statusBg: C.greenPale, statusColor: '#042100' },
  { id: '#DD-9019', customer: 'Anita Patel', date: 'Oct 23, 2023', items: 'Low Fat Milk ×4', total: '₹260', status: 'DELIVERED', statusBg: C.surfaceHi, statusColor: C.muted },
  { id: '#DD-9018', customer: 'Vikram Singh', date: 'Oct 23, 2023', items: 'Desi Ghee 500ml ×1', total: '₹450', status: 'CANCELLED', statusBg: C.errorBg, statusColor: '#93000a' },
  { id: '#DD-9017', customer: 'Deepa Nair', date: 'Oct 22, 2023', items: 'Paneer ×2, Curd ×1', total: '₹340', status: 'DELIVERED', statusBg: C.surfaceHi, statusColor: C.muted },
  { id: '#DD-9016', customer: 'Arjun Kumar', date: 'Oct 22, 2023', items: 'A2 Milk ×3, Butter ×1', total: '₹386', status: 'IN TRANSIT', statusBg: C.brownPale, statusColor: '#6e3910' },
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const filtered = orders.filter(o =>
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total', value: orders.length, color: C.green },
    { label: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length, color: C.teal },
    { label: 'In Transit', value: orders.filter(o => ['IN TRANSIT', 'OUT FOR DELIVERY'].includes(o.status)).length, color: C.brown },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length, color: C.error },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Management</p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>Orders</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => alert('Filter options opened')}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.5)', backgroundColor: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.surfaceLow}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
          >
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => alert('Exporting orders to CSV...')}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.5)', backgroundColor: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.surfaceLow}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} color={C.faint} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID or customer name..."
          style={{
            width: '100%', padding: '13px 14px 13px 44px', borderRadius: '12px',
            border: '1px solid rgba(195,201,187,0.4)', outline: 'none',
            backgroundColor: C.white, color: C.text, fontSize: '14px', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ backgroundColor: C.white, borderRadius: '14px', padding: '16px', border: '1px solid rgba(195,201,187,0.3)' }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '13px', color: C.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: C.white, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(63,101,48,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(195,201,187,0.3)' }}>
                {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr 
                  key={order.id} 
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(195,201,187,0.2)' : 'none', transition: 'background-color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(194,239,172,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: C.text }}>{order.id}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: C.greenPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: C.green, flexShrink: 0 }}>
                        {order.customer[0]}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: C.text }}>{order.customer}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: C.muted }}>{order.date}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: C.muted }}>{order.items}</td>
                  <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700, color: C.green }}>{order.total}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '5px 12px', borderRadius: '9999px', backgroundColor: order.statusBg, color: order.statusColor }}>{order.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.faint }}
                            onClick={() => alert(`Showing details for order ${order.id}`)}>
                      <MoreHorizontal size={18} />
                    </button>
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
