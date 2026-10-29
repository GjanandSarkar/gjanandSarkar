"use client";

import { useEffect, useState } from 'react';
import { Loader2, History, AlertCircle } from 'lucide-react';

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

export default function SellerActivityPage() {
  const [logs, setLogs] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/seller/audit?limit=100', { credentials: 'include' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Could not load your activity');
        return body;
      })
      .then((body) => {
        if (!cancelled) setLogs(body.logs ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLogs([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Activity Log</h1>
          </div>
          <p className="text-xs text-foreground-muted">
            A chronological record of changes made on your seller account. Only your own activity is shown.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl p-3 text-xs bg-error-bg text-error border border-error/20"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {logs === null ? (
        <div className="flex items-center gap-2 text-xs text-foreground-muted py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading your activity…
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-xl border border-border bg-surface">
          <History className="w-10 h-10 mx-auto mb-3 text-foreground-muted opacity-40" />
          <p className="font-bold text-foreground mb-1 text-sm">No activity yet</p>
          <p className="text-xs text-foreground-muted">
            Changes you make to products, stock and orders will be listed here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
          <table className="w-full min-w-[560px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 text-foreground-muted uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">
                  When
                </th>
                <th className="px-5 py-3.5">
                  Action
                </th>
                <th className="px-5 py-3.5">
                  Item
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((row) => (
                <tr key={row.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-5 py-3.5 text-foreground-muted whitespace-nowrap align-top">
                    {new Date(row.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground align-top">
                    {labelFor(row.action)}
                  </td>
                  <td className="px-5 py-3.5 text-foreground-muted align-top">
                    <span className="capitalize font-medium text-foreground">{row.entity_type?.replace(/_/g, ' ')}</span>
                    {row.entity_id && (
                      <span className="block font-mono text-[11px] opacity-70 break-all mt-0.5">
                        {row.entity_id.length > 40 ? `${row.entity_id.slice(0, 40)}…` : row.entity_id}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
