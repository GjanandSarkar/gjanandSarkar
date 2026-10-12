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
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Track all administrative actions and system modifications.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Admin</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Entity</th>
              <th className="px-6 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{log.profiles?.name || 'System'}</div>
                      <div className="text-xs text-gray-500">{log.ip_address || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    log.action.includes('delete') ? 'bg-red-100 text-red-700' :
                    log.action.includes('update') ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{log.entity_type}</div>
                  <div className="text-xs text-gray-500 font-mono">{log.entity_id?.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <details className="text-xs cursor-pointer group">
                    <summary className="font-medium text-blue-600 outline-none">View Changes</summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 overflow-x-auto">
                      {log.old_data && (
                        <div className="mb-2">
                          <span className="font-bold text-red-600 block">Old:</span>
                          <pre className="text-[10px]">{JSON.stringify(log.old_data, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <span className="font-bold text-green-600 block">New:</span>
                          <pre className="text-[10px]">{JSON.stringify(log.new_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
