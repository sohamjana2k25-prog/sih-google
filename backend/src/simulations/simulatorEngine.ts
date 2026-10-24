import db from '../database/db.js';
import crypto from 'crypto';

export interface ProposedBatch {
  category: string;
  count: number;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  institutionId: string;
  institutionName: string;
  programmeId: string;
  programmeName: string;
  programmeCode: string;
  academicSession: string;
  approvedIntake: number;
  currentEnrolment: number;
  proposedAdmissions: number;
  projectedTotalEnrolment: number;
  projectedRegularEnrolment: number;
  projectedUtilization: number;
  isCompliant: boolean;
  excessSeats: number;
  warnings: string[];
  categoryBreakdown: {
    category: string;
    current: number;
    proposed: number;
    projected: number;
    maxAllowed?: number;
    isExceeded: boolean;
  }[];
  recommendations: string[];
  timestamp: string;
}

export class SimulatorEngine {
  static runSimulation(
    institutionId: string,
    programmeId: string,
    proposedBatches: ProposedBatch[],
    scenarioName = 'Hypothetical Admission Batch',
    academicSession = '2024-2025'
  ): SimulationResult {
    const institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(institutionId) as any;
    if (!institution) throw new Error('Institution not found');

    const programme = db.prepare(`SELECT * FROM programmes WHERE id = ?`).get(programmeId) as any;
    if (!programme) throw new Error('Programme not found');

    // Get current active enrolments broken down by category
    const currentEnrolments = db.prepare(`
      SELECT admission_category, COUNT(*) as count
      FROM enrolments
      WHERE programme_id = ? AND academic_session = ? AND enrolment_status = 'ACTIVE'
      GROUP BY admission_category
    `).all(programmeId, academicSession) as { admission_category: string; count: number }[];

    const currentMap: Record<string, number> = {};
    let currentTotal = 0;
    let currentRegular = 0;

    for (const r of currentEnrolments) {
      currentMap[r.admission_category] = r.count;
      currentTotal += r.count;
      if (!r.admission_category.startsWith('SUPERNUMERARY')) {
        currentRegular += r.count;
      }
    }

    let proposedTotal = 0;
    let proposedRegular = 0;
    const proposedMap: Record<string, number> = {};

    for (const b of proposedBatches) {
      proposedMap[b.category] = (proposedMap[b.category] || 0) + b.count;
      proposedTotal += b.count;
      if (!b.category.startsWith('SUPERNUMERARY')) {
        proposedRegular += b.count;
      }
    }

    const projectedRegular = currentRegular + proposedRegular;
    const projectedTotal = currentTotal + proposedTotal;
    const approvedIntake = programme.approved_intake;

    const excessSeats = Math.max(0, projectedRegular - approvedIntake);
    const projectedUtilization = approvedIntake > 0 
      ? Number(((projectedRegular / approvedIntake) * 100).toFixed(1))
      : 0;

    const isCompliant = excessSeats === 0;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!isCompliant) {
      warnings.push(`Projected admissions exceed approved regular intake by ${excessSeats} seat(s) (${projectedUtilization}% utilization).`);
      recommendations.push(`Reduce proposed regular admissions by at least ${excessSeats} candidate(s) to avoid AICTE regulatory infraction notice.`);
    } else if (projectedUtilization >= 95) {
      warnings.push(`Projected admissions reach ${projectedUtilization}% of approved capacity. Only ${approvedIntake - projectedRegular} seat(s) remaining.`);
      recommendations.push('Maintain strict buffer for verified candidates to prevent unintentional intake overflow.');
    } else {
      recommendations.push(`Simulation confirms proposed admissions are well within AICTE approved threshold (${approvedIntake - projectedRegular} available seats remaining).`);
    }

    // Category breakdown
    const allCategories = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'NRI', 'SUPERNUMERARY_PMSSS', 'SUPERNUMERARY_TFW'];
    const categoryBreakdown = allCategories.map(cat => {
      const cur = currentMap[cat] || 0;
      const prop = proposedMap[cat] || 0;
      const proj = cur + prop;
      let maxAllowed: number | undefined;

      if (cat === 'NRI') maxAllowed = programme.nri_quota;
      if (cat === 'SUPERNUMERARY_TFW') maxAllowed = programme.supernumerary_quota;

      const isExceeded = maxAllowed !== undefined && proj > maxAllowed;
      if (isExceeded) {
        warnings.push(`Category ${cat} exceeds ceiling: ${proj} projected vs ${maxAllowed} maximum sanctioned.`);
      }

      return {
        category: cat,
        current: cur,
        proposed: prop,
        projected: proj,
        maxAllowed,
        isExceeded,
      };
    });

    const scenarioId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Persist scenario without altering committed records
    db.prepare(`
      INSERT INTO simulation_scenarios (
        id, institution_id, academic_session, programme_id, scenario_name, current_admissions, proposed_admissions, proposed_by_category, approved_capacity, projected_utilization, is_compliant, excess_seats, warnings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scenarioId,
      institutionId,
      academicSession,
      programmeId,
      scenarioName,
      currentTotal,
      proposedTotal,
      JSON.stringify(proposedBatches),
      approvedIntake,
      projectedUtilization,
      isCompliant ? 1 : 0,
      excessSeats,
      JSON.stringify(warnings),
      timestamp
    );

    return {
      scenarioId,
      scenarioName,
      institutionId,
      institutionName: institution.name,
      programmeId,
      programmeName: programme.name,
      programmeCode: programme.code,
      academicSession,
      approvedIntake,
      currentEnrolment: currentTotal,
      proposedAdmissions: proposedTotal,
      projectedTotalEnrolment: projectedTotal,
      projectedRegularEnrolment: projectedRegular,
      projectedUtilization,
      isCompliant,
      excessSeats,
      warnings,
      categoryBreakdown,
      recommendations,
      timestamp,
    };
  }
}
