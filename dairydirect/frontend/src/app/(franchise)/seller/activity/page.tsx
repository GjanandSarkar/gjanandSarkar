"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { History, AlertCircle, RefreshCw } from 'lucide-react';
import { PageShell } from '@/components/franchise/PageShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

/** Plain-English label for an action code, falling back to the raw code. */
const ACTION_LABELS: Record<string, string> = {
  'product.create': 'Created a product',
  'product.update': 'Updated a product',
  'product.delete': 'Deleted a product',
  'product.activate': 'Made a product visible',
  'product.deactivate': 'Hid a product',
  'product.approve': 'Product approved',
  'product.reject': 'Product rejected',
  'stock.update': 'Adjusted stock',
  'order.status_update': 'Changed an order status',
  'order.cancel': 'Cancelled an order',
  'return.approve': 'Approved a return',
  'return.reject': 'Rejected a return',
};

function labelFor(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ');
}

function badgeVariantFor(action: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'navy' {
  if (action.includes('create') || action.includes('approve') || action.includes('activate')) return 'success';
  if (action.includes('delete') || action.includes('reject') || action.includes('cancel')) return 'danger';
  if (action.includes('update') || action.includes('stock')) return 'info';
  return 'neutral';
}

export default function SellerActivityPage() {
  const [logs, setLogs] = useState<AuditRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/seller/audit?limit=100', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not load your activity');
      setLogs(body.logs ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load activity');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <PageShell
      title="Activity Log"
      subtitle="A historical record of actions and administrative changes made on your store console."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          loading={isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      }
    >
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-md)] p-3 text-xs bg-danger-bg border border-danger/20 text-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />
          <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-foreground-muted" />}
          title="No activity recorded yet"
          description="Changes you make to store inventory, product listings, and order fulfillment will be logged here."
        />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                    Action
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                    Target Entity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-foreground-muted whitespace-nowrap align-top tabular">
                      {new Date(row.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariantFor(row.action)} size="sm">
                          {labelFor(row.action)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-foreground align-top">
                      <span className="capitalize font-medium text-foreground">
                        {row.entity_type?.replace(/_/g, ' ')}
                      </span>
                      {row.entity_id && (
                        <span className="block font-mono text-[11px] text-foreground-muted break-all mt-0.5">
                          {row.entity_id.length > 40 ? `${row.entity_id.slice(0, 40)}…` : row.entity_id}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
