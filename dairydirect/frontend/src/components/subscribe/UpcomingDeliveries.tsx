"use client";

import { CalendarCheck, Droplets, Info } from 'lucide-react';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { format, addDays } from 'date-fns';

interface UpcomingDeliveriesProps {
  activeSubscriptions: SubscriptionWithProduct[];
}

export function UpcomingDeliveries({ activeSubscriptions }: UpcomingDeliveriesProps) {
  if (activeSubscriptions.length === 0) return null;

  // Since true frequencies (e.g., Alternate Day, Weekly) are not yet in the schema,
  // we simulate the next 3 days assuming a daily delivery pattern for visualization purposes.
  const today = new Date();
  const nextDays = [addDays(today, 1), addDays(today, 2), addDays(today, 3)];

  const totalDailyVolume = activeSubscriptions.reduce((sum, sub) => sum + sub.volume, 0);

  return (
    <div className="bg-primary/5 rounded-[24px] p-5 border border-primary/10 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-dark tracking-wide">Simulated Schedule</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70">
              {totalDailyVolume}L Daily Volume
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
          <Info className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Demo View</span>
        </div>
      </div>
      
      <p className="text-xs text-muted mb-4 leading-relaxed">
        This is a temporary visualization assuming daily frequency. Actual delivery dates are based on farm schedules.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {nextDays.map((date, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-[16px] p-3 border border-sand/50 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            {idx === 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-mint" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
              {idx === 0 ? 'Tomorrow' : format(date, 'EEE')}
            </span>
            <span className="text-xl font-black text-dark leading-none mb-2">
              {format(date, 'd')}
            </span>
            <div className="inline-flex items-center gap-1 bg-mint/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
              <Droplets className="w-3 h-3" /> {totalDailyVolume}L
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
