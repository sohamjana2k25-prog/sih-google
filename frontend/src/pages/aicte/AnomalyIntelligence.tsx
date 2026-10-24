import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  ChevronRight,
  Info,
  X,
  FileSearch,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

export const AnomalyIntelligence: React.FC = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const [evalRes, statRes] = await Promise.all([
        api.getAnomalies(),
        api.getAnomalyStats(),
      ]);
      setEvaluations(evalRes.evaluations);
      setStats(statRes);
    } catch (err) {
      console.error('Failed to load anomaly engine:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Anomaly & Risk Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hybrid detection engine combining rule-based heuristics, temporal burst metrics, and multi-factor risk scoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Model: Multi-Factor Hybrid Evaluator
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Critical Risk Institutions"
            value={stats.distribution.critical}
            subText="Score ≥ 75 (Immediate inquiry required)"
            icon={ShieldAlert}
            variant={stats.distribution.critical > 0 ? 'danger' : 'default'}
          />
          <StatCard
            title="Elevated Risk Level"
            value={stats.distribution.elevated}
            subText="Score 50-74 (Formal notice issued)"
            icon={AlertTriangle}
            variant={stats.distribution.elevated > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Moderate Flagged"
            value={stats.distribution.moderate}
            subText="Score 25-49 (Verification backlog)"
            icon={Activity}
          />
          <StatCard
            title="Nominal / Compliant"
            value={stats.distribution.low}
            subText="Score < 25 (Baseline compliance)"
            icon={CheckCircle2}
            variant="success"
          />
        </div>
      )}

      {/* Anomaly Risk Rankings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Institutional Anomaly Risk Ranking</h2>
            <p className="text-xs text-slate-500">Transparent risk scores (0-100) computed from multi-dimensional feature vectors</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {evaluations.length} Institutions Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-center">Calculated Risk Score</th>
                <th className="py-3 px-4 text-center">Risk Classification</th>
                <th className="py-3 px-4">Primary Anomaly Factors</th>
                <th className="py-3 px-4 text-right">Investigation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {evaluations.map(e => (
                <tr key={e.institutionId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {e.institutionName}
                  </td>
                  <td className="py-3.5 px-4">{e.state}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block font-mono font-bold px-2.5 py-1 rounded text-xs ${
                        e.riskScore >= 75
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : e.riskScore >= 50
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : e.riskScore >= 25
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {e.riskScore} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={e.riskLevel} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {e.contributingFactors.length > 0 ? (
                        e.contributingFactors.map((f: any, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              f.impact === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {f.factor} (+{f.scoreContribution})
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal statistical baseline</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedEval(e)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <span>Explain Score</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainable Anomaly Breakdown Drawer */}
      {selectedEval && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedEval.institutionName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedEval.state} • Session: {selectedEval.academicSession}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEval(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Score Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Composite Risk Score
                    </span>
                    <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
                      {selectedEval.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={selectedEval.riskLevel} />
                  </div>
                </div>

                {/* Contributing Factors with Score Impact */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Contributing Anomaly Drivers
                  </h4>
                  {selectedEval.contributingFactors.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedEval.contributingFactors.map((f: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-xs text-slate-900">{f.factor}</span>
                            <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                              +{f.scoreContribution} pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No adverse risk drivers detected.</p>
                  )}
                </div>

                {/* Supporting Statistical Metrics */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Underlying Engineering Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Intake Utilization</span>
                      <strong className="font-mono text-slate-800">{selectedEval.metrics.intakeUtilization}%</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Verification Failure</span>
                      <strong className="font-mono text-slate-800">{selectedEval.metrics.verificationFailureRate}%</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Duplicate Ratio</span>
                      <strong className="font-mono text-slate-800">{selectedEval.metrics.duplicateEnrolmentRate}%</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Burst Ingestion Score</span>
                      <strong className="font-mono text-slate-800">{selectedEval.metrics.lateSubmissionBurstScore}/100</strong>
                    </div>
                  </div>
                </div>

                {/* AICTE Recommended Regulatory Action */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs mb-1">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>Recommended AICTE Regulatory Action</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    {selectedEval.recommendedAction}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedEval(null)}
                className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
