'use client';

import { useState } from 'react';
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const C = {
  green: '#3f6530', greenPale: '#c2efac',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2', surfaceMid: '#eeeee7',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', errorBg: '#ffdad6', teal: '#3b644c', tealPale: '#bcece0',
};

const initialUsers = [
  { id: 'USR-001', name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+91 98765 43210', status: 'Active', plan: 'Premium', joined: 'Mar 12, 2023', orders: 42 },
  { id: 'USR-002', name: 'Rahul Mehta', email: 'rahul.m@example.com', phone: '+91 87654 32109', status: 'Active', plan: 'Basic', joined: 'Apr 05, 2023', orders: 18 },
  { id: 'USR-003', name: 'Deepa Nair', email: 'deepa.n@example.com', phone: '+91 76543 21098', status: 'Paused', plan: 'None', joined: 'Jun 22, 2023', orders: 5 },
  { id: 'USR-004', name: 'Arjun Kumar', email: 'arjun.k@example.com', phone: '+91 65432 10987', status: 'Active', plan: 'Premium', joined: 'Jul 15, 2023', orders: 27 },
  { id: 'USR-005', name: 'Anita Patel', email: 'anita.p@example.com', phone: '+91 54321 09876', status: 'Inactive', plan: 'None', joined: 'Aug 01, 2023', orders: 0 },
];

export default function AdminCustomersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const getStatusStyle = (status: string) => {
    if (status === 'Active') return { bg: C.greenPale, color: '#042100' };
    if (status === 'Paused') return { bg: C.brownPale, color: '#311300' };
    return { bg: C.surfaceHi, color: C.muted };
  };

  const deleteUser = (id: string) => {
    if(confirm('Are you sure you want to delete this customer?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Management</p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>Customers</h2>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          backgroundColor: C.green, color: '#fff', fontSize: '14px', fontWeight: 700,
          boxShadow: '0 4px 14px rgba(63,101,48,0.2)', transition: 'all 0.2s',
        }}>
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      <div style={{ backgroundColor: C.white, borderRadius: '24px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(195,201,187,0.2)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color={C.faint} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              style={{
                width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px',
                border: '1px solid rgba(195,201,187,0.4)', outline: 'none',
                fontSize: '14px', boxSizing: 'border-box', backgroundColor: C.surfaceLow,
              }}
            />
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.4)',
            backgroundColor: C.white, color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            <Filter size={18} /> Filters
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(195,201,187,0.3)', backgroundColor: 'rgba(244,244,237,0.4)' }}>
                {['Customer', 'Contact', 'Status', 'Plan', 'Orders', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(195,201,187,0.2)' : 'none', transition: 'background-color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(194,239,172,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: C.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: C.green }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{u.name}</p>
                        <p style={{ fontSize: '11px', color: C.faint, marginTop: '2px' }}>{u.id} · Joined {u.joined}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: C.text }}>{u.phone}</p>
                    <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>{u.email}</p>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', ...getStatusStyle(u.status) }}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: u.plan === 'Premium' ? C.brown : C.faint }}>{u.plan}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600, color: C.text }}>
                    {u.orders}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: C.surfaceLow, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteUser(u.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: C.errorBg, cursor: 'pointer', color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: C.white, borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, marginBottom: '24px' }}>Add New Customer</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '6px' }}>Full Name</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.4)', outline: 'none', boxSizing: 'border-box' }} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '6px' }}>Phone Number</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.4)', outline: 'none', boxSizing: 'border-box' }} placeholder="+91" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.faint, marginBottom: '6px' }}>Email Address</label>
                <input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(195,201,187,0.4)', outline: 'none', boxSizing: 'border-box' }} placeholder="john@example.com" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: C.surfaceHi, color: C.muted, fontWeight: 700, fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: C.green, color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
