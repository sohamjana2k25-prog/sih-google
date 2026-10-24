import React, { useEffect, useState } from 'react';
import { History, Search, Shield, Clock, FileCheck } from 'lucide-react';
import { api } from '../../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs(100);
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Regulatory Audit Trail Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident, immutable system events recording student registrations, verifications, credentials, and resolutions.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Showing Last <span className="font-bold text-slate-900 font-mono">{logs.length}</span> Application Events
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor ID / Email</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Event Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {log.user_email || log.user_id || 'SYSTEM_DAEMON'}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {log.entity_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
