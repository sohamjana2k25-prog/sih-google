import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';

const router = Router();

// GET /api/conflicts
router.get('/', (req: Request, res: Response) => {
  const { status, severity } = req.query;

  let sql = `
    SELECT c.*, s.full_name as student_name, s.email as student_email,
           COUNT(ce.enrolment_id) as institutions_involved_count
    FROM conflict_cases c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN conflict_case_enrolments ce ON c.id = ce.case_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'ALL') {
    sql += ` AND c.status = ?`;
    params.push(status);
  }
  if (severity) {
    sql += ` AND c.severity = ?`;
    params.push(severity);
  }

  sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;
  const cases = db.prepare(sql).all(...params) as any[];

  const maskedCases = cases.map(c => ({
    ...c,
    apaar_id_masked: `${c.apaar_id.slice(0, 4)}-••••-${c.apaar_id.slice(-4)}`,
  }));

  return res.json({ cases: maskedCases, count: maskedCases.length });
});

// GET /api/conflicts/graph
router.get('/graph', (req: Request, res: Response) => {
  const { studentId, institutionId } = req.query;
  const graph = ConflictDetector.getConflictGraph(studentId as string, institutionId as string);
  return res.json(graph);
});

// GET /api/conflicts/:id
router.get('/:id', (req: Request, res: Response) => {
  const conflictCase = db.prepare(`
    SELECT c.*, s.full_name as student_name, s.dob, s.gender, s.email, s.phone
    FROM conflict_cases c
    JOIN students s ON c.student_id = s.id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!conflictCase) {
    return res.status(404).json({ error: 'Conflict case not found' });
  }

  const linkedEnrolments = db.prepare(`
    SELECT e.*, i.name as institution_name, i.aicte_id, i.state, p.name as programme_name, p.code as programme_code
    FROM conflict_case_enrolments ce
    JOIN enrolments e ON ce.enrolment_id = e.id
    JOIN institutions i ON e.institution_id = i.id
    JOIN programmes p ON e.programme_id = p.id
    WHERE ce.case_id = ?
    ORDER BY e.admission_date ASC
  `).all(req.params.id);

  return res.json({
    conflictCase: {
      ...conflictCase,
      apaar_id_masked: `${conflictCase.apaar_id.slice(0, 4)}-••••-${conflictCase.apaar_id.slice(-4)}`,
    },
    linkedEnrolments,
  });
});

// POST /api/conflicts/:id/resolve
router.post('/:id/resolve', (req: Request, res: Response) => {
  const { resolutionDetails, primaryEnrolmentId, secondaryEnrolmentAction = 'TRANSFERRED' } = req.body;
  if (!resolutionDetails) {
    return res.status(400).json({ error: 'Resolution details are required' });
  }

  const conflictCase = db.prepare(`SELECT * FROM conflict_cases WHERE id = ?`).get(req.params.id) as any;
  if (!conflictCase) {
    return res.status(404).json({ error: 'Conflict case not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE conflict_cases
    SET status = 'RESOLVED', resolution_details = ?, updated_at = ?
    WHERE id = ?
  `).run(resolutionDetails, now, req.params.id);

  // If a secondary enrolment should be marked transferred, update it
  if (primaryEnrolmentId) {
    const enrolments = db.prepare(`
      SELECT enrolment_id FROM conflict_case_enrolments WHERE case_id = ? AND enrolment_id != ?
    `).all(req.params.id, primaryEnrolmentId) as any[];

    for (const enr of enrolments) {
      db.prepare(`
        UPDATE enrolments 
        SET enrolment_status = ?, updated_at = ?
        WHERE id = ?
      `).run(secondaryEnrolmentAction, now, enr.enrolment_id);
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, 'AICTE_REGULATOR', 'CONFLICT_CASE_RESOLVED', 'conflict_cases', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    req.params.id,
    JSON.stringify({ resolutionDetails, primaryEnrolmentId }),
    now
  );

  return res.json({ success: true, message: 'Conflict case formally resolved and recorded in audit log.' });
});

export default router;
