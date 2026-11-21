"use client";

import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Clock, User, FileText, Settings, Activity, ShieldCheck, History } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
=======
import { User, RefreshCw } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toneFor } from '@/lib/statusTone';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
<<<<<<< HEAD
=======
    setError(null);
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    try {
      const res = await fetch('/api/admin/audit?limit=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load audit logs');
      setLogs(data.logs || []);
    } catch (e: any) {
      setError(e.message || 'Error loading logs');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Audit Logs"
        subtitle="Track administrative actions, system events, and data changes"
        onRefresh={fetchLogs}
        isRefreshing={loading}
      />

      <div className="px-6 md:px-10 py-6">
        <AdminTable
          columns={[
            { header: 'Timestamp' },
            { header: 'Administrator' },
            { header: 'Action' },
            { header: 'Entity' },
            { header: 'Changes & Data' },
          ]}
          isLoading={loading}
          isEmpty={!loading && logs.length === 0}
          emptyIcon={History}
          emptyTitle="No audit logs recorded"
          emptyDescription="Administrative operations and changes will appear here in chronological order."
        >
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
              <td className="px-5 py-3.5 text-xs text-foreground-muted">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                  <span>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[13px] text-foreground block">
                      {log.profiles?.name || 'System Admin'}
                    </span>
                    <span className="text-[11px] text-foreground-muted font-mono block">
                      {log.ip_address || 'Internal'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    log.action.includes('delete')
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      : log.action.includes('update')
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                  }`}
                >
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[13px] font-medium text-foreground block">
                  {log.entity_type}
                </span>
                <span className="text-[11px] text-foreground-muted font-mono">
                  {log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '—'}
                </span>
              </td>
              <td className="px-5 py-3.5 max-w-xs">
                <details className="text-xs cursor-pointer group">
                  <summary className="font-semibold text-primary outline-none hover:underline">
                    View payload diff
                  </summary>
                  <div className="mt-2 p-2.5 bg-surface-container-low rounded-xl border border-border/80 overflow-x-auto">
                    {log.old_data && (
                      <div className="mb-2">
                        <span className="font-bold text-red-600 block text-[11px]">Previous State:</span>
                        <pre className="text-[11px] font-mono text-foreground-muted mt-0.5">{JSON.stringify(log.old_data, null, 2)}</pre>
                      </div>
                    )}
                    {log.new_data && (
                      <div>
                        <span className="font-bold text-green-600 block text-[11px]">Updated State:</span>
                        <pre className="text-[11px] font-mono text-foreground-muted mt-0.5">{JSON.stringify(log.new_data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
=======
  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<any>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (log) => (
        <span className="tabular text-foreground-muted">
          {new Date(log.created_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'admin_id',
      header: 'Admin',
      render: (log) => (
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <User className="w-3.5 h-3.5 text-foreground-muted" />
          <span>{log.profiles?.name || log.admin_id?.slice(0, 8) || 'System Admin'}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (log) => (
        <Badge variant={toneFor(log.action)} size="sm">
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity',
      render: (log) => (
        <span className="capitalize text-foreground font-mono text-[11px]">
          {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 6)})` : ''}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Changes',
      render: (log) => {
        if (!log.old_data && !log.new_data) return <span className="text-foreground-muted">—</span>;
        return (
          <details className="text-[11px] cursor-pointer">
            <summary className="text-secondary hover:underline font-medium">View details</summary>
            <div className="mt-1 p-2 bg-surface-muted rounded text-[10px] font-mono space-y-1">
              {log.old_data && <div className="text-danger truncate">Old: {JSON.stringify(log.old_data)}</div>}
              {log.new_data && <div className="text-success truncate">New: {JSON.stringify(log.new_data)}</div>}
            </div>
          </details>
        );
      },
    },
  ];

  return (
    <AdminPageShell
      title="Audit Log"
      description="Track administrative actions, entity mutations, and governance history."
      breadcrumbs={[{ label: 'System' }, { label: 'Audit Log' }]}
      actions={
        <Button variant="outline" size="sm" onClick={fetchLogs} loading={loading} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        error={error}
        onRetry={fetchLogs}
        emptyTitle="No audit records"
        emptyDescription="System modifications and admin changes will be recorded here."
      />
    </AdminPageShell>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
  );
}
