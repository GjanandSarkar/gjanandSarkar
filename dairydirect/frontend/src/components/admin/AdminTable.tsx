"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminTableColumn {
  header: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface AdminTableProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  columns: AdminTableColumn[];
  children?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function AdminTable({
  title,
  subtitle,
  headerAction,
  columns,
  children,
  isLoading = false,
  isEmpty = false,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display at this time.',
  className,
  footer,
}: AdminTableProps) {
  // Progressive edge blur indicators for mobile/overflow table scrolling (Edit #40)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children, isLoading, isEmpty, checkScroll]);

  return (
    <div
      className={cn(
        "rounded-[16px] overflow-hidden border border-border/80 shadow-xs transition-shadow",
        className
      )}
      style={{
        background: 'var(--color-surface-container-lowest)',
        borderColor: 'rgba(195,201,187,0.3)',
      }}
    >
      {/* Optional Card Top Header */}
      {(title || headerAction) && (
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(195,201,187,0.2)' }}
        >
          <div>
            {typeof title === 'string' ? (
              <h2 className="font-bold text-[15px] text-foreground tracking-tight">
                {title}
              </h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Main Table Area with Progressive Edge Blur (Edit #40) */}
      <div className="relative w-full overflow-hidden">
        {/* Left Progressive Edge Blur */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none transition-opacity" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto no-scrollbar"
        >
          <table className="w-full min-w-[640px] md:min-w-full text-left border-collapse">
            <thead>
              <tr
                style={{
                  background: 'var(--color-surface-container-low)',
                  borderBottom: '1px solid rgba(195,201,187,0.25)',
                }}
              >
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{ width: col.width }}
                    className={cn(
                      "px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider text-foreground-muted whitespace-nowrap",
                      col.align === 'right' && "text-right",
                      col.align === 'center' && "text-center",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/25">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-16 text-center text-foreground-muted"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs font-semibold">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center mb-3 text-foreground-muted">
                        <EmptyIcon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <p className="font-bold text-sm text-foreground">
                        {emptyTitle}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        {emptyDescription}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                children
              )}
            </tbody>
          </table>
        </div>

        {/* Right Progressive Edge Blur */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none transition-opacity" />
        )}
      </div>

      {/* Optional Table Footer */}
      {footer && (
        <div
          className="px-6 py-3 border-t bg-surface-container-low/40"
          style={{ borderColor: 'rgba(195,201,187,0.2)' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
