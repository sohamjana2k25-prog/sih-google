import React, { useEffect, useState } from 'react';
import { User, QrCode, FileEdit, Lock, ShieldCheck, Building2, BookOpen, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface StudentOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const StudentOverview: React.FC<StudentOverviewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const studentId = user?.studentId || 'student-rahul-sharma';

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getStudent(studentId);
      setProfile(res);
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const { student, enrolments, conflicts, credentials } = profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Academic Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          APAAR-linked national student record, active enrolment status, and verifiable credentials.
        </p>
      </div>

      {/* Student Identity Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/20">
            {student.full_name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{student.full_name}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                APAAR Linked
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              APAAR ID: {student.apaar_id_masked} • DOB: {student.dob}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Email: {student.email} • Contact: {student.phone}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('student-passport')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Digital Passport</span>
          </button>
          <button
            onClick={() => onNavigateTab('student-corrections')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <FileEdit className="w-4 h-4 text-slate-500" />
            <span>Report Discrepancy</span>
          </button>
        </div>
      </div>

      {/* Dual Enrolment Alert for Rahul Sharma */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-amber-950">Notice: Overlapping Academic Enrolment Flag</strong>
              <p className="text-amber-800 mt-1 leading-relaxed">
                Central ledger reflects active status at multiple institutions simultaneously. If you have transferred colleges, submit a correction request to update your previous institution record.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('student-corrections')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Submit Transfer Correction
          </button>
        </div>
      )}

      {/* Academic Enrolment History Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Institutional Enrolment History
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolments.map((enr: any) => (
            <div key={enr.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{enr.institution_name}</h4>
                  <p className="text-[11px] font-mono text-slate-400">AICTE ID: {enr.aicte_id} ({enr.state})</p>
                </div>
                <StatusBadge status={enr.enrolment_status} size="sm" />
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <p>
                  Programme: <strong className="text-slate-900">{enr.programme_name} ({enr.programme_code})</strong>
                </p>
                <p className="font-mono text-[11px]">Roll Number: {enr.roll_number}</p>
                <p>Academic Session: {enr.academic_session} • Category: {enr.admission_category}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Identity Verification:</span>
                <StatusBadge status={enr.verification_status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
