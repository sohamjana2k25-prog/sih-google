import React from 'react';
import { Download, FileText, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const InstitutionReportsPage: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.institutionId || 'inst-kolkata-01';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Regulatory Compliance & Enrolment Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Export verified institutional admission data, APAAR verification audit manifests, and AICTE compliance certificates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Compliance Report Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg w-fit mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Official AICTE Compliance Audit Report (PDF)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Standardized regulatory report containing sanctioned intake limits, reported admissions by category, capacity utilization %, and active regulatory infractions.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally signed regulatory document</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sanctioned vs reported category breakdown</span>
              </div>
            </div>
          </div>

          <a
            href={api.getInstitutionReportPdfUrl(instId)}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed Audit PDF</span>
          </a>
        </div>

        {/* CSV Raw Data Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg w-fit mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Intake & Category Dataset (CSV)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Machine-readable tabular export of institutional seat allocation, remaining capacity balances, and enrolment figures.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full programme-wise breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compatible with Excel & AICTE MIS</span>
              </div>
            </div>
          </div>

          <a
            href={api.getInstitutionReportCsvUrl(instId)}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Raw CSV Dataset</span>
          </a>
        </div>
      </div>
    </div>
  );
};
