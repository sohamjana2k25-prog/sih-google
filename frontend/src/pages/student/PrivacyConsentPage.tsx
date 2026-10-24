import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, XCircle, Clock, Eye, AlertCircle, Info } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const PrivacyConsentPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.studentId || 'student-priya-das';

  const [consents, setConsents] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsentData();
  }, [studentId]);

  const loadConsentData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        api.getStudentConsents(studentId),
        api.getDataAccessLogs(studentId),
      ]);
      setConsents(cRes.consents);
      setAccessLogs(lRes.logs);
    } catch (err) {
      console.error('Failed to load consent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveConsent(id);
      await loadConsentData();
    } catch (err: any) {
      alert('Error approving consent: ' + err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectConsent(id);
      await loadConsentData();
    } catch (err: any) {
      alert('Error rejecting consent: ' + err.message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.revokeConsent(id);
      await loadConsentData();
    } catch (err: any) {
      alert('Error revoking consent: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Data Privacy & Consent Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Full transparency and cryptographic control over which third-party organizations can access your academic records.
        </p>
      </div>

      {/* Distinction Info Alert */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong>Regulatory Mandate vs Optional Third-Party Consent:</strong>
          <p className="text-blue-800 leading-relaxed font-medium">
            Institutional enrolment audits conducted by AICTE operate under statutory regulatory authority. Optional consent controls apply to private third-party employers, external background check agencies, and recruitment portals.
          </p>
        </div>
      </div>

      {/* Consent Requests Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Third-Party Verification Consent Requests
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {consents.length} Request(s) Logged
          </span>
        </div>

        <div className="space-y-3">
          {consents.map(c => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {c.requester_type}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{c.requester_name}</h4>
                  <p className="text-slate-600 mt-0.5 font-medium">{c.purpose}</p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 font-mono">
                Requested Data Scope: <strong>{c.requested_fields}</strong>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-mono">
                  Requested: {new Date(c.requested_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {c.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReject(c.id)}
                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(c.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        Approve Limited Sharing
                      </button>
                    </>
                  )}
                  {c.status === 'APPROVED' && (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Revoke Sharing Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {consents.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No pending third-party data requests.
            </div>
          )}
        </div>
      </div>

      {/* Transparent Access Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personal Data Access Audit Log
          </h3>
          <span className="text-xs text-slate-500 font-mono">{accessLogs.length} Records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {accessLogs.map(log => (
            <div key={log.id} className="py-3 text-xs flex items-start justify-between">
              <div>
                <span className="font-bold text-slate-900">{log.accessed_by}</span>
                <span className="text-slate-400 ml-2 font-mono text-[11px]">• {log.access_type}</span>
                <p className="text-slate-600 text-[11px] mt-0.5">Purpose: {log.purpose}</p>
                <p className="text-slate-500 text-[10px] font-mono mt-0.5">Disclosed: {log.fields_accessed}</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}

          {accessLogs.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent external access events recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
