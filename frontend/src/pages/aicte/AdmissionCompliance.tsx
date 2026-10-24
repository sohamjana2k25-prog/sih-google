import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, RotateCw, Download, FileText, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

export const AdmissionCompliance: React.FC = () => {
  const [violations, setViolations] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('inst-kolkata-01');
  const [complianceSummary, setComplianceSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedInstId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, iRes, cRes] = await Promise.all([
        api.getViolations(),
        api.getInstitutions(),
        selectedInstId ? api.getInstitutionCompliance(selectedInstId) : Promise.resolve(null),
      ]);
      setViolations(vRes.alerts);
      setInstitutions(iRes.institutions);
      setComplianceSummary(cRes);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.recalculateCompliance();
      await loadData();
    } catch (err) {
      console.error('Recalculation error:', err);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admission & Intake Compliance Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time audit comparing institutional admissions against AICTE-sanctioned regular, category, and supernumerary quotas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Compliance Engine</span>
          </button>
        </div>
      </div>

      {/* Active Compliance Infractions Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-900">
                Active Regulatory Infraction: Unsanctioned Intake Excess Detected
              </h3>
              <span className="text-xs font-mono font-semibold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded">
                CRITICAL REGULATORY ALERT
              </span>
            </div>
            <p className="mt-1 text-xs text-rose-800 leading-relaxed">
              <strong>Tech Institute of Technology, Kolkata</strong> has reported <strong>145</strong> regular admissions in B.Tech Computer Science and Engineering against an approved AICTE ceiling of <strong>120</strong> seats. Potential excess: <strong>+25 unapproved admissions</strong> (120.8% capacity utilization).
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setSelectedInstId('inst-kolkata-01')}
                className="text-xs font-bold text-rose-900 hover:text-rose-950 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Audit College A Records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Institution Selector & Compliance Inspector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Institutional Intake Audit Ledger</h2>
            <p className="text-xs text-slate-500">Select an institution to inspect sanctioned intake vs active enrolments</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">Institution:</label>
            <select
              value={selectedInstId}
              onChange={e => setSelectedInstId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Institution Summary Strip */}
        {complianceSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Sanctioned Seats</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                {complianceSummary.totalApprovedIntake}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Admissions</p>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                {complianceSummary.totalActiveEnrolment}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Intake Utilization</p>
              <p
                className={`text-xl font-bold font-mono mt-1 ${
                  complianceSummary.overallUtilization > 100
                    ? 'text-rose-700'
                    : 'text-slate-900'
                }`}
              >
                {complianceSummary.overallUtilization}%
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Regulatory Integrity</p>
              <div className="mt-1">
                <StatusBadge
                  status={complianceSummary.hasViolations ? 'VIOLATION' : 'COMPLIANT'}
                  size="sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Programme Level Audit Table */}
        {complianceSummary && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Programme & Degree</th>
                  <th className="py-3 px-4 text-center">Approved Regular Intake</th>
                  <th className="py-3 px-4 text-center">Reported Regular</th>
                  <th className="py-3 px-4 text-center">NRI Quota</th>
                  <th className="py-3 px-4 text-center">Supernumerary (PMSSS/TFW)</th>
                  <th className="py-3 px-4 text-center">Utilization</th>
                  <th className="py-3 px-4 text-center">Remaining / Excess</th>
                  <th className="py-3 px-4 text-right">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {complianceSummary.programmes.map((p: any) => {
                  const isViolation = p.excessAdmissions > 0;
                  return (
                    <tr
                      key={p.programmeId}
                      className={isViolation ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.programmeName}
                        <span className="text-slate-500 font-normal ml-1">({p.programmeCode}) - {p.degree}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">{p.approvedIntake}</td>
                      <td className={`py-3.5 px-4 text-center font-mono font-bold ${isViolation ? 'text-rose-700' : 'text-slate-900'}`}>
                        {p.regularAdmissions}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{p.nriAdmissions}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">{p.supernumeraryAdmissions}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isViolation
                              ? 'bg-rose-200 text-rose-900'
                              : p.utilizationPercentage >= 95
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {p.utilizationPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium">
                        {isViolation ? (
                          <span className="text-rose-700 font-bold">+{p.excessAdmissions} Excess</span>
                        ) : (
                          <span className="text-emerald-700">{p.remainingCapacity} Available</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={p.complianceStatus} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Download Compliance Certificate / Report */}
        {selectedInstId && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Official AICTE Admission Compliance Report</span>
            <a
              href={api.getInstitutionReportPdfUrl(selectedInstId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate Signed PDF Report</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
