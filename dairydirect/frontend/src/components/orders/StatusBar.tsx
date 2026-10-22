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
                    : `h-1 flex-1 ${i <= idx ? (bad ? 'bg-error' : 'bg-success') : 'bg-border'}`
                }
              />
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all shadow-sm ${
                  bad
                    ? 'bg-error text-white ring-4 ring-rose-100'
                    : done
                    ? 'bg-success text-white'
                    : active
                    ? 'bg-success text-white ring-4 ring-emerald-100 ring-offset-1'
                    : 'bg-border text-foreground-muted'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <div
                className={
                  last
                    ? 'flex-1 invisible'
                    : `h-1 flex-1 ${i < idx ? (bad ? 'bg-error' : 'bg-success') : 'bg-border'}`
                }
              />
            </div>
            <p
              className={`mt-2.5 text-xs font-semibold leading-tight ${
                bad ? 'text-error' : active ? 'text-success' : done ? 'text-foreground' : 'text-foreground-muted'
              }`}
            >
              {s.label}
            </p>
            {times[s.code] && (
              <p className="mt-1 text-[11px] text-foreground-muted">
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
