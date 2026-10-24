import React, { useEffect, useState } from 'react';
import { FileEdit, CheckCircle2, XCircle, Clock, FileText, Check, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const CorrectionReviewPage: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.institutionId || 'inst-kolkata-01';

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [instId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getCorrections({ institutionId: instId });
      setRequests(res.requests);
      if (res.requests.length > 0 && !selectedRequest) {
        setSelectedRequest(res.requests[0]);
      }
    } catch (err) {
      console.error('Failed to load correction requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await api.reviewCorrection(selectedRequest.id, {
        decision,
        comments: comments || `Administrative action by ${user?.name || 'College Registrar'}.`,
      });
      alert(`Correction request marked as ${decision}. Underlying student records and conflict network synchronized.`);
      setComments('');
      await loadRequests();
    } catch (err: any) {
      alert('Error updating request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Record Correction Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review discrepancies reported by students regarding inaccurate names, programmes, or outdated enrolment statuses.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
          {requests.filter(r => r.status === 'SUBMITTED').length} Pending Action
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Requests List Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Submitted Discrepancy Tickets
            </h3>
            <span className="text-xs text-slate-500 font-mono">{requests.length} Total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.map(req => {
              const isSelected = selectedRequest?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-900">{req.student_name}</span>
                      <span className="text-slate-400 font-mono text-[11px] ml-2">
                        {req.apaar_id_masked}
                      </span>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Field to Correct: <span className="text-blue-700 font-mono font-bold">{req.field_name}</span>
                      </p>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Current:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 line-through">
                      {req.current_value}
                    </span>
                    <span className="text-slate-400">→ Proposed:</span>
                    <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-800 font-bold">
                      {req.proposed_value}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-1 italic">
                    Reason: "{req.reason}"
                  </p>
                </div>
              );
            })}

            {requests.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-400">
                No correction requests found for this institution.
              </div>
            )}
          </div>
        </div>

        {/* Action Panel for Selected Request */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          {selectedRequest ? (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Correction Request Dossier</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Ticket ID: {selectedRequest.id}</p>
                </div>
                <StatusBadge status={selectedRequest.status} size="sm" />
              </div>

              {/* Student Demographics & Roll */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-900">{selectedRequest.student_name}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">APAAR:</span>
                  <span className="text-slate-800">{selectedRequest.apaar_id_masked}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="text-slate-800">{selectedRequest.roll_number}</span>
                </div>
              </div>

              {/* Proposed Transformation Card */}
              <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Target Field: {selectedRequest.field_name}
                </span>
                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Existing Value</span>
                    <strong className="text-rose-700">{selectedRequest.current_value}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Proposed Value</span>
                    <strong className="text-emerald-700">{selectedRequest.proposed_value}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/60">
                  <span className="text-slate-500 block text-[11px] font-semibold">Student Justification:</span>
                  <p className="text-slate-700 italic mt-0.5">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.evidence_url && (
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evidence Attached: <strong>{selectedRequest.evidence_url}</strong></span>
                  </div>
                )}
              </div>

              {/* Review Actions if Submitted */}
              {selectedRequest.status === 'SUBMITTED' ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Reviewer Comments & Audit Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter approval or rejection comments..."
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleReviewAction('REJECTED')}
                      disabled={submitting}
                      className="py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Request</span>
                    </button>
                    <button
                      onClick={() => handleReviewAction('APPROVED')}
                      disabled={submitting}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Sync</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                  This request was formally resolved. Decision: <strong>{selectedRequest.status}</strong>.
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a ticket to review evidence.
            </div>
          )}

          <div className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100">
            AICTE Record Correction & Verification Protocol
          </div>
        </div>
      </div>
    </div>
  );
};
