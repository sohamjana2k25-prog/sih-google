import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const BulkUploadWizard: React.FC = () => {
  const { user } = useAuth();
  const instId = user?.institutionId || 'inst-kolkata-01';

  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Canonical fields required by APAAR-Sentinel schema
  const canonicalFields = [
    { key: 'full_name', label: 'Full Candidate Name *' },
    { key: 'apaar_id', label: '12-Digit APAAR ID *' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'email', label: 'Candidate Email' },
    { key: 'phone', label: 'Contact Number' },
    { key: 'rollNumber', label: 'College Roll Number *' },
    { key: 'programmeCode', label: 'Programme Code (e.g. CSE) *' },
    { key: 'admissionCategory', label: 'Admission Category (e.g. GENERAL, OBC)' },
    { key: 'admissionDate', label: 'Admission Date' },
  ];

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsing(true);
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await api.parseUploadFile(formData);
      setParsedData(res);
      setColumnMappings(res.suggestedMappings || {});
      setStep(2);
    } catch (err: any) {
      alert('Failed to parse spreadsheet: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleValidate = async () => {
    if (!parsedData || !parsedData.rawRows) return;
    setValidating(true);
    try {
      const res = await api.validateUploadRows({
        rows: parsedData.rawRows,
        mappings: columnMappings,
        institutionId: instId,
      });
      setValidationResult(res);
      setStep(3);
    } catch (err: any) {
      alert('Validation error: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || !validationResult.normalizedRows) return;
    setImporting(true);
    try {
      const validRows = validationResult.normalizedRows.filter((r: any) => r.isValid);
      const res = await api.confirmUploadImport({
        institutionId: instId,
        validRows,
        filename: file?.name || 'Bulk_Admissions.csv',
      });
      setImportSummary(res);
      setStep(4);
    } catch (err: any) {
      alert('Failed to import records: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setParsedData(null);
    setValidationResult(null);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          AI-Powered Data Cleaning & Smart Upload Wizard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ingest institutional admission batches with automatic column mapping, row-by-row format checks, duplicate detection, and verification dispatch.
        </p>
      </div>

      {/* Wizard Progress Steps Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        {[
          { num: 1, title: 'Upload File' },
          { num: 2, title: 'Smart Column Mapping' },
          { num: 3, title: 'Validate Records' },
          { num: 4, title: 'Import Summary' },
        ].map((s, idx) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    isCurrent ? 'text-slate-900 font-bold' : isDone ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < 3 && <div className="h-0.5 w-12 bg-slate-200 hidden md:block"></div>}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-blue-400 transition-colors bg-slate-50/50">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Upload Admissions Spreadsheet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports CSV or XLSX spreadsheets. Column names can vary—the AI mapper will automatically recognize candidate headers.
            </p>

            <label className="mt-5 inline-block">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <span className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors">
                {parsing ? 'Parsing Spreadsheet...' : 'Select File from Computer'}
              </span>
            </label>
          </div>

          {/* Sample CSV Shortcuts for SIH Demo */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Demonstration Test Files (Pre-bundled in demo-data/sample-uploads):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">valid_admissions_batch.csv</span>
                <span className="text-slate-500 text-[11px]">8 Clean Records • 100% Valid • Ready to ingest</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-900 block">mixed_admissions_with_errors.csv</span>
                <span className="text-slate-500 text-[11px]">Contains missing APAAR, duplicate, and format errors</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SMART COLUMN MAPPING */}
      {step === 2 && parsedData && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Smart Header Alignment</h3>
              <p className="text-xs text-slate-500">
                AI has auto-mapped spreadsheet headers to canonical APAAR-Sentinel schema fields. Adjust if necessary.
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
              File: {parsedData.filename} ({parsedData.totalRows} rows)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {canonicalFields.map(field => {
              const currentMapped = Object.keys(columnMappings).find(
                k => columnMappings[k] === field.key
              );

              return (
                <div key={field.key} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{field.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Canonical: {field.key}</span>
                  </div>

                  <select
                    value={currentMapped || ''}
                    onChange={e => {
                      const newMap = { ...columnMappings };
                      // remove old mapping
                      if (currentMapped) delete newMap[currentMapped];
                      if (e.target.value) newMap[e.target.value] = field.key;
                      setColumnMappings(newMap);
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Unmapped --</option>
                    {parsedData.headers.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>
            <button
              onClick={handleValidate}
              disabled={validating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <span>{validating ? 'Validating Records...' : 'Proceed to Validation'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION RESULTS & ROW ERRORS */}
      {step === 3 && validationResult && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 3: Pre-Ingestion Data Validation</h3>
              <p className="text-xs text-slate-500">
                Inspecting format compliance, APAAR identifier checksums, and duplicate checks before database persistence.
              </p>
            </div>
          </div>

          {/* Validation Metrics Strip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Total Parsed</span>
              <strong className="text-xl font-mono text-slate-900">{validationResult.totalRows}</strong>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <span className="text-emerald-700 block uppercase tracking-wider text-[10px]">Valid & Ready</span>
              <strong className="text-xl font-mono text-emerald-800">{validationResult.validRows}</strong>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
              <span className="text-rose-700 block uppercase tracking-wider text-[10px]">Rows with Errors</span>
              <strong className="text-xl font-mono text-rose-800">{validationResult.invalidRows}</strong>
            </div>
          </div>

          {/* Row Errors Breakdown if any */}
          {validationResult.validationErrors.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Detected Row-Level Discrepancies ({validationResult.validationErrors.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {validationResult.validationErrors.map((err: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-rose-950 font-mono">Row #{err.rowNumber}:</span>
                      <span className="text-rose-800 ml-2">{err.error}</span>
                    </div>
                    <span className="text-[11px] font-mono text-rose-600">Field: {err.field}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normalized Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Normalized Records Preview (First 5 Rows)
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Candidate Name</th>
                    <th className="py-2.5 px-3">APAAR ID</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Prog</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validationResult.normalizedRows.slice(0, 5).map((r: any) => (
                    <tr key={r.rowNumber} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                      <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{r.fullName}</td>
                      <td className="py-2 px-3 font-mono">{r.apaarId}</td>
                      <td className="py-2 px-3 font-mono">{r.rollNumber}</td>
                      <td className="py-2 px-3">{r.programmeCode}</td>
                      <td className="py-2 px-3">{r.admissionCategory}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {r.isValid ? 'VALID' : 'ERROR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mappings</span>
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing || validationResult.validRows === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <span>{importing ? 'Persisting & Verifying...' : `Confirm Import (${validationResult.validRows} Records)`}</span>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT SUMMARY REPORT */}
      {step === 4 && importSummary && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-6">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Ingestion & Verification Completed</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All valid records have been committed to the institutional database. Identity verifications were automatically executed through the central mock adapter.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Imported</span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {importSummary.result.importedCount}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase font-semibold">APAAR Verified</span>
              <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
                {importSummary.result.verifiedCount}
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-700 uppercase font-semibold">Flagged for Review</span>
              <p className="text-2xl font-bold font-mono text-amber-800 mt-1">
                {importSummary.result.mismatchCount}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={resetWizard}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Upload Another Batch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
