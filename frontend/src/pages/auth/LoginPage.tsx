import React, { useState } from 'react';
import { Shield, ArrowRight, UserCheck, School, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    try {
      await loginAsDemoUser(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            APAAR-Sentinel
          </h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            AICTE Student Identity, Verification & Regulatory Compliance Platform
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@aicte-india.org or college.edu.in"
                className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Accounts Quick-Access Grid */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demonstration Personas
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('aicte.admin@aicte-india.org', 'admin123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">AICTE Regulatory Administrator</p>
                    <p className="text-[11px] text-slate-500">Dr. Ramesh Chandra (National Audits & AI Copilot)</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@tit-kolkata.edu.in', 'admin123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">College A: Tech Institute of Technology</p>
                    <p className="text-[11px] text-slate-500">Kolkata (CSE Intake Overflow Alert & Bulk Upload)</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('rahul.sharma@student.apaar.gov.in', 'student123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-amber-100 text-amber-700">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">Student: Rahul Sharma</p>
                    <p className="text-[11px] text-slate-500">Dual-Enrolment Conflict & Record Correction</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('priya.das@student.apaar.gov.in', 'student123')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-100 text-purple-700">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">Student: Priya Das</p>
                    <p className="text-[11px] text-slate-500">Digital Enrolment Passport & Privacy Consent</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Regulatory Prototype Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Smart India Hackathon 2024 Demonstration Prototype. Protected by mock APAAR validation adapter.
        </p>
      </div>
    </div>
  );
};
