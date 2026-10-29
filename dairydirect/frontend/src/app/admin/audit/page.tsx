"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Settings, Activity } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=100');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading audit logs...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-foreground-muted">Track all administrative actions and system modifications.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border text-sm text-foreground-muted uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Admin</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Entity</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-surface-muted">
                <td className="px-6 py-4 text-sm text-foreground-muted">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-info-bg text-info flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{log.profiles?.name || 'System'}</div>
                      <div className="text-xs text-foreground-muted">{log.ip_address || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    log.action.includes('delete') ? 'bg-error-bg text-error' :
                    log.action.includes('update') ? 'bg-info-bg text-info' :
                    'bg-success-bg text-success'
                  }`}>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-foreground">{log.entity_type}</div>
                  <div className="text-xs text-foreground-muted font-mono">{log.entity_id?.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <details className="text-xs cursor-pointer group">
                    <summary className="font-medium text-info outline-none">View Changes</summary>
                    <div className="mt-2 p-2 bg-surface-muted rounded border border-border overflow-x-auto">
                      {log.old_data && (
                        <div className="mb-2">
                          <span className="font-bold text-error block">Old:</span>
                          <pre className="text-xs">{JSON.stringify(log.old_data, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <span className="font-bold text-success block">New:</span>
                          <pre className="text-xs">{JSON.stringify(log.new_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-foreground-muted">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
