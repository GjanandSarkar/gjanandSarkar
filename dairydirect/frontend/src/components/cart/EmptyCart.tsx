"use client";

import { Leaf } from 'lucide-react';
import { EmptyState } from '@/components/discovery/EmptyState';

interface EmptyCartProps {
  onActionClick?: () => void;
}

export function EmptyCart({ onActionClick }: EmptyCartProps) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
      <EmptyState type="cart" onClear={onActionClick} />

      {/* Brand Messaging */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl border border-green-100 flex items-start gap-3 text-left w-full max-w-[300px]">
        <div className="w-8 h-8 rounded-full bg-white text-green-600 flex items-center justify-center shrink-0 shadow-sm border border-green-50">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-[12px] text-green-900 mb-0.5">The GjanandSarkar Promise</h4>
          <p className="text-[11px] text-green-800/80 leading-snug">Pure, natural dairy products delivered straight to your door.</p>
        </div>
      </div>
    </div>
  );
}
