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
<<<<<<< HEAD
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl border border-green-100 flex items-start gap-3 text-left w-full max-w-[300px]">
        <div className="w-8 h-8 rounded-full bg-surface text-success flex items-center justify-center shrink-0 shadow-sm border border-green-50">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-[12px] text-green-900 mb-0.5">The GjanandSarkar Promise</h4>
          <p className="text-xs text-green-800/80 leading-snug">Verified Indian brands across every category, delivered to your door.</p>
=======
      <div className="p-3.5 bg-surface rounded-xl border border-border flex items-start gap-2.5 text-left w-full max-w-[280px]">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Leaf className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-foreground mb-0.5">Farm Fresh Promise</h4>
          <p className="text-[11px] text-muted leading-snug">Verified local dairies and organic farms delivered direct to your door.</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        </div>
      </div>
    </div>
  );
}
