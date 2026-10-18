"use client";

import { Check, PackageCheck, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/api/orders';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const statuses = [
  { id: 'pending', label: 'Order Received', icon: Check },
  { id: 'confirmed', label: 'Packing at Farm', icon: PackageCheck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
        <h3 className="text-rose-600 font-bold text-sm mb-0.5">Order Cancelled</h3>
        <p className="text-muted text-xs">This order has been cancelled.</p>
      </div>
    );
  }

  const currentIndex = statuses.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Order Progress</h3>
      
      <div className="relative pl-1">
        <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-border" />
        
        <div 
          className="absolute left-[15px] top-3 w-[2px] bg-primary transition-all duration-500" 
          style={{ height: `${(activeIndex / (statuses.length - 1)) * 100}%` }} 
        />

        <div className="space-y-6 relative">
          {statuses.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.id} className="flex gap-3 items-start">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors border",
                  isActive ? "bg-primary border-primary text-foreground-inverse shadow-xs" : "bg-surface border-border text-muted"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="pt-1 flex-1 min-w-0">
                  <h4 className={cn(
                    "text-xs font-bold leading-tight",
                    isActive ? "text-foreground" : "text-muted"
                  )}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <p className="text-[11px] text-primary font-semibold mt-0.5">
                      Current status
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
