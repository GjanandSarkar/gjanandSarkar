'use client';

import { Plus, Pause, Play, MoreHorizontal } from 'lucide-react';

const subscriptions = [
  { id: 'SUB-001', customer: 'Priya Sharma', plan: 'Premium Dairy', frequency: 'Daily', nextDelivery: 'Oct 25, 2023', amount: '₹82', status: 'Active' },
  { id: 'SUB-002', customer: 'Rahul Mehta', plan: 'Basic Milk', frequency: 'Weekly', nextDelivery: 'Oct 28, 2023', amount: '₹260', status: 'Active' },
  { id: 'SUB-003', customer: 'Deepa Nair', plan: 'Family Pack', frequency: 'Bi-Weekly', nextDelivery: '—', amount: '₹520', status: 'Paused' },
  { id: 'SUB-004', customer: 'Arjun Kumar', plan: 'Basic Milk', frequency: 'Daily', nextDelivery: 'Oct 25, 2023', amount: '₹65', status: 'Active' },
  { id: 'SUB-005', customer: 'Anita Patel', plan: 'Ghee & Paneer', frequency: 'Monthly', nextDelivery: 'Nov 01, 2023', amount: '₹1,200', status: 'Active' },
];

export default function AdminSubscriptionsPage() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="font-semibold text-sm tracking-wider uppercase" style={{ color: '#3f6530' }}>Management</p>
          <h2 className="text-3xl font-bold tracking-tight mt-1" style={{ color: '#1a1c18' }}>Subscriptions</h2>
        </div>
        <button 
          onClick={() => alert("Open 'Add Subscription' flow")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: '#3f6530', color: '#ffffff' }}>
          <Plus className="w-4 h-4" /> Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Active', value: '2,840', color: '#3f6530', bg: '#c2efac' },
          { label: 'Paused', value: '142', color: '#8a5025', bg: '#ffdcc7' },
          { label: 'New This Week', value: '48', color: '#3b644c', bg: '#bfedce' },
          { label: 'Cancelled', value: '12', color: '#ba1a1a', bg: '#ffdad6' },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={{ backgroundColor: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-medium mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 12px 40px rgba(63,101,48,0.05)' }}>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-widest border-b" style={{ color: '#73796d', borderColor: '#eeeee7' }}>
                {['ID', 'Customer', 'Plan', 'Frequency', 'Next Delivery', 'Amount', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id} className="border-b hover:bg-[#f4f4ed]/50 transition-colors" style={{ borderColor: '#eeeee7' }}>
                  <td className="px-6 py-5 text-xs font-semibold" style={{ color: '#3f6530' }}>{sub.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#c2efac', color: '#3f6530' }}>
                        {sub.customer[0]}
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#1a1c18' }}>{sub.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm" style={{ color: '#43493e' }}>{sub.plan}</td>
                  <td className="px-6 py-5 text-sm" style={{ color: '#43493e' }}>{sub.frequency}</td>
                  <td className="px-6 py-5 text-sm" style={{ color: '#43493e' }}>{sub.nextDelivery}</td>
                  <td className="px-6 py-5 text-sm font-bold" style={{ color: '#3f6530' }}>{sub.amount}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 text-[10px] font-bold rounded-full"
                      style={{
                        backgroundColor: sub.status === 'Active' ? '#c2efac' : '#ffdcc7',
                        color: sub.status === 'Active' ? '#042100' : '#6e3910',
                      }}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      style={{ color: '#73796d' }}
                      onClick={() => alert(`Showing details for subscription ${sub.id}`)}
                    >
                      <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-[#3f6530] transition-colors" />
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
