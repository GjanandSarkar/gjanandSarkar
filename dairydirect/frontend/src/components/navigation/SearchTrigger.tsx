"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 w-full max-w-xl h-12 px-4 rounded-xl transition-all cursor-pointer",
        "bg-surface-muted hover:bg-[#eeeee7] border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
        className
      )}
      aria-label="Search for products"
    >
      <Search className="w-5 h-5 text-foreground-muted shrink-0" />
      <span className="text-body-md text-foreground-muted text-left flex-1 truncate">
        Search for milk, paneer, curd...
      </span>
    </button>
  );
}
