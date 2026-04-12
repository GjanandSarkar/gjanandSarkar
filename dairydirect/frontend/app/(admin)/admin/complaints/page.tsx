'use client';

import { useState } from 'react';

const C = {
  green: '#3f6530', greenPale: '#c2efac',
  brown: '#8a5025', brownPale: '#ffdcc7',
  surfaceLow: '#f4f4ed', surfaceHi: '#e8e9e2',
  white: '#ffffff', text: '#1a1c18', muted: '#43493e', faint: '#73796d',
  error: '#ba1a1a', errorBg: '#ffdad6', teal: '#3b644c',
};

const complaints = [
  { id: 'C-001', customer: 'Priya Sharma', issue: 'Milk delivered sour', date: 'Oct 24', status: 'OPEN', priority: 'High' },
  { id: 'C-002', customer: 'Rahul Mehta', issue: 'Wrong quantity delivered', date: 'Oct 23', status: 'IN REVIEW', priority: 'Medium' },
  { id: 'C-003', customer: 'Deepa Nair', issue: 'Packaging damaged', date: 'Oct 22', status: 'RESOLVED', priority: 'Low' },
  { id: 'C-004', customer: 'Arjun Kumar', issue: 'Delivery not received', date: 'Oct 21', status: 'OPEN', priority: 'High' },
  { id: 'C-005', customer: 'Anita Patel', issue: 'Billing discrepancy', date: 'Oct 20', status: 'IN REVIEW', priority: 'Medium' },
];

const getStatusStyle = (status: string) => {
  if (status === 'OPEN') return { bg: C.errorBg, color: '#93000a' };
  if (status === 'IN REVIEW') return { bg: C.brownPale, color: '#6e3910' };
  return { bg: C.greenPale, color: '#042100' };
};

const getPriorityColor = (p: string) => p === 'High' ? C.error : p === 'Medium' ? C.brown : C.teal;

export default function AdminComplaintsPage() {
  const [selected, setSelected] = useState(complaints[0]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support</p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: C.text, marginTop: '4px' }}>Quality Complaints</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'Open', count: 2, color: C.error, bg: C.errorBg },
            { label: 'In Review', count: 2, color: C.brown, bg: C.brownPale },
            { label: 'Resolved', count: 1, color: C.green, bg: C.greenPale },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 18px', borderRadius: '14px', backgroundColor: s.bg }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: s.color, marginTop: '3px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {complaints.map(c => {
            const ss = getStatusStyle(c.status);
            const isSelected = selected.id === c.id;
            return (
              <div key={c.id} onClick={() => setSelected(c)} style={{
                backgroundColor: isSelected ? 'rgba(194,239,172,0.12)' : C.white,
                borderRadius: '16px', padding: '16px', cursor: 'pointer',
                border: isSelected ? `2px solid ${C.green}` : '2px solid transparent',
                boxShadow: '0 2px 12px rgba(63,101,48,0.05)',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.green }}>{c.id}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '9999px', backgroundColor: ss.bg, color: ss.color }}>{c.status}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>{c.customer}</p>
                <p style={{ fontSize: '12px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue}</p>
                <p style={{ fontSize: '11px', color: C.faint, marginTop: '8px' }}>{c.date}</p>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ backgroundColor: C.white, borderRadius: '24px', padding: '32px', boxShadow: '0 8px 40px rgba(63,101,48,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.green, marginBottom: '6px' }}>{selected.id}</p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: C.text }}>{selected.issue}</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '6px 14px', borderRadius: '9999px', ...(() => { const ss = getStatusStyle(selected.status); return { backgroundColor: ss.bg, color: ss.color }; })() }}>
              {selected.status}
            </span>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: C.surfaceLow, borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            {[
              { key: 'Customer', val: selected.customer },
              { key: 'Priority', val: selected.priority, color: getPriorityColor(selected.priority) },
              { key: 'Date Filed', val: selected.date },
              { key: 'Status', val: selected.status },
            ].map(m => (
              <div key={m.key}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: '4px' }}>{m.key}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: m.color ?? C.text }}>{m.val}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '10px' }}>Resolution Notes</p>
            <textarea
              style={{
                width: '100%', minHeight: '120px', padding: '14px', borderRadius: '14px',
                border: '1px solid rgba(195,201,187,0.4)', outline: 'none', resize: 'vertical',
                backgroundColor: C.surfaceLow, color: C.text, fontSize: '13px',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              placeholder="Add resolution notes here..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => alert(`Issue ${selected.id} marked as resolved.`)}
              style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: C.green, color: '#fff', fontSize: '14px', fontWeight: 700, transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c4b21'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.green}
            >
              Mark as Resolved
            </button>
            <button 
              onClick={() => alert(`Issue ${selected.id} escalated to management.`)}
              style={{ padding: '14px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: C.errorBg, color: C.error, fontSize: '14px', fontWeight: 600, transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffc0be'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.errorBg}
            >
              Escalate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
