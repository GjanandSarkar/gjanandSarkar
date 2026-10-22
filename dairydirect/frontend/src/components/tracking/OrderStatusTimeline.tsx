'use client';

import React from 'react';
import { StatusBar, ORDER_STEPS, CANCELLED_STEPS } from '@/components/orders/StatusBar';
import type { OrderStatus } from '@/lib/api/orders';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  times?: Record<string, string>;
}

export function OrderStatusTimeline({ currentStatus, times = {} }: OrderStatusTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';
  const steps = isCancelled ? CANCELLED_STEPS : ORDER_STEPS;

  return (
    <div className="bg-surface rounded-[24px] p-6 shadow-sm border border-sand">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-dark tracking-tight">Order Lifecycle Status</h3>
        {isCancelled && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-error-bg text-error border border-error/20">
            Order Cancelled
          </span>
        )}
      </div>

      <div className="py-2">
        <StatusBar
          steps={steps}
          current={currentStatus}
          times={times}
          failed={isCancelled}
        />
      </div>
    </div>
  );
}
