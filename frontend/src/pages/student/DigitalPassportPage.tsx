import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Download,
  Copy,
  ExternalLink,
  Check,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const DigitalPassportPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.studentId || 'student-priya-das';

  const [credentials, setCredentials] = useState<any[]>([]);
  const [activeCred, setActiveCred] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [studentId]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentCredentials(studentId);
      setCredentials(res.credentials);
      if (res.credentials.length > 0) {
        const top = res.credentials[0];
        setActiveCred(top);
        generateQr(top.credential_reference);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async (ref: string) => {
    try {
      // In production, QR encodes verifiable URL or compact credential presentation
      const verifyUrl = `${window.location.origin}/verify/${ref}`;
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleIssueNew = async () => {
    setIssuing(true);
    try {
      // Fetch enrolments first to get enrolmentId
      const profile = await api.getStudent(studentId);
      const enr = profile.enrolments?.[0];
      if (!enr) {
        alert('No active enrolment found to generate passport');
        return;
      }

      await api.issueCredential({
        studentId,
        enrolmentId: enr.id,
        validityDays: 90,
      });

      await loadCredentials();
    } catch (err: any) {
      alert('Failed to issue credential: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeCred) return;
    if (!window.confirm('Are you sure you want to revoke this digital enrolment passport? Third parties will immediately see the credential as REVOKED.')) {
      return;
    }

    setRevoking(true);
    try {
      await api.revokeCredential(activeCred.credential_reference, 'Revoked by student via Privacy Portal');
      await loadCredentials();
    } catch (err: any) {
      alert('Revocation error: ' + err.message);
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeCred) return;
    const verifyUrl = `${window.location.origin}/verify/${activeCred.credential_reference}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Smart Digital Enrolment Passport</h1>
          <p className="text-sm text-slate-500 mt-1">
            Digitally signed verifiable academic enrolment credentials secured by AICTE cryptographic signatures.
          </p>
        </div>
        <button
          onClick={handleIssueNew}
          disabled={issuing}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>{issuing ? 'Signing Credential...' : 'Generate New Passport'}</span>
        </button>
      </div>

      {/* Verifiable Credential Showcase Card */}
      {activeCred ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Card Banner Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-200">
                ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">National Enrolment Passport</h2>
              <p className="text-xs text-blue-200 font-mono mt-1">
                Ref: {activeCred.credential_reference}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide ${
                  activeCred.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                }`}
              >
                {activeCred.status === 'ACTIVE' ? 'AUTHENTIC PASSPORT' : 'PASSPORT REVOKED'}
              </span>
            </div>
          </div>

          {/* Credential Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Student & Institution Metadata */}
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Student Name</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{user?.name || 'Student Name'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Enrolment Status</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{activeCred.enrolment_status || 'ACTIVE'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Institution</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCred.institution_name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">AICTE ID: {activeCred.aicte_id}</p>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Programme & Branch</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCred.programme_name} ({activeCred.programme_code})</p>
                  <p className="text-[11px] text-slate-400 font-mono">Roll: {activeCred.roll_number}</p>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Issued Date</span>
                  <p className="font-mono text-slate-700 mt-0.5">{new Date(activeCred.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">Validity Expiration</span>
                  <p className="font-mono text-slate-700 mt-0.5">{new Date(activeCred.expires_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Cryptographic Digital Signature Strip */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cryptographic HMAC-SHA256 Digital Seal</span>
                </div>
                <p className="font-mono text-[10px] text-slate-500 break-all bg-white p-2 rounded border border-slate-200">
                  {activeCred.digital_signature}
                </p>
              </div>
            </div>

            {/* QR Code Column */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Enrolment Passport QR Code"
                  className="w-44 h-44 rounded-lg shadow-xs border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-200 rounded-lg animate-pulse"></div>
              )}
              <span className="text-[10px] text-slate-400 mt-2 font-mono">Scan to Verify Enrolment</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Copy Verification URL'}</span>
              </button>
              <a
                href={`/verify/${activeCred.credential_reference}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Verification Portal</span>
              </a>
            </div>

            {activeCred.status === 'ACTIVE' && (
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{revoking ? 'Revoking...' : 'Revoke Credential'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Digital Passport Issued Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Generate a digitally signed, cryptographic proof of enrolment to share with employers and external institutions.
          </p>
          <button
            onClick={handleIssueNew}
            disabled={issuing}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            Issue Passport Now
          </button>
        </div>
      )}
    </div>
  );
};
