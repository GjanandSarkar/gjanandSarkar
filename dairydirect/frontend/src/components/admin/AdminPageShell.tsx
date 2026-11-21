'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export interface AdminBreadcrumb {
  label: string;
  href?: string;
}

export interface AdminPageShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  className?: string;
}

export function AdminPageShell({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  children,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: AdminPageShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className={cn('min-h-full flex flex-col', className)}>
      {/* ─── Sticky Header (h-14) ─── */}
      <header className="h-14 border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
        {/* Left: Breadcrumbs / Title */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[11px] text-foreground-muted mb-0.5">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-border shrink-0" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium truncate">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground truncate font-[family-name:var(--font-display)]">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: ⌘K Jump Trigger + Page Actions */}
        <div className="flex items-center gap-2.5 shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="h-8 px-2.5 rounded-[var(--radius-md)] border border-border bg-surface-muted/60 text-xs text-foreground-muted flex items-center gap-2 hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open command palette"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Search or jump to…</span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] font-mono font-medium bg-surface border border-border text-foreground-muted">
              ⌘K
            </kbd>
          </button>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      {/* ─── Sub-header / Description or Tabs Bar ─── */}
      {(description || tabs) && (
        <div className="border-b border-border bg-surface/40 px-4 md:px-6 py-2.5">
          {description && (
            <p className="text-xs text-foreground-muted leading-relaxed">
              {description}
            </p>
          )}
          {tabs && <div className="mt-2">{tabs}</div>}
        </div>
      )}

      {/* ─── Page Content Area ─── */}
      <main className="flex-1 w-full max-w-[var(--w-admin)] mx-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3 rounded-[var(--radius-md)]" />
            <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
          </div>
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="w-8 h-8 text-danger" />}
            title="Failed to load screen data"
            description={typeof error === 'string' ? error : error.message || 'An unexpected error occurred while loading this view.'}
            action={
              onRetry ? (
                <Button variant="navy" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        ) : (
          children
        )}
      </main>

      {/* ─── Integrated Command Palette ─── */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}

