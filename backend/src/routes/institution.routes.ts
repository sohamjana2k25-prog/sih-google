import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';

const router = Router();

// GET /api/institutions
router.get('/', (req: Request, res: Response) => {
  const { state, search, status } = req.query;
  let sql = `
    SELECT i.*,
           (SELECT COUNT(DISTINCT p.id) FROM programmes p WHERE p.institution_id = i.id) as programmes_count,
           (SELECT COALESCE(SUM(p.approved_intake), 0) FROM programmes p WHERE p.institution_id = i.id) as total_approved_intake,
           (SELECT COUNT(e.id) FROM enrolments e WHERE e.institution_id = i.id AND e.enrolment_status = 'ACTIVE') as total_active_enrolment,
           (SELECT COUNT(ca.id) FROM compliance_alerts ca WHERE ca.institution_id = i.id AND ca.status = 'OPEN') as active_alerts_count
    FROM institutions i
    WHERE 1=1
  `;
  const params: any[] = [];

  if (state) {
    sql += ` AND i.state = ?`;
    params.push(state);
  }
  if (status) {
    sql += ` AND i.status = ?`;
    params.push(status);
  }
  if (search) {
    sql += ` AND (i.name LIKE ? OR i.aicte_id LIKE ? OR i.district LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY i.risk_score DESC, i.name ASC`;
  const institutions = db.prepare(sql).all(...params);

  return res.json({ institutions, count: institutions.length });
});

// GET /api/institutions/:id
router.get('/:id', (req: Request, res: Response) => {
  const institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(req.params.id) as any;
  if (!institution) {
    return res.status(404).json({ error: 'Institution not found' });
  }

  const programmes = db.prepare(`
    SELECT p.*,
           (SELECT COUNT(e.id) FROM enrolments e WHERE e.programme_id = p.id AND e.enrolment_status = 'ACTIVE') as current_admissions
    FROM programmes p
    WHERE p.institution_id = ?
    ORDER BY p.name ASC
  `).all(req.params.id);

  const compliance = ComplianceEngine.evaluateInstitutionCompliance(req.params.id);

  const alerts = db.prepare(`
    SELECT * FROM compliance_alerts WHERE institution_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  return res.json({
    institution,
    programmes,
    compliance,
    alerts,
  });
});

// GET /api/institutions/:id/statistics
router.get('/:id/statistics', (req: Request, res: Response) => {
  const institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(req.params.id) as any;
  if (!institution) {
    return res.status(404).json({ error: 'Institution not found' });
  }

  const compliance = ComplianceEngine.evaluateInstitutionCompliance(req.params.id);

  const verifications = db.prepare(`
    SELECT verification_status, COUNT(*) as count
    FROM enrolments
    WHERE institution_id = ?
    GROUP BY verification_status
  `).all(req.params.id) as { verification_status: string; count: number }[];

  const verMap: Record<string, number> = {};
  for (const v of verifications) verMap[v.verification_status] = v.count;

  const verified = verMap['VERIFIED'] || 0;
  const pending = (verMap['PENDING'] || 0) + (verMap['FLAGGED_MISMATCH'] || 0) + (verMap['UNAVAILABLE'] || 0);

  const correctionRequests = (db.prepare(`
    SELECT COUNT(*) as count
    FROM correction_requests cr
    JOIN enrolments e ON cr.enrolment_id = e.id
    WHERE e.institution_id = ? AND cr.status = 'SUBMITTED'
  `).get(req.params.id) as any).count;

  return res.json({
    institutionId: institution.id,
    name: institution.name,
    aicteId: institution.aicte_id,
    state: institution.state,
    totalEnrolled: compliance.totalActiveEnrolment,
    approvedIntake: compliance.totalApprovedIntake,
    utilizationPercentage: compliance.overallUtilization,
    verifiedStudents: verified,
    pendingVerification: pending,
    verificationRate: compliance.totalActiveEnrolment > 0 ? Number(((verified / compliance.totalActiveEnrolment) * 100).toFixed(1)) : 0,
    activeAlerts: compliance.activeAlertsCount,
    hasViolations: compliance.hasViolations,
    pendingCorrectionRequests: correctionRequests,
    riskScore: institution.risk_score,
  });
});

export default router;
