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
    <div className="page-medium px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <History className="w-5 h-5 text-primary" />
        <h1 className="text-xl sm:text-2xl font-black text-dark">Activity Log</h1>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">
        A record of changes made on your seller account. Only your own activity is shown.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]"
          style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {logs === null ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your activity…
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-2xl border border-sand bg-surface">
          <History className="w-10 h-10 mx-auto mb-3 text-on-surface-variant opacity-40" />
          <p className="font-bold text-dark mb-1">No activity yet</p>
          <p className="text-sm text-on-surface-variant">
            Changes you make to products, stock and orders will be listed here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-surface">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="border-b border-sand">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  When
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Action
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Item
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-sand/60 last:border-0">
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant whitespace-nowrap align-top">
                    {new Date(row.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-dark align-top">
                    {labelFor(row.action)}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-on-surface-variant align-top">
                    <span className="capitalize">{row.entity_type?.replace(/_/g, ' ')}</span>
                    {row.entity_id && (
                      <span className="block font-mono text-[11px] opacity-70 break-all">
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
