import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../database/db.js';

const router = Router();

// GET /api/consents/student/:studentId
router.get('/student/:studentId', (req: Request, res: Response) => {
  const consents = db.prepare(`
    SELECT * FROM consent_requests WHERE student_id = ? ORDER BY requested_at DESC
  `).all(req.params.studentId);

  return res.json({ consents });
});

// POST /api/consents/:id/approve
router.post('/:id/approve', (req: Request, res: Response) => {
  const consent = db.prepare(`SELECT * FROM consent_requests WHERE id = ?`).get(req.params.id) as any;
  if (!consent) return res.status(404).json({ error: 'Consent request not found' });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE consent_requests SET status = 'APPROVED', decided_at = ? WHERE id = ?
  `).run(now, req.params.id);

  // Log permitted data access
  db.prepare(`
    INSERT INTO data_access_logs (id, student_id, accessed_by, purpose, fields_accessed, access_type, timestamp)
    VALUES (?, ?, ?, ?, ?, 'CONSENT_BASED', ?)
  `).run(
    crypto.randomUUID(),
    consent.student_id,
    consent.requester_name,
    consent.purpose,
    consent.requested_fields,
    now
  );

  return res.json({ success: true, message: 'Consent request approved. Authorization token granted for requested scope.' });
});

// POST /api/consents/:id/reject
router.post('/:id/reject', (req: Request, res: Response) => {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE consent_requests SET status = 'REJECTED', decided_at = ? WHERE id = ?
  `).run(now, req.params.id);

  return res.json({ success: true, message: 'Consent request declined.' });
});

// POST /api/consents/:id/revoke
router.post('/:id/revoke', (req: Request, res: Response) => {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE consent_requests SET status = 'REVOKED', decided_at = ? WHERE id = ?
  `).run(now, req.params.id);

  return res.json({ success: true, message: 'Consent revoked. Previous third-party data access invalidated.' });
});

// GET /api/consents/access-logs/:studentId
router.get('/access-logs/:studentId', (req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT * FROM data_access_logs WHERE student_id = ? ORDER BY timestamp DESC
  `).all(req.params.studentId);

  return res.json({ logs });
});

export default router;
