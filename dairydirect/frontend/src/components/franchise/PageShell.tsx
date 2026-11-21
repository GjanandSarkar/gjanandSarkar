import React from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ title, subtitle, actions, children, className }: PageShellProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-body-sm text-foreground-muted">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </header>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

