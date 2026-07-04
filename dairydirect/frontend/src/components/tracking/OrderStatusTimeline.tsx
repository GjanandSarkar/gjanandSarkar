"use client";

import { Check, PackageCheck, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/api/orders';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const statuses = [
  { id: 'pending', label: 'Order Received', icon: Check },
  { id: 'confirmed', label: 'Preparing', icon: PackageCheck },
  { id: 'out_for_delivery', label: 'Out For Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  // If cancelled, show a different state entirely, but for the timeline, we assume happy path or aborted path
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-center">
        <h3 className="text-red-700 font-bold mb-1">Order Cancelled</h3>
        <p className="text-red-600/80 text-sm font-medium">This order has been cancelled.</p>
      </div>
    );
  }

  const currentIndex = statuses.findIndex(s => s.id === currentStatus);
  // If status is not found (shouldn't happen) or is something else, default to 0
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-sand">
      <h3 className="text-base font-black text-dark mb-6">Track Order</h3>
      
      <div className="relative">
        <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-sand" />
        
        <div className="absolute left-[15px] top-4 w-[2px] bg-primary transition-all duration-500 ease-in-out" 
             style={{ height: `${(activeIndex / (statuses.length - 1)) * 100}%` }} />

        <div className="space-y-8 relative">
          {statuses.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.id} className="flex gap-4 items-start">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-colors duration-300",
                  isActive ? "bg-primary text-white" : "bg-white border-2 border-sand text-muted"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="pt-1.5 flex-1">
                  <h4 className={cn(
                    "text-sm font-bold",
                    isActive ? "text-dark" : "text-muted"
                  )}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <p className="text-xs text-primary font-medium mt-1 animate-pulse">
                      Currently in progress...
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
