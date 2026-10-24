import React, { useState } from 'react';
import { Shield, RotateCcw, LogOut, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemoUser, refreshUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const demoAccounts = [
    { label: 'AICTE Admin', email: 'aicte.admin@aicte-india.org', role: 'AICTE_ADMIN' },
    { label: 'College A (Kolkata)', email: 'admin@tit-kolkata.edu.in', role: 'INSTITUTION_ADMIN' },
    { label: 'College B (Apex)', email: 'admin@apex-bengaluru.edu.in', role: 'INSTITUTION_ADMIN' },
    { label: 'Student Rahul (Conflict)', email: 'rahul.sharma@student.apaar.gov.in', role: 'STUDENT' },
    { label: 'Student Priya (Passport)', email: 'priya.das@student.apaar.gov.in', role: 'STUDENT' },
  ];

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database to original SIH baseline? All 12 institutions, 1109 students, and test scenarios will be refreshed.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoDatabase();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
      await refreshUser();
      window.location.reload();
    } catch (err: any) {
      alert('Failed to reset demo: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Shield className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base">APAAR-Sentinel</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              AICTE Core
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Student Identity & Regulatory Compliance Platform</p>
        </div>
      </div>

      {/* Demo Switcher Quick Toolbar */}
      <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <span className="text-[11px] font-semibold text-slate-500 uppercase px-2">Demo Role:</span>
        {demoAccounts.map(acc => {
          const isActive = user?.email === acc.email;
          return (
            <button
              key={acc.email}
              onClick={() => loginAsDemoUser(acc.email, 'admin123')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {acc.label}
            </button>
          );
        })}
      </div>

      {/* Right Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Reset Database Button */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          title="Restore Seeded Demonstration Baseline"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {resetSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Database Reset</span>
            </>
          ) : (
            <>
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo Baseline</span>
            </>
          )}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] font-medium text-slate-500">
                {user.role === 'AICTE_ADMIN'
                  ? 'AICTE Regulatory Official'
                  : user.role === 'INSTITUTION_ADMIN'
                  ? user.institution?.name?.slice(0, 26) + '...'
                  : 'Student User'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
