import db from '../database/db.js';
import crypto from 'crypto';

export interface ProgrammeComplianceResult {
  programmeId: string;
  programmeName: string;
  programmeCode: string;
  degree: string;
  approvedIntake: number;
  totalActiveEnrolment: number;
  regularAdmissions: number;
  nriAdmissions: number;
  supernumeraryAdmissions: number;
  utilizationPercentage: number;
  remainingCapacity: number;
  excessAdmissions: number;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  categoryBreakdown: {
    category: string;
    count: number;
    maxAllowed?: number;
  }[];
}

export interface InstitutionComplianceSummary {
  institutionId: string;
  institutionName: string;
  aicteId: string;
  state: string;
  academicSession: string;
  totalApprovedIntake: number;
  totalActiveEnrolment: number;
  overallUtilization: number;
  hasViolations: boolean;
  programmes: ProgrammeComplianceResult[];
  activeAlertsCount: number;
}

export class ComplianceEngine {
  /**
   * Recalculates intake compliance for an institution and generates alerts if excess admissions are found.
   */
  static evaluateInstitutionCompliance(institutionId: string, session = '2024-2025'): InstitutionComplianceSummary {
    const institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(institutionId) as any;
    if (!institution) {
      throw new Error(`Institution with id ${institutionId} not found`);
    }

    const programmes = db.prepare(`
      SELECT * FROM programmes WHERE institution_id = ? AND academic_session = ?
    `).all(institutionId, session) as any[];

    let totalApproved = 0;
    let totalEnrolled = 0;
    let hasViolations = false;
    const programmeResults: ProgrammeComplianceResult[] = [];

    for (const prog of programmes) {
      totalApproved += prog.approved_intake;

      // Count active enrolments for this programme
      const enrolments = db.prepare(`
        SELECT admission_category, COUNT(*) as count
        FROM enrolments
        WHERE programme_id = ? AND academic_session = ? AND enrolment_status = 'ACTIVE'
        GROUP BY admission_category
      `).all(prog.id, session) as { admission_category: string; count: number }[];

      const catMap: Record<string, number> = {};
      let progActiveTotal = 0;
      let regularCount = 0;
      let nriCount = 0;
      let supernumeraryCount = 0;

      for (const row of enrolments) {
        catMap[row.admission_category] = row.count;
        progActiveTotal += row.count;
        if (row.admission_category === 'NRI') {
          nriCount += row.count;
        } else if (row.admission_category.startsWith('SUPERNUMERARY')) {
          supernumeraryCount += row.count;
        } else {
          regularCount += row.count;
        }
      }

      totalEnrolled += progActiveTotal;

      const utilization = prog.approved_intake > 0 
        ? Number(((progActiveTotal / prog.approved_intake) * 100).toFixed(1))
        : 0;

      const remaining = Math.max(0, prog.approved_intake - regularCount);
      const excess = Math.max(0, regularCount - prog.approved_intake);

      let status: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
      if (excess > 0) {
        status = 'VIOLATION';
        hasViolations = true;

        // Check if an alert already exists, otherwise create it
        const existingAlert = db.prepare(`
          SELECT id FROM compliance_alerts 
          WHERE institution_id = ? AND programme_id = ? AND alert_type = 'INTAKE_CAPACITY_EXCESS' AND status = 'OPEN'
        `).get(institutionId, prog.id);

        if (!existingAlert) {
          const alertId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO compliance_alerts (
              id, institution_id, programme_id, alert_type, severity, title, description, status, created_at, evidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
          `).run(
            alertId,
            institutionId,
            prog.id,
            'INTAKE_CAPACITY_EXCESS',
            'CRITICAL',
            `Approved Intake Exceeded in ${prog.name} (${prog.code})`,
            `Institution reported ${regularCount} regular admissions against AICTE-approved capacity of ${prog.approved_intake} seats (Excess: +${excess} seats, ${utilization}% utilization).`,
            new Date().toISOString(),
            JSON.stringify({
              approvedIntake: prog.approved_intake,
              reportedRegular: regularCount,
              excessSeats: excess,
              utilizationPercentage: utilization,
              academicSession: session,
            })
          );
        }
      } else if (utilization >= 95) {
        status = 'WARNING';
      }

      const categoriesList = [
        { category: 'GENERAL', count: catMap['GENERAL'] || 0 },
        { category: 'OBC', count: catMap['OBC'] || 0 },
        { category: 'SC', count: catMap['SC'] || 0 },
        { category: 'ST', count: catMap['ST'] || 0 },
        { category: 'EWS', count: catMap['EWS'] || 0 },
        { category: 'NRI', count: catMap['NRI'] || 0, maxAllowed: prog.nri_quota },
        { category: 'SUPERNUMERARY_PMSSS', count: catMap['SUPERNUMERARY_PMSSS'] || 0 },
        { category: 'SUPERNUMERARY_TFW', count: catMap['SUPERNUMERARY_TFW'] || 0, maxAllowed: prog.supernumerary_quota },
      ];

      programmeResults.push({
        programmeId: prog.id,
        programmeName: prog.name,
        programmeCode: prog.code,
        degree: prog.degree,
        approvedIntake: prog.approved_intake,
        totalActiveEnrolment: progActiveTotal,
        regularAdmissions: regularCount,
        nriAdmissions: nriCount,
        supernumeraryAdmissions: supernumeraryCount,
        utilizationPercentage: utilization,
        remainingCapacity: remaining,
        excessAdmissions: excess,
        complianceStatus: status,
        categoryBreakdown: categoriesList,
      });
    }

    const overallUtil = totalApproved > 0 
      ? Number(((totalEnrolled / totalApproved) * 100).toFixed(1))
      : 0;

    const alertCount = (db.prepare(`
      SELECT COUNT(*) as count FROM compliance_alerts WHERE institution_id = ? AND status = 'OPEN'
    `).get(institutionId) as any).count;

    return {
      institutionId: institution.id,
      institutionName: institution.name,
      aicteId: institution.aicte_id,
      state: institution.state,
      academicSession: session,
      totalApprovedIntake: totalApproved,
      totalActiveEnrolment: totalEnrolled,
      overallUtilization: overallUtil,
      hasViolations,
      programmes: programmeResults,
      activeAlertsCount: alertCount,
    };
  }
}
