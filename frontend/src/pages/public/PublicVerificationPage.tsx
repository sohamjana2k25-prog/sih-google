import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Search, ArrowRight, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface PublicVerificationPageProps {
  initialReference?: string;
}

export const PublicVerificationPage: React.FC<PublicVerificationPageProps> = ({ initialReference = '' }) => {
  const [refInput, setRefInput] = useState(initialReference);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // If URL has /verify/:ref, automatically trigger verification
    const pathParts = window.location.pathname.split('/');
    const urlRef = pathParts[pathParts.length - 1];
    if (urlRef && urlRef.startsWith('SENTINEL-PASSPORT')) {
      setRefInput(urlRef);
      verifyRef(urlRef);
    } else if (initialReference) {
      verifyRef(initialReference);
    }
  }, [initialReference]);

  const verifyRef = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.verifyPublicCredential(ref.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        isValid: false,
        status: 'ERROR',
        message: err.message || 'Verification failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Public Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm">APAAR-Sentinel Public Verification Portal</h1>
            <p className="text-[11px] text-slate-400">All India Council for Technical Education (AICTE)</p>
          </div>
        </div>
        <a
          href="/"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Portal Sign In →
        </a>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-2xl w-full mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Verify Academic Enrolment Passport
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scan QR code or enter the digital credential reference code to inspect cryptographic authenticity and active status.
          </p>
        </div>

        {/* Input Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
          <input
            type="text"
            placeholder="e.g. SENTINEL-PASSPORT-2024-XXXX"
            value={refInput}
            onChange={e => setRefInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyRef(refInput)}
            className="flex-1 px-4 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => verifyRef(refInput)}
            disabled={loading || !refInput.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>{loading ? 'Verifying...' : 'Verify Passport'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Result Card */}
        {result && (
          <div
            className={`p-6 rounded-2xl border shadow-sm space-y-5 transition-all ${
              result.isValid
                ? 'bg-white border-emerald-300'
                : result.status === 'REVOKED'
                ? 'bg-rose-50/60 border-rose-300'
                : 'bg-white border-slate-300'
            }`}
          >
            {/* Status Banner */}
            <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
              <div
                className={`p-2 rounded-xl text-white ${
                  result.isValid
                    ? 'bg-emerald-600'
                    : result.status === 'REVOKED'
                    ? 'bg-rose-600'
                    : 'bg-slate-600'
                }`}
              >
                {result.isValid ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {result.isValid
                    ? 'Authentic AICTE Academic Credential Verified'
                    : result.status === 'REVOKED'
                    ? 'Credential Revoked by Student or Institution'
                    : 'Credential Verification Notice'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{result.message}</p>
              </div>
            </div>

            {/* Credential Details Grid */}
            {result.credentialDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Student Name</span>
                    <strong className="text-slate-900 text-sm">{result.credentialDetails.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Enrolment Status</span>
                    <strong className="text-slate-900 text-sm font-mono">{result.credentialDetails.enrolmentStatus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Institution</span>
                    <p className="font-semibold text-slate-800">{result.credentialDetails.institutionName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">AICTE ID: {result.credentialDetails.aicteId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Programme</span>
                    <p className="font-semibold text-slate-800">
                      {result.credentialDetails.programmeName} ({result.credentialDetails.programmeCode})
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Roll: {result.credentialDetails.rollNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Academic Session</span>
                    <p className="font-mono text-slate-700">{result.credentialDetails.academicSession}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Masked APAAR ID</span>
                    <p className="font-mono text-slate-700">{result.credentialDetails.apaarIdMasked}</p>
                  </div>
                </div>

                {result.credentialDetails.revocationReason && (
                  <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-lg text-xs text-rose-900">
                    <strong>Revocation Log:</strong> {result.credentialDetails.revocationReason} on{' '}
                    {new Date(result.credentialDetails.revokedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-200 text-center text-xs text-slate-400">
        APAAR-Sentinel National Student Verification Prototype • Demonstration System
      </footer>
    </div>
  );
};
