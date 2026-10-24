import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';

const router = Router();

// GET /api/compliance/overview
router.get('/overview', (req: Request, res: Response) => {
  const { session = '2024-2025' } = req.query;

  const totalInstitutions = (db.prepare(`SELECT COUNT(*) as count FROM institutions`).get() as any).count;

  const totalSanctionedIntake = (db.prepare(`
    SELECT COALESCE(SUM(approved_intake), 0) as total FROM programmes WHERE academic_session = ?
  `).get(session) as any).total;

  const totalActiveEnrolment = (db.prepare(`
    SELECT COUNT(*) as count FROM enrolments WHERE academic_session = ? AND enrolment_status = 'ACTIVE'
  `).get(session) as any).count;

  const nationalUtilization = totalSanctionedIntake > 0 
    ? Number(((totalActiveEnrolment / totalSanctionedIntake) * 100).toFixed(1))
    : 0;

  const violationsCount = (db.prepare(`
    SELECT COUNT(*) as count FROM compliance_alerts WHERE alert_type = 'INTAKE_CAPACITY_EXCESS' AND status = 'OPEN'
  `).get() as any).count;

  const totalAlerts = (db.prepare(`
    SELECT COUNT(*) as count FROM compliance_alerts WHERE status = 'OPEN'
  `).get() as any).count;

  // State-wise enrolment & utilization breakdown
  const stateSummary = db.prepare(`
    SELECT i.state,
           COUNT(DISTINCT i.id) as institutions_count,
           SUM(p.approved_intake) as sanctioned_seats,
           COUNT(e.id) as active_admissions,
           ROUND(COUNT(e.id) * 100.0 / SUM(p.approved_intake), 1) as utilization_pct,
           SUM(CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END) as open_alerts_count
    FROM institutions i
    JOIN programmes p ON i.id = p.institution_id AND p.academic_session = ?
    LEFT JOIN enrolments e ON p.id = e.programme_id AND e.enrolment_status = 'ACTIVE'
    LEFT JOIN compliance_alerts ca ON i.id = ca.institution_id AND ca.status = 'OPEN'
    GROUP BY i.state
    ORDER BY active_admissions DESC
  `).all(session);

  // Top violating institutions
  const topViolations = db.prepare(`
    SELECT ca.*, i.name as institution_name, i.state, i.aicte_id, p.name as programme_name, p.code as programme_code
    FROM compliance_alerts ca
    JOIN institutions i ON ca.institution_id = i.id
    LEFT JOIN programmes p ON ca.programme_id = p.id
    WHERE ca.status = 'OPEN'
    ORDER BY ca.severity = 'CRITICAL' DESC, ca.created_at DESC
    LIMIT 10
  `).all();

  return res.json({
    kpis: {
      totalInstitutions,
      totalSanctionedIntake,
      totalActiveEnrolment,
      nationalUtilization,
      violationsCount,
      totalAlerts,
    },
    stateSummary,
    topViolations,
  });
});

// GET /api/compliance/institutions/:id
router.get('/institutions/:id', (req: Request, res: Response) => {
  try {
    const session = (req.query.session as string) || '2024-2025';
    const result = ComplianceEngine.evaluateInstitutionCompliance(req.params.id, session);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// GET /api/compliance/violations
router.get('/violations', (req: Request, res: Response) => {
  const { institutionId, severity, status = 'OPEN' } = req.query;

  let sql = `
    SELECT ca.*, i.name as institution_name, i.state, i.aicte_id,
           p.name as programme_name, p.code as programme_code
    FROM compliance_alerts ca
    JOIN institutions i ON ca.institution_id = i.id
    LEFT JOIN programmes p ON ca.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status !== 'ALL') {
    sql += ` AND ca.status = ?`;
    params.push(status);
  }
  if (institutionId) {
    sql += ` AND ca.institution_id = ?`;
    params.push(institutionId);
  }
  if (severity) {
    sql += ` AND ca.severity = ?`;
    params.push(severity);
  }

  sql += ` ORDER BY ca.created_at DESC`;
  const alerts = db.prepare(sql).all(...params);

  return res.json({ alerts, count: alerts.length });
});

// POST /api/compliance/recalculate
router.post('/recalculate', (req: Request, res: Response) => {
  const { institutionId } = req.body;
  if (institutionId) {
    const summary = ComplianceEngine.evaluateInstitutionCompliance(institutionId);
    return res.json({ success: true, summary });
  } else {
    const institutions = db.prepare(`SELECT id FROM institutions`).all() as any[];
    for (const inst of institutions) {
      ComplianceEngine.evaluateInstitutionCompliance(inst.id);
    }
    return res.json({ success: true, message: `Recalculated compliance for ${institutions.length} institutions.` });
  }
});

export default router;
