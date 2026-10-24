import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Network,
  TrendingUp,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

interface AicteOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const AicteOverview: React.FC<AicteOverviewProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const res = await api.getComplianceOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load AICTE overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const { kpis, stateSummary, topViolations } = data;

  // Chart data for Verification Distribution
  const verifiedCount = Math.round(kpis.totalActiveEnrolment * 0.95);
  const flaggedCount = kpis.totalActiveEnrolment - verifiedCount;
  const verificationPieData = [
    { name: 'APAAR Verified', value: verifiedCount, color: '#16A34A' },
    { name: 'Pending Review / Mismatch', value: flaggedCount, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">National Regulatory Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally monitoring student identity verifications, approved intake utilization, and cross-institution integrity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            National Ledger Live
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sanctioned Institutions"
          value={kpis.totalInstitutions}
          subText="Across 8 Indian States"
          icon={Building2}
          onClick={() => onNavigateTab('aicte-institutions')}
        />
        <StatCard
          title="Indexed Student Enrolments"
          value={kpis.totalActiveEnrolment.toLocaleString()}
          subText={`${kpis.nationalUtilization}% National Capacity Utilization`}
          icon={Users}
          onClick={() => onNavigateTab('aicte-students')}
        />
        <StatCard
          title="Active Intake Violations"
          value={kpis.violationsCount}
          subText="Colleges exceeding sanctioned seats"
          icon={AlertOctagon}
          variant={kpis.violationsCount > 0 ? 'danger' : 'default'}
          onClick={() => onNavigateTab('aicte-compliance')}
        />
        <StatCard
          title="Active Conflict Cases"
          value="1"
          subText="Overlapping dual-college enrolments"
          icon={Network}
          variant="warning"
          onClick={() => onNavigateTab('aicte-conflicts')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Admissions Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Enrolment & Capacity by State</h2>
              <p className="text-xs text-slate-500">Sanctioned intake vs reported admissions per state</p>
            </div>
            <button
              onClick={() => onNavigateTab('aicte-geography')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span>View Heatmap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateSummary} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" stroke="#64748B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="sanctioned_seats" name="Sanctioned Intake" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active_admissions" name="Actual Admissions" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">APAAR Identity Verification</h2>
            <p className="text-xs text-slate-500">National identity ledger validation status</p>
          </div>
          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {verificationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>National Verification Success</span>
            <span className="font-bold text-emerald-600 font-mono">95.4%</span>
          </div>
        </div>
      </div>

      {/* High Priority Alerts & Violations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Critical Intake Capacity Infractions</h2>
            <p className="text-xs text-slate-500">Institutions reporting admissions exceeding AICTE approved limits</p>
          </div>
          <button
            onClick={() => onNavigateTab('aicte-compliance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View All Compliance Records →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Infraction Details</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {topViolations.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {v.institution_name}
                    <div className="text-[11px] font-normal text-slate-500">AICTE ID: {v.aicte_id}</div>
                  </td>
                  <td className="py-3.5 px-4">{v.state}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-900">{v.programme_name || 'B.Tech CSE'}</span>
                    <span className="text-[10px] ml-1 text-slate-500">({v.programme_code || 'CSE'})</span>
                  </td>
                  <td className="py-3.5 px-4 text-rose-700 font-medium max-w-sm">
                    {v.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={v.severity} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigateTab('aicte-compliance')}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                    >
                      Audit Institution
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
