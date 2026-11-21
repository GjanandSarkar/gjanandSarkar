"use client";

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminToolbarPill {
  id: string;
  label: string;
  count?: number;
}

export interface AdminToolbarProps {
  pills?: AdminToolbarPill[];
  activePill?: string;
  onPillChange?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdminToolbar({
  pills,
  activePill,
  onPillChange,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  actions,
  children,
  className,
}: AdminToolbarProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-2xl border border-border p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors",
        className
      )}
    >
      {/* Left: Filter Pills */}
      {pills && pills.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto shrink-0">
          {pills.map((pill) => {
            const isActive = activePill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onPillChange?.(pill.id)}
                className={cn(
                  "whitespace-nowrap h-8 px-3.5 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border active:scale-95",
                  isActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted"
                )}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-surface-muted text-foreground-muted"
                    )}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Right: Search & Action buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-0 md:w-64">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-border bg-surface text-xs font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {actions && <div className="shrink-0 flex items-center">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
