'use client';

import { CheckCircle2, MapPin } from 'lucide-react';

const completed = [
  { id: 'T-003', customer: 'Deepa Nair', address: 'C-12, Silver Oak, Satellite Road', items: 'Low Fat Milk x4', time: '8:02 AM', amount: '₹260' },
];

export default function DeliveryCompletePage() {
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col items-center py-8 mb-8 rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
        <CheckCircle2 className="w-16 h-16 text-white mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Great Work!</h2>
        <p className="text-white/80 text-sm">You&apos;ve completed {completed.length} delivery today</p>
        <div className="mt-6 flex gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{completed.length}</p>
            <p className="text-xs text-white/70">Delivered</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">₹{completed.reduce((s, c) => s + parseInt(c.amount.replace('₹', '')), 0)}</p>
            <p className="text-xs text-white/70">Collected</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1c18' }}>Completed Deliveries</h3>
      <div className="space-y-4">
        {completed.map(task => (
          <div key={task.id} className="p-5 rounded-2xl" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(63,101,48,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: '#3f6530' }}>{task.id}</span>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#3b644c' }}>
                <CheckCircle2 className="w-4 h-4" /> {task.time}
              </div>
            </div>
            <h4 className="font-bold mb-1" style={{ color: '#1a1c18' }}>{task.customer}</h4>
            <p className="text-xs mb-2" style={{ color: '#43493e' }}>{task.items}</p>
            <div className="flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 mt-0.5" style={{ color: '#73796d' }} />
              <p className="text-xs" style={{ color: '#73796d' }}>{task.address}</p>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="font-bold" style={{ color: '#3f6530' }}>{task.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
