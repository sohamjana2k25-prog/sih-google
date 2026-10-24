import db from '../database/db.js';
import crypto from 'crypto';

export interface ConflictGraphNode {
  id: string;
  type: 'student' | 'institution' | 'programme';
  label: string;
  subLabel?: string;
  status?: string;
  hasConflict?: boolean;
  data: any;
}

export interface ConflictGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'enrolled_at' | 'transferred_from' | 'potential_conflict' | 'verified';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  animated?: boolean;
}

export class ConflictDetector {
  /**
   * Scans all students and detects cross-institution enrolment conflicts.
   */
  static runConflictScan(): number {
    // Find students with active enrolments across multiple institutions
    const multiEnrolled = db.prepare(`
      SELECT student_id, COUNT(DISTINCT institution_id) as inst_count
      FROM enrolments
      WHERE enrolment_status = 'ACTIVE'
      GROUP BY student_id
      HAVING inst_count > 1
    `).all() as { student_id: string; inst_count: number }[];

    let casesCreated = 0;

    for (const item of multiEnrolled) {
      const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(item.student_id) as any;
      if (!student) continue;

      const enrolments = db.prepare(`
        SELECT e.*, i.name as institution_name, p.name as programme_name
        FROM enrolments e
        JOIN institutions i ON e.institution_id = i.id
        JOIN programmes p ON e.programme_id = p.id
        WHERE e.student_id = ? AND e.enrolment_status = 'ACTIVE'
        ORDER BY e.admission_date DESC
      `).all(item.student_id) as any[];

      // Check if case already exists
      const existingCase = db.prepare(`
        SELECT id FROM conflict_cases WHERE student_id = ? AND status != 'RESOLVED'
      `).get(student.id);

      if (!existingCase) {
        const caseId = crypto.randomUUID();
        const instNames = enrolments.map(e => e.institution_name).join(' & ');

        db.prepare(`
          INSERT INTO conflict_cases (
            id, student_id, apaar_id, severity, classification, status, case_notes, created_at, updated_at
          ) VALUES (?, ?, ?, 'HIGH', 'OVERLAPPING_ENROLMENT', 'OPEN', ?, ?, ?)
        `).run(
          caseId,
          student.id,
          student.apaar_id,
          `Simultaneous active enrolments detected across institutions: ${instNames}. Verification required to check whether transfer was executed or duplicate admission occurred.`,
          new Date().toISOString(),
          new Date().toISOString()
        );

        for (const enr of enrolments) {
          db.prepare(`
            INSERT OR IGNORE INTO conflict_case_enrolments (case_id, enrolment_id) VALUES (?, ?)
          `).run(caseId, enr.id);
        }

        casesCreated++;
      }
    }

    return casesCreated;
  }

  /**
   * Builds dynamic Conflict Network Graph for visualization.
   */
  static getConflictGraph(filterStudentId?: string, filterInstitutionId?: string) {
    let query = `
      SELECT c.*, s.full_name as student_name, s.email as student_email
      FROM conflict_cases c
      JOIN students s ON c.student_id = s.id
      WHERE c.status != 'RESOLVED'
    `;
    const params: any[] = [];

    if (filterStudentId) {
      query += ` AND c.student_id = ?`;
      params.push(filterStudentId);
    }

    const cases = db.prepare(query).all(...params) as any[];

    const nodes: ConflictGraphNode[] = [];
    const edges: ConflictGraphEdge[] = [];
    const addedNodeIds = new Set<string>();

    for (const c of cases) {
      // Add Student Node
      if (!addedNodeIds.has(c.student_id)) {
        nodes.push({
          id: c.student_id,
          type: 'student',
          label: c.student_name,
          subLabel: `APAAR: ${c.apaar_id.slice(0, 4)}••••${c.apaar_id.slice(-4)}`,
          status: c.status,
          hasConflict: true,
          data: {
            studentId: c.student_id,
            apaarId: c.apaar_id,
            fullName: c.student_name,
            severity: c.severity,
            classification: c.classification,
            caseId: c.id,
            notes: c.case_notes,
          },
        });
        addedNodeIds.add(c.student_id);
      }

      // Get linked enrolments
      const enrolments = db.prepare(`
        SELECT e.*, i.name as institution_name, i.aicte_id, i.state, p.name as programme_name, p.code as programme_code
        FROM conflict_case_enrolments ce
        JOIN enrolments e ON ce.enrolment_id = e.id
        JOIN institutions i ON e.institution_id = i.id
        JOIN programmes p ON e.programme_id = p.id
        WHERE ce.case_id = ?
      `).all(c.id) as any[];

      for (let i = 0; i < enrolments.length; i++) {
        const enr = enrolments[i];

        // Add Institution Node
        if (!addedNodeIds.has(enr.institution_id)) {
          nodes.push({
            id: enr.institution_id,
            type: 'institution',
            label: enr.institution_name,
            subLabel: `AICTE ID: ${enr.aicte_id} (${enr.state})`,
            data: {
              institutionId: enr.institution_id,
              name: enr.institution_name,
              aicteId: enr.aicte_id,
              state: enr.state,
            },
          });
          addedNodeIds.add(enr.institution_id);
        }

        // Add Programme Node
        if (!addedNodeIds.has(enr.programme_id)) {
          nodes.push({
            id: enr.programme_id,
            type: 'programme',
            label: `${enr.programme_name} (${enr.programme_code})`,
            subLabel: enr.academic_session,
            data: {
              programmeId: enr.programme_id,
              name: enr.programme_name,
              session: enr.academic_session,
            },
          });
          addedNodeIds.add(enr.programme_id);
        }

        // Edge: Institution -> Programme
        const instProgEdgeId = `edge-${enr.institution_id}-${enr.programme_id}`;
        if (!edges.some(e => e.id === instProgEdgeId)) {
          edges.push({
            id: instProgEdgeId,
            source: enr.institution_id,
            target: enr.programme_id,
            label: 'Offers',
            type: 'verified',
          });
        }

        // Edge: Student -> Programme (Enrolment)
        edges.push({
          id: `edge-${c.student_id}-${enr.programme_id}-${enr.id}`,
          source: c.student_id,
          target: enr.programme_id,
          label: `${enr.enrolment_status} (${enr.academic_session})`,
          type: enr.enrolment_status === 'ACTIVE' ? 'potential_conflict' : 'transferred_from',
          severity: c.severity,
          animated: true,
        });
      }
    }

    return { nodes, edges, totalConflicts: cases.length };
  }
}
