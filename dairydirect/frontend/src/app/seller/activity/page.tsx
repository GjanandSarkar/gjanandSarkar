"use client";

import { useEffect, useState } from 'react';
import { Loader2, History, AlertCircle } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

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

  const loadAudit = () => {
    fetch('/api/seller/audit?limit=100', { credentials: 'include' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Could not load your activity');
        return body;
      })
      .then((body) => {
        setLogs(body.logs ?? []);
      })
      .catch((e) => {
        setError(e.message);
        setLogs([]);
      });
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader
        title={
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <span>Seller Activity Log</span>
          </div>
        }
        subtitle="A chronological record of changes made on your seller account. Only your own activity is shown"
        onRefresh={loadAudit}
        isRefreshing={logs === null}
      />

      <div className="px-6 md:px-10 py-6 space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl p-3 text-xs bg-red-50 text-red-900 border border-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <AdminTable
          columns={[
            { header: 'When' },
            { header: 'Action' },
            { header: 'Item & Details' },
          ]}
          isLoading={logs === null}
          isEmpty={logs !== null && logs.length === 0}
          emptyIcon={History}
          emptyTitle="No activity yet"
          emptyDescription="Changes you make to products, stock and orders will be listed here."
        >
          {logs?.map((row) => (
            <tr key={row.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
              <td className="px-5 py-3.5 text-foreground-muted whitespace-nowrap text-xs font-mono">
                {new Date(row.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-5 py-3.5 font-bold text-foreground text-xs">
                {labelFor(row.action)}
              </td>
              <td className="px-5 py-3.5 text-foreground-muted text-xs">
                <span className="capitalize font-semibold text-foreground">{row.entity_type?.replace(/_/g, ' ')}</span>
                {row.entity_id && (
                  <span className="block font-mono text-[11px] opacity-70 break-all mt-0.5">
                    {row.entity_id.length > 40 ? `${row.entity_id.slice(0, 40)}…` : row.entity_id}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
