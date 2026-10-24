import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../database/db.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';

const router = Router();

// GET /api/corrections
router.get('/', (req: Request, res: Response) => {
  const { institutionId, studentId, status } = req.query;

  let sql = `
    SELECT cr.*, s.full_name as student_name, s.apaar_id, s.email as student_email,
           i.name as institution_name, i.id as institution_id,
           p.name as programme_name, p.code as programme_code,
           e.roll_number
    FROM correction_requests cr
    JOIN students s ON cr.student_id = s.id
    JOIN enrolments e ON cr.enrolment_id = e.id
    JOIN institutions i ON e.institution_id = i.id
    JOIN programmes p ON e.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (institutionId) {
    sql += ` AND e.institution_id = ?`;
    params.push(institutionId);
  }
  if (studentId) {
    sql += ` AND cr.student_id = ?`;
    params.push(studentId);
  }
  if (status && status !== 'ALL') {
    sql += ` AND cr.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY cr.created_at DESC`;
  const requests = db.prepare(sql).all(...params) as any[];

  const maskedRequests = requests.map(r => ({
    ...r,
    apaar_id_masked: `${r.apaar_id.slice(0, 4)}-••••-${r.apaar_id.slice(-4)}`,
  }));

  return res.json({ requests: maskedRequests, count: maskedRequests.length });
});

// POST /api/corrections
router.post('/', (req: Request, res: Response) => {
  const { studentId, enrolmentId, fieldName, currentValue, proposedValue, reason, evidenceUrl } = req.body;

  if (!studentId || !enrolmentId || !fieldName || !proposedValue || !reason) {
    return res.status(400).json({ error: 'All correction fields (fieldName, proposedValue, reason) are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO correction_requests (
      id, student_id, enrolment_id, field_name, current_value, proposed_value, reason, evidence_url, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
  `).run(
    id,
    studentId,
    enrolmentId,
    fieldName,
    currentValue || '',
    proposedValue,
    reason,
    evidenceUrl || 'submitted_document.pdf',
    now
  );

  return res.status(201).json({ success: true, message: 'Correction request submitted to institution for regulatory review.', requestId: id });
});

// POST /api/corrections/:id/review
router.post('/:id/review', (req: Request, res: Response) => {
  const { decision, reviewerId = 'INSTITUTION_REGISTRAR', comments } = req.body;

  if (!decision || !['APPROVED', 'REJECTED', 'MORE_INFO'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be APPROVED, REJECTED, or MORE_INFO' });
  }

  const correction = db.prepare(`SELECT * FROM correction_requests WHERE id = ?`).get(req.params.id) as any;
  if (!correction) {
    return res.status(404).json({ error: 'Correction request not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE correction_requests 
    SET status = ?, reviewer_id = ?, reviewer_comments = ?, resolved_at = ?
    WHERE id = ?
  `).run(decision, reviewerId, comments || '', now, req.params.id);

  // If APPROVED, apply correction to enrolment or student table
  if (decision === 'APPROVED') {
    if (correction.field_name === 'enrolment_status') {
      db.prepare(`
        UPDATE enrolments SET enrolment_status = ?, updated_at = ? WHERE id = ?
      `).run(correction.proposed_value, now, correction.enrolment_id);

      // Recalculate Conflict cases!
      ConflictDetector.runConflictScan();

      // If student was marked transferred, check if any open conflict case can now be resolved
      const enr = db.prepare(`SELECT * FROM enrolments WHERE id = ?`).get(correction.enrolment_id) as any;
      if (enr) {
        ComplianceEngine.evaluateInstitutionCompliance(enr.institution_id);

        const openCase = db.prepare(`
          SELECT c.id FROM conflict_cases c
          JOIN conflict_case_enrolments ce ON c.id = ce.case_id
          WHERE ce.enrolment_id = ? AND c.status = 'OPEN'
        `).get(correction.enrolment_id) as any;

        if (openCase) {
          db.prepare(`
            UPDATE conflict_cases 
            SET status = 'RESOLVED', resolution_details = ?, updated_at = ?
            WHERE id = ?
          `).run(`Resolved via Student Correction Approval: Record status updated to ${correction.proposed_value}.`, now, openCase.id);
        }
      }
    } else if (correction.field_name === 'full_name' || correction.field_name === 'dob') {
      db.prepare(`
        UPDATE students SET ${correction.field_name} = ? WHERE id = ?
      `).run(correction.proposed_value, correction.student_id);
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, 'STUDENT_RECORD_CORRECTION_APPROVED', 'correction_requests', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      reviewerId,
      req.params.id,
      JSON.stringify({ field: correction.field_name, from: correction.current_value, to: correction.proposed_value }),
      now
    );
  }

  return res.json({ success: true, message: `Correction request marked as ${decision}. Underlying records synchronized.` });
});

export default router;
