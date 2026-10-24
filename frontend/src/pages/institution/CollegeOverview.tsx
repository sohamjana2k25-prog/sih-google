import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UploadCloud,
  Calculator,
  UserPlus,
  Download,
  Building2,
  Clock,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface CollegeOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const CollegeOverview: React.FC<CollegeOverviewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const instId = user?.institutionId || 'inst-kolkata-01';

  const [stats, setStats] = useState<any | null>(null);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollegeData();
  }, [instId]);

  const loadCollegeData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.getInstitutionStats(instId),
        api.getInstitutionCompliance(instId),
      ]);
      setStats(sRes);
      setCompliance(cRes);
    } catch (err) {
      console.error('Failed to load college stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* College Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{stats.name}</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              AICTE ID: {stats.aicteId}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Institutional Student Data Administration, APAAR Batch Verification & Sanctioned Seat Compliance.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('college-upload')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Smart Bulk Upload</span>
          </button>
          <button
            onClick={() => onNavigateTab('college-simulator')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span>Admission Simulator</span>
          </button>
        </div>
      </div>

      {/* Intake Infraction Alert for College A */}
      {stats.hasViolations && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 shadow-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                AICTE Regulatory Compliance Infraction: Approved Regular Intake Exceeded
              </h3>
              <p className="mt-1 text-xs text-rose-800 leading-relaxed">
                Computer Science & Engineering has reported <strong>145</strong> regular admissions against an AICTE sanctioned limit of <strong>120</strong> seats (+25 excess seats). An official regulatory inquiry notice has been logged by AICTE Central.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('college-simulator')}
            className="px-3 py-1.5 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 rounded-md shrink-0 transition-colors"
          >
            Run Remediation Simulation
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reported Students"
          value={stats.totalEnrolled.toLocaleString()}
          subText={`${stats.utilizationPercentage}% of approved intake`}
          icon={Users}
          onClick={() => onNavigateTab('college-students')}
        />
        <StatCard
          title="APAAR Verified Students"
          value={stats.verifiedStudents.toLocaleString()}
          subText={`${stats.verificationRate}% verification rate`}
          icon={ShieldCheck}
          variant="success"
          onClick={() => onNavigateTab('college-students')}
        />
        <StatCard
          title="Verification Flags / Pending"
          value={stats.pendingVerification}
          subText="Name discrepancies or missing records"
          icon={Clock}
          variant={stats.pendingVerification > 0 ? 'warning' : 'default'}
          onClick={() => onNavigateTab('college-students')}
        />
        <StatCard
          title="Pending Student Corrections"
          value={stats.pendingCorrectionRequests}
          subText="Transfer clearance & name updates"
          icon={AlertTriangle}
          variant={stats.pendingCorrectionRequests > 0 ? 'info' : 'default'}
          onClick={() => onNavigateTab('college-corrections')}
        />
      </div>

      {/* Sanctioned Programmes & Admissions Status */}
      {compliance && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Sanctioned Programmes & Capacity Status</h2>
              <p className="text-xs text-slate-500">Current active enrolments vs approved intake limits (Session 2024-2025)</p>
            </div>
            <a
              href={api.getInstitutionReportPdfUrl(instId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Signed Audit PDF</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-4 text-center">Approved Capacity</th>
                  <th className="py-3 px-4 text-center">Regular Admissions</th>
                  <th className="py-3 px-4 text-center">NRI Seats</th>
                  <th className="py-3 px-4 text-center">Supernumerary Quota</th>
                  <th className="py-3 px-4 text-center">Utilization</th>
                  <th className="py-3 px-4 text-center">Capacity Balance</th>
                  <th className="py-3 px-4 text-right">Regulatory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {compliance.programmes.map((p: any) => {
                  const isViolation = p.excessAdmissions > 0;
                  return (
                    <tr
                      key={p.programmeId}
                      className={isViolation ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.programmeName}
                        <span className="text-slate-500 font-normal ml-1">({p.programmeCode})</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{p.approvedIntake}</td>
                      <td className={`py-3 px-4 text-center font-mono font-bold ${isViolation ? 'text-rose-700' : 'text-slate-900'}`}>
                        {p.regularAdmissions}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{p.nriAdmissions}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{p.supernumeraryAdmissions}</td>
                      <td className="py-3 px-4 text-center">
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
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {isViolation ? (
                          <span className="text-rose-700 font-bold">+{p.excessAdmissions} Excess</span>
                        ) : (
                          <span className="text-emerald-700">{p.remainingCapacity} Remaining</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <StatusBadge status={p.complianceStatus} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
