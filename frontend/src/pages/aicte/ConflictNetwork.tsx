import React, { useEffect, useState } from 'react';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';

export const ConflictNetwork: React.FC = () => {
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; totalConflicts: number }>({
    nodes: [],
    edges: [],
    totalConflicts: 0,
  });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [searchStudent, setSearchStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [resolving, setResolving] = useState(false);
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    loadConflictGraph();
  }, [searchStudent]);

  const loadConflictGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getConflictGraph();
      setGraphData(data);
      if (data.nodes.length > 0 && !selectedNode) {
        // Automatically select the student conflict node (Rahul Sharma)
        const studentNode = data.nodes.find((n: any) => n.type === 'student');
        if (studentNode) {
          setSelectedNode(studentNode);
          if (studentNode.data?.caseId) {
            loadCaseDetails(studentNode.data.caseId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conflict graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const res = await api.getConflict(caseId);
      setSelectedCase(res);
    } catch (err) {
      console.error('Failed to load case:', err);
    }
  };

  const handleResolve = async () => {
    if (!selectedCase || !resolutionText) return;
    setResolving(true);
    try {
      await api.resolveConflict(selectedCase.conflictCase.id, {
        resolutionDetails: resolutionText,
        secondaryEnrolmentAction: 'TRANSFERRED',
      });
      alert('Conflict Case successfully marked as RESOLVED. Transfer logged in official audit trail.');
      setResolutionText('');
      await loadConflictGraph();
    } catch (err: any) {
      alert('Failed to resolve case: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  // Node position layout calculation for SVG canvas
  const studentNodes = graphData.nodes.filter(n => n.type === 'student');
  const institutionNodes = graphData.nodes.filter(n => n.type === 'institution');
  const programmeNodes = graphData.nodes.filter(n => n.type === 'programme');

  const getNodeCoords = (node: any) => {
    if (node.type === 'student') return { x: 380, y: 160 };
    if (node.type === 'institution') {
      const idx = institutionNodes.findIndex(i => i.id === node.id);
      return { x: idx === 0 ? 120 : 640, y: 320 };
    }
    // programme
    const idx = programmeNodes.findIndex(p => p.id === node.id);
    return { x: idx === 0 ? 240 : 520, y: 240 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">National Enrolment Conflict Graph</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualizing multi-institution academic relationships to detect overlapping active enrolments versus legitimate transfers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {graphData.totalConflicts} Active Overlapping Conflict(s)
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Network Canvas on Left, Investigation Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Canvas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between h-[520px]">
          {/* Canvas Controls */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Graph Legend:</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Student
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Institution
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span> Conflict Link
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Graph Viewport */}
          <div className="relative flex-1 bg-slate-50/40 overflow-hidden flex items-center justify-center">
            <svg
              className="w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              viewBox="0 0 760 440"
            >
              {/* Render Edges */}
              {graphData.edges.map(edge => {
                const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                const targetNode = graphData.nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const sc = getNodeCoords(sourceNode);
                const tc = getNodeCoords(targetNode);
                const isConflict = edge.type === 'potential_conflict';

                return (
                  <g key={edge.id}>
                    <line
                      x1={sc.x}
                      y1={sc.y}
                      x2={tc.x}
                      y2={tc.y}
                      stroke={isConflict ? '#DC2626' : '#94A3B8'}
                      strokeWidth={isConflict ? 2.5 : 1.5}
                      strokeDasharray={isConflict ? '6 4' : undefined}
                      className={isConflict ? 'animate-pulse' : ''}
                    />
                    {/* Edge Midpoint Label */}
                    <rect
                      x={(sc.x + tc.x) / 2 - 40}
                      y={(sc.y + tc.y) / 2 - 10}
                      width={80}
                      height={20}
                      rx={4}
                      fill="#FFFFFF"
                      stroke={isConflict ? '#FCA5A5' : '#E2E8F0'}
                    />
                    <text
                      x={(sc.x + tc.x) / 2}
                      y={(sc.y + tc.y) / 2 + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill={isConflict ? '#B91C1C' : '#64748B'}
                    >
                      {edge.label?.slice(0, 14)}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {graphData.nodes.map(node => {
                const coords = getNodeCoords(node);
                const isSelected = selectedNode?.id === node.id;

                let nodeFill = '#FFFFFF';
                let nodeStroke = '#CBD5E1';
                let Icon = GraduationCap;

                if (node.type === 'student') {
                  nodeFill = node.hasConflict ? '#FEF2F2' : '#EFF6FF';
                  nodeStroke = node.hasConflict ? '#EF4444' : '#3B82F6';
                  Icon = GraduationCap;
                } else if (node.type === 'institution') {
                  nodeFill = '#ECFDF5';
                  nodeStroke = '#10B981';
                  Icon = Building2;
                } else {
                  nodeFill = '#F8FAFC';
                  nodeStroke = '#64748B';
                  Icon = BookOpen;
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => {
                      setSelectedNode(node);
                      if (node.data?.caseId) {
                        loadCaseDetails(node.data.caseId);
                      }
                    }}
                    className="cursor-pointer transition-all hover:scale-105"
                  >
                    <circle
                      r={node.type === 'student' ? 32 : 28}
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="shadow-sm"
                    />
                    {/* Node text */}
                    <text
                      y={42}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#0F172A"
                      className="select-none"
                    >
                      {node.label.length > 22 ? node.label.slice(0, 20) + '...' : node.label}
                    </text>
                    <text
                      y={54}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#64748B"
                      className="select-none"
                    >
                      {node.subLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Click any node in graph to inspect relationship history and conflict metadata.</span>
            <span className="font-medium text-slate-700">Live Network State</span>
          </div>
        </div>

        {/* Case Investigation & Resolution Side Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Case Investigation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedCase ? selectedCase.conflictCase.student_name : 'Select Conflict Record'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedCase ? selectedCase.conflictCase.apaar_id_masked : ''}
                </p>
              </div>
              {selectedCase && (
                <StatusBadge status={selectedCase.conflictCase.status} size="sm" />
              )}
            </div>

            {selectedCase ? (
              <div className="mt-4 space-y-4">
                {/* Conflict Classification Card */}
                <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-xs text-rose-900">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Overlapping Enrolment Violation</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    {selectedCase.conflictCase.case_notes}
                  </p>
                </div>

                {/* Conflicting Institutions Comparison */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Conflicting Enrolment Records
                  </h4>
                  <div className="space-y-2">
                    {selectedCase.linkedEnrolments.map((enr: any, idx: number) => (
                      <div key={enr.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">College {idx === 0 ? 'A' : 'B'}: {enr.institution_name}</span>
                          <StatusBadge status={enr.enrolment_status} size="sm" />
                        </div>
                        <p className="text-slate-600 mt-1">{enr.programme_name} ({enr.programme_code})</p>
                        <div className="flex justify-between text-slate-500 text-[11px] mt-1 font-mono">
                          <span>Admitted: {enr.admission_date}</span>
                          <span>Roll: {enr.roll_number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formal Case Resolution Form */}
                {selectedCase.conflictCase.status !== 'RESOLVED' && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Record Regulatory Resolution Action
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Verified student transfer clearance from College A to College B via counselling TC."
                      value={resolutionText}
                      onChange={e => setResolutionText(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleResolve}
                      disabled={resolving || !resolutionText}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{resolving ? 'Recording Resolution...' : 'Resolve Conflict & Update Ledger'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click a student node in the graph to inspect evidence and resolve.
              </div>
            )}
          </div>

          <div className="pt-3 text-[11px] text-slate-400 text-center">
            AICTE Cross-Institution Conflict Network Engine
          </div>
        </div>
      </div>
    </div>
  );
};
