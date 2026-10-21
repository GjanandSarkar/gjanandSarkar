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
      <div className="p-3.5 bg-surface rounded-xl border border-border flex items-start gap-2.5 text-left w-full max-w-[280px]">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Leaf className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-foreground mb-0.5">Farm Fresh Promise</h4>
          <p className="text-[11px] text-muted leading-snug">Verified local dairies and organic farms delivered direct to your door.</p>
        </div>
      </div>
    </div>
  );
}
