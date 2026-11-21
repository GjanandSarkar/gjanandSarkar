"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function AdminHeader({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  actions,
  children,
  className,
}: AdminHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 sm:px-6 md:px-10 pt-20 md:pt-6 pb-5 bg-surface border-b border-border transition-colors",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div className="space-y-0.5">
          <h1 className="font-semibold text-[24px] md:text-[26px] tracking-tight text-foreground leading-snug">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-foreground-muted font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Refresh button and primary actions (ordered matching admin homepage) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-[12px] border border-border bg-surface hover:bg-surface-muted text-foreground transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95"
              title="Refresh data"
            >
              <RefreshCw
                className={cn("w-4 h-4 text-primary", isRefreshing && "animate-spin")}
              />
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Optional filter/search controls below navbar */}
      {children && <div className="mt-2 pt-2 border-t border-border/60">{children}</div>}
    </div>
  );
}
