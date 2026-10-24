import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  BrainCircuit,
  Network,
  MapPin,
  Bot,
  FileCheck2,
  UploadCloud,
  Calculator,
  QrCode,
  FileEdit,
  Lock,
  History,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  let navItems: { id: string; label: string; icon: React.ElementType; badge?: string }[] = [];

  if (user.role === 'AICTE_ADMIN') {
    navItems = [
      { id: 'aicte-overview', label: 'National Overview', icon: LayoutDashboard },
      { id: 'aicte-institutions', label: 'Institutional Registry', icon: Building2 },
      { id: 'aicte-students', label: 'Student Master Registry', icon: Users },
      { id: 'aicte-compliance', label: 'Intake Compliance', icon: ShieldAlert, badge: 'Alerts' },
      { id: 'aicte-anomalies', label: 'Anomaly Intelligence', icon: BrainCircuit },
      { id: 'aicte-conflicts', label: 'Conflict Network', icon: Network, badge: 'Cases' },
      { id: 'aicte-geography', label: 'Geographic Heatmap', icon: MapPin },
      { id: 'aicte-copilot', label: 'AI Regulatory Copilot', icon: Bot, badge: 'AI' },
      { id: 'aicte-audit', label: 'Audit Trail Logs', icon: History },
    ];
  } else if (user.role === 'INSTITUTION_ADMIN') {
    navItems = [
      { id: 'college-overview', label: 'College Overview', icon: LayoutDashboard },
      { id: 'college-students', label: 'Student Management', icon: Users },
      { id: 'college-upload', label: 'Smart Bulk Upload', icon: UploadCloud, badge: 'AI' },
      { id: 'college-simulator', label: 'Admission Simulator', icon: Calculator },
      { id: 'college-corrections', label: 'Correction Requests', icon: FileEdit, badge: 'Review' },
      { id: 'college-reports', label: 'Compliance Reports', icon: FileCheck2 },
    ];
  } else {
    // Student
    navItems = [
      { id: 'student-overview', label: 'My Academic Profile', icon: LayoutDashboard },
      { id: 'student-passport', label: 'Digital Enrolment Passport', icon: QrCode, badge: 'Signed' },
      { id: 'student-corrections', label: 'Record Corrections', icon: FileEdit },
      { id: 'student-privacy', label: 'Data Privacy & Consent', icon: Lock },
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {user.role === 'AICTE_ADMIN' ? 'AICTE Regulatory System' : user.role === 'INSTITUTION_ADMIN' ? 'Institutional Portal' : 'Student Portal'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="text-[11px] text-slate-500 font-medium">
          APAAR-Sentinel v1.0.0
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          SIH Prototype Demonstration
        </div>
      </div>
    </aside>
  );
};
