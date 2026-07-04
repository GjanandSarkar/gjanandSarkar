"use client";

import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  className?: string;
}

export function LocationSelector({ className }: LocationSelectorProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-start justify-center transition-all hover:opacity-80 active:scale-95 group text-left",
        className
      )}
      aria-label="Select delivery location"
    >
      <div className="flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
        <span className="text-[12px] md:text-caption font-bold text-foreground">Delivery in 10 mins</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[11px] md:text-[13px] text-foreground-muted line-clamp-1 max-w-[120px] md:max-w-[200px]">
          Home - 123 Dairy Road, Vasant Kunj
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0 group-hover:text-foreground transition-colors" />
      </div>
    </button>
  );
}
