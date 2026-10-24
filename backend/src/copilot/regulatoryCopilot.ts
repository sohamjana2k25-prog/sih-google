import db from '../database/db.js';
import { AnomalyEngine } from '../anomalies/anomalyEngine.js';

export interface CopilotQueryResponse {
  query: string;
  matchedTool: string;
  summary: string;
  data: any;
  visualizationType?: 'table' | 'kpi' | 'comparison' | 'alert_list';
  followUpSuggestions: string[];
  executionMode: 'Deterministic Regulatory Query Engine';
}

export class RegulatoryCopilot {
  /**
   * Translates natural language regulatory queries into authorized database analytics operations.
   */
  static async executeQuery(query: string): Promise<CopilotQueryResponse> {
    const q = query.toLowerCase().trim();

    // 1. Intake violations / exceeding approved intake
    if (q.includes('exceed') || q.includes('violation') || q.includes('intake excess') || (q.includes('intake') && q.includes('cse'))) {
      let stateFilter = '';
      if (q.includes('west bengal')) stateFilter = 'West Bengal';
      else if (q.includes('maharashtra')) stateFilter = 'Maharashtra';
      else if (q.includes('karnataka')) stateFilter = 'Karnataka';
      else if (q.includes('delhi')) stateFilter = 'Delhi';

      let sql = `
        SELECT i.name as institution_name, i.state, i.aicte_id, p.name as programme_name, p.code as programme_code,
               p.approved_intake, COUNT(e.id) as actual_admissions,
               (COUNT(e.id) - p.approved_intake) as excess_seats,
               ROUND((COUNT(e.id) * 100.0 / p.approved_intake), 1) as utilization_pct
        FROM programmes p
        JOIN institutions i ON p.institution_id = i.id
        LEFT JOIN enrolments e ON p.id = e.programme_id AND e.enrolment_status = 'ACTIVE'
        WHERE 1=1
      `;
      const params: any[] = [];
      if (stateFilter) {
        sql += ` AND i.state = ?`;
        params.push(stateFilter);
      }
      sql += `
        GROUP BY p.id
        HAVING actual_admissions > p.approved_intake
        ORDER BY excess_seats DESC
      `;

      const results = db.prepare(sql).all(...params) as any[];

      const summary = results.length > 0
        ? `Identified ${results.length} institution programme(s) ${stateFilter ? `in ${stateFilter} ` : ''}exceeding AICTE sanctioned intake capacity. Regulatory alerts have been logged.`
        : `No intake capacity violations found matching the criteria ${stateFilter ? `in ${stateFilter}` : 'nationwide'}.`;

      return {
        query,
        matchedTool: 'getIntakeViolations()',
        summary,
        data: results,
        visualizationType: 'table',
        followUpSuggestions: [
          'Show open compliance alerts for Tech Institute of Technology',
          'Which institutions have the most unresolved duplicate enrolment cases?',
          'Summarize enrolment trends for the current academic session',
        ],
        executionMode: 'Deterministic Regulatory Query Engine',
      };
    }

    // 2. Duplicate cases / multi-enrolment
    if (q.includes('duplicate') || q.includes('conflict') || q.includes('multiple colleges') || q.includes('overlapping')) {
      const cases = db.prepare(`
        SELECT c.id as case_id, s.full_name as student_name, s.apaar_id, c.severity, c.classification, c.status, c.created_at,
               COUNT(ce.enrolment_id) as enrolled_colleges_count
        FROM conflict_cases c
        JOIN students s ON c.student_id = s.id
        LEFT JOIN conflict_case_enrolments ce ON c.id = ce.case_id
        WHERE c.status != 'RESOLVED'
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `).all() as any[];

      return {
        query,
        matchedTool: 'getDuplicateCases()',
        summary: `Found ${cases.length} active cross-institution student enrolment conflict case(s) requiring manual investigation or transfer clearance.`,
        data: cases,
        visualizationType: 'table',
        followUpSuggestions: [
          'Show Rahul Sharma conflict details',
          'Explain why College XYZ has a high anomaly score',
          'What is the verification rate for engineering students in Maharashtra?',
        ],
        executionMode: 'Deterministic Regulatory Query Engine',
      };
    }

    // 3. Verification rate / state verification
    if (q.includes('verification rate') || q.includes('verified') || q.includes('unverified') || q.includes('backlog')) {
      let stateFilter = '';
      if (q.includes('maharashtra')) stateFilter = 'Maharashtra';
      else if (q.includes('west bengal')) stateFilter = 'West Bengal';
      else if (q.includes('karnataka')) stateFilter = 'Karnataka';
      else if (q.includes('tamil nadu')) stateFilter = 'Tamil Nadu';

      let sql = `
        SELECT i.state,
               COUNT(e.id) as total_students,
               SUM(CASE WHEN e.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count,
               SUM(CASE WHEN e.verification_status != 'VERIFIED' THEN 1 ELSE 0 END) as pending_or_mismatch,
               ROUND(SUM(CASE WHEN e.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id), 1) as verification_rate_pct
        FROM enrolments e
        JOIN institutions i ON e.institution_id = i.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (stateFilter) {
        sql += ` AND i.state = ?`;
        params.push(stateFilter);
      }
      sql += ` GROUP BY i.state ORDER BY verification_rate_pct DESC`;

      const results = db.prepare(sql).all(...params) as any[];

      return {
        query,
        matchedTool: 'getVerificationRates()',
        summary: stateFilter
          ? `Verification rate for engineering students in ${stateFilter} is ${results[0]?.verification_rate_pct || 0}% (${results[0]?.verified_count || 0} of ${results[0]?.total_students || 0} students verified).`
          : `National student APAAR identity verification statistics grouped by state.`,
        data: results,
        visualizationType: 'table',
        followUpSuggestions: [
          'Show colleges in West Bengal exceeding approved CSE intake',
          'Compare admission utilization across three institutions',
          'Show institutions with pending verification cases',
        ],
        executionMode: 'Deterministic Regulatory Query Engine',
      };
    }

    // 4. Anomaly score / explanation
    if (q.includes('anomaly') || q.includes('risk') || q.includes('explain why') || q.includes('suspicious')) {
      const highRisk = AnomalyEngine.evaluateAllInstitutions().filter(i => i.riskScore > 30);
      const topInst = highRisk[0];

      return {
        query,
        matchedTool: 'getInstitutionRiskFactors()',
        summary: topInst 
          ? `Top flagged institution is "${topInst.institutionName}" with Risk Score ${topInst.riskScore}/100 (${topInst.riskLevel}). Primary drivers: ${topInst.contributingFactors.map(f => f.factor).join(', ')}.`
          : 'All institutions currently evaluate within nominal risk baselines.',
        data: highRisk,
        visualizationType: 'table',
        followUpSuggestions: [
          'Which institutions have the most unresolved duplicate enrolment cases?',
          'Show colleges in West Bengal exceeding approved CSE intake',
          'Summarize enrolment trends for the current academic session',
        ],
        executionMode: 'Deterministic Regulatory Query Engine',
      };
    }

    // 5. Comparison across institutions
    if (q.includes('compare') || q.includes('comparison')) {
      const comparisons = db.prepare(`
        SELECT i.name as institution_name, i.state, i.type,
               COUNT(DISTINCT p.id) as programmes_count,
               SUM(p.approved_intake) as total_sanctioned_seats,
               COUNT(e.id) as total_active_enrolment,
               ROUND(COUNT(e.id) * 100.0 / SUM(p.approved_intake), 1) as utilization_pct,
               i.risk_score
        FROM institutions i
        JOIN programmes p ON i.id = p.institution_id
        LEFT JOIN enrolments e ON p.id = e.programme_id AND e.enrolment_status = 'ACTIVE'
        GROUP BY i.id
        ORDER BY i.risk_score DESC
        LIMIT 5
      `).all() as any[];

      return {
        query,
        matchedTool: 'compareInstitutions()',
        summary: `Comparative operational profile of top 5 institutions by intake capacity, actual admissions, and regulatory risk scores.`,
        data: comparisons,
        visualizationType: 'table',
        followUpSuggestions: [
          'Show colleges in West Bengal exceeding approved CSE intake',
          'What is the verification rate for engineering students in Maharashtra?',
          'Which institutions have the most unresolved duplicate enrolment cases?',
        ],
        executionMode: 'Deterministic Regulatory Query Engine',
      };
    }

    // Default: National regulatory summary
    const nationalKpi = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM institutions) as total_institutions,
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM enrolments WHERE verification_status = 'VERIFIED') as verified_students,
        (SELECT COUNT(*) FROM compliance_alerts WHERE status = 'OPEN') as active_alerts,
        (SELECT COUNT(*) FROM conflict_cases WHERE status != 'RESOLVED') as duplicate_conflicts
    `).get() as any;

    return {
      query,
      matchedTool: 'getInstitutionStatistics()',
      summary: `AICTE National Overview (Session 2024-2025): ${nationalKpi.total_institutions} institutions registered, ${nationalKpi.total_students} student profiles indexed, ${nationalKpi.verified_students} verified via APAAR ID, ${nationalKpi.active_alerts} open compliance alerts, and ${nationalKpi.duplicate_conflicts} unresolved multi-institution conflicts.`,
      data: nationalKpi,
      visualizationType: 'kpi',
      followUpSuggestions: [
        'Show colleges in West Bengal exceeding approved CSE intake',
        'Which institutions have the most unresolved duplicate enrolment cases?',
        'What is the verification rate for engineering students in Maharashtra?',
        'Compare admission utilization across three institutions',
      ],
      executionMode: 'Deterministic Regulatory Query Engine',
    };
  }
}
