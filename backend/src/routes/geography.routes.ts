import { Router, Request, Response } from 'express';
import db from '../database/db.js';

const router = Router();

// GET /api/geography/states
router.get('/states', (req: Request, res: Response) => {
  const states = db.prepare(`
    SELECT i.state,
           COUNT(DISTINCT i.id) as institutions_count,
           COUNT(e.id) as active_enrolments,
           ROUND(AVG(i.risk_score), 1) as avg_risk_score,
           SUM(CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END) as open_alerts_count
    FROM institutions i
    LEFT JOIN enrolments e ON i.id = e.institution_id AND e.enrolment_status = 'ACTIVE'
    LEFT JOIN compliance_alerts ca ON i.id = ca.institution_id AND ca.status = 'OPEN'
    GROUP BY i.state
    ORDER BY avg_risk_score DESC, institutions_count DESC
  `).all();

  return res.json({ states });
});

// GET /api/geography/institutions
router.get('/institutions', (req: Request, res: Response) => {
  const { state } = req.query;

  let sql = `
    SELECT i.id, i.aicte_id, i.name, i.state, i.district, i.address, i.type, i.latitude, i.longitude, i.status, i.risk_score,
           (SELECT COUNT(e.id) FROM enrolments e WHERE e.institution_id = i.id AND e.enrolment_status = 'ACTIVE') as total_enrolment,
           (SELECT COALESCE(SUM(p.approved_intake), 0) FROM programmes p WHERE p.institution_id = i.id) as total_approved_intake,
           (SELECT COUNT(ca.id) FROM compliance_alerts ca WHERE ca.institution_id = i.id AND ca.status = 'OPEN') as active_alerts_count
    FROM institutions i
    WHERE 1=1
  `;
  const params: any[] = [];

  if (state && state !== 'ALL') {
    sql += ` AND i.state = ?`;
    params.push(state);
  }

  sql += ` ORDER BY i.risk_score DESC`;
  const institutions = db.prepare(sql).all(...params);

  return res.json({ institutions });
});

export default router;
