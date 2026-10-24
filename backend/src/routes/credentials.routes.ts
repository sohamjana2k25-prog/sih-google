import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { CredentialManager } from '../credentials/credentialManager.js';

const router = Router();

// POST /api/credentials
router.post('/', (req: Request, res: Response) => {
  const { studentId, enrolmentId, disclosedFields, validityDays = 90 } = req.body;
  if (!studentId || !enrolmentId) {
    return res.status(400).json({ error: 'studentId and enrolmentId are required' });
  }

  try {
    const cred = CredentialManager.issueCredential(studentId, enrolmentId, disclosedFields, validityDays);
    return res.status(201).json({ success: true, credential: cred });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/credentials/student/:studentId
router.get('/student/:studentId', (req: Request, res: Response) => {
  const credentials = db.prepare(`
    SELECT c.*, i.name as institution_name, i.aicte_id, p.name as programme_name, p.code as programme_code,
           e.roll_number, e.academic_session, e.enrolment_status
    FROM issued_credentials c
    JOIN institutions i ON c.institution_id = i.id
    JOIN enrolments e ON c.enrolment_id = e.id
    JOIN programmes p ON e.programme_id = p.id
    WHERE c.student_id = ?
    ORDER BY c.created_at DESC
  `).all(req.params.studentId);

  return res.json({ credentials });
});

// POST /api/credentials/:ref/revoke
router.post('/:ref/revoke', (req: Request, res: Response) => {
  const { reason = 'Revoked by student' } = req.body;
  try {
    const result = CredentialManager.revokeCredential(req.params.ref, reason);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/public/credentials/verify/:ref (Public verification check)
router.get('/public/verify/:ref', (req: Request, res: Response) => {
  const verification = CredentialManager.verifyCredential(req.params.ref);
  return res.json(verification);
});

export default router;
