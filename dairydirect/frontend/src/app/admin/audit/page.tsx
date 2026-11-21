"use client";

import React, { useState, useEffect } from 'react';
import { User, RefreshCw } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toneFor } from '@/lib/statusTone';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
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
  );
}
