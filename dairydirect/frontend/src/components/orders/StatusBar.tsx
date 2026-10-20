'use client';

import React from 'react';

export type Step = { code: string; label: string };
export type Props = {
  steps: Step[];
  current: string;
  times?: Record<string, string>;
  failed?: boolean;
};

export const ORDER_STEPS: Step[] = [
  { code: 'confirmed', label: 'Confirmed' },
  { code: 'out_for_delivery', label: 'Out for Delivery' },
  { code: 'delivered', label: 'Delivered' },
];

export const CANCELLED_STEPS: Step[] = [
  { code: 'confirmed', label: 'Confirmed' },
  { code: 'out_for_delivery', label: 'Out for Delivery' },
  { code: 'cancelled', label: 'Cancelled' },
];

export const RETURN_STEPS: Step[] = [
  { code: 'initiated', label: 'Initiated' },
  { code: 'picked_up', label: 'Picked Up' },
  { code: 'received', label: 'Received' },
  { code: 'refund_initiated', label: 'Refund Initiated' },
  { code: 'refunded', label: 'Refund' },
];

export const REPLACEMENT_STEPS: Step[] = [
  { code: 'initiated', label: 'Replacement Initiated' },
  { code: 'picked_up', label: 'Picked Up & En Route' },
  { code: 'received', label: 'Item Received' },
  { code: 'completed', label: 'Replacement Complete' },
];

// pending and processing map to the Confirmed visual step
export const orderCode = (s: string) => (s === 'pending' || s === 'processing' ? 'confirmed' : s);

export function StatusBar({ steps, current, times = {}, failed }: Props) {
  const normCurrent = orderCode(current);
  const idx = steps.findIndex((s) => s.code === normCurrent || s.code === current);

  return (
    <ol className="flex w-full items-start">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const done = i < idx || (i === idx && last && !failed);
        const active = i === idx && !done && !failed;
        const bad = failed && i === idx;

        return (
          <li key={s.code} className="flex-1 text-center">
            <div className="flex items-center">
              <div
                className={
                  i === 0
                    ? 'flex-1 invisible'
                    : `h-1 flex-1 ${i <= idx ? (bad ? 'bg-rose-500' : 'bg-emerald-600') : 'bg-gray-200'}`
                }
              />
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all shadow-sm ${
                  bad
                    ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                    : done
                    ? 'bg-emerald-600 text-white'
                    : active
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 ring-offset-1'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <div
                className={
                  last
                    ? 'flex-1 invisible'
                    : `h-1 flex-1 ${i < idx ? (bad ? 'bg-rose-500' : 'bg-emerald-600') : 'bg-gray-200'}`
                }
              />
            </div>
            <p
              className={`mt-2.5 text-xs font-semibold leading-tight ${
                bad ? 'text-rose-600' : active ? 'text-emerald-700' : done ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {s.label}
            </p>
            {times[s.code] && (
              <p className="mt-1 text-[11px] text-gray-500">
                {new Date(times[s.code]).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
