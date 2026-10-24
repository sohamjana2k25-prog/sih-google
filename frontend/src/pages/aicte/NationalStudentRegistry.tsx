import React, { useEffect, useState } from 'react';
import { Search, Filter, Users, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

export const NationalStudentRegistry: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    loadStudents(1);
  }, [search, verificationStatus]);

  const loadStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        page,
        limit: 20,
        search: search || undefined,
        verificationStatus: verificationStatus || undefined,
      });
      setStudents(res.students);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDetail = async (studentId: string) => {
    setDrawerLoading(true);
    try {
      const detail = await api.getStudent(studentId);
      setSelectedStudent(detail);
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">National Student Master Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centralized index of all student identities, APAAR linked credentials, and cross-college enrolments.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Total Indexed: <span className="font-bold text-slate-900 font-mono">{pagination.total.toLocaleString()}</span> Students
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, APAAR ID, roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={verificationStatus}
            onChange={e => setVerificationStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Verification Statuses</option>
            <option value="VERIFIED">Verified (APAAR Validated)</option>
            <option value="FLAGGED_MISMATCH">Flagged Mismatch</option>
            <option value="UNAVAILABLE">Unavailable in Central Ledger</option>
          </select>
          {verificationStatus && (
            <button
              onClick={() => setVerificationStatus('')}
              className="text-xs text-blue-600 font-medium px-2 py-1 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">APAAR Identifier</th>
                <th className="py-3 px-4">Enrolled Institution</th>
                <th className="py-3 px-4">Programme & Branch</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Verification Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {students.map(s => (
                <tr key={s.id + (s.enrolment_id || '')} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {s.full_name}
                    <div className="text-[11px] font-normal text-slate-500">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">
                    {s.apaar_id_masked}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">{s.institution_name}</span>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {s.aicte_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">{s.programme_name}</span>
                    <span className="text-slate-400 ml-1">({s.programme_code})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{s.roll_number}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {s.admission_category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={s.verification_status || 'PENDING'} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenStudentDetail(s.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} students)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadStudents(pagination.page - 1)}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadStudents(pagination.page + 1)}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Profile Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedStudent.student.full_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    APAAR: {selectedStudent.student.apaar_id_masked}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Demographics Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.student.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.student.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Official Email:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-semibold text-slate-800">{selectedStudent.student.phone}</span>
                  </div>
                </div>

                {/* Enrolments History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Academic Enrolment Ledger
                  </h4>
                  <div className="space-y-2">
                    {selectedStudent.enrolments.map((e: any) => (
                      <div key={e.id} className="p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{e.institution_name}</span>
                          <StatusBadge status={e.enrolment_status} size="sm" />
                        </div>
                        <p className="text-slate-600 font-medium">{e.programme_name} ({e.programme_code})</p>
                        <div className="flex justify-between text-slate-500 text-[11px] font-mono">
                          <span>Roll: {e.roll_number}</span>
                          <span>Session: {e.academic_session}</span>
                        </div>
                        <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Identity Status:</span>
                          <StatusBadge status={e.verification_status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification History Logs */}
                {selectedStudent.verifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Verification Provider Logs
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStudent.verifications.map((v: any) => (
                        <div key={v.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                          <div className="flex justify-between font-semibold">
                            <span>{v.provider}</span>
                            <StatusBadge status={v.result} size="sm" />
                          </div>
                          <p className="text-slate-400 mt-0.5">{new Date(v.verified_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
