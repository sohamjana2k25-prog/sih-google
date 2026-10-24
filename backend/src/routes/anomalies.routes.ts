import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { AnomalyEngine } from '../anomalies/anomalyEngine.js';

const router = Router();

// GET /api/anomalies
router.get('/', (req: Request, res: Response) => {
  const { session = '2024-2025' } = req.query;
  const evaluations = AnomalyEngine.evaluateAllInstitutions(session as string);
  return res.json({ evaluations, count: evaluations.length });
});

// GET /api/anomalies/statistics
router.get('/statistics', (req: Request, res: Response) => {
  const evaluations = AnomalyEngine.evaluateAllInstitutions();

  let low = 0;
  let moderate = 0;
  let elevated = 0;
  let critical = 0;

  for (const e of evaluations) {
    if (e.riskLevel === 'CRITICAL') critical++;
    else if (e.riskLevel === 'ELEVATED') elevated++;
    else if (e.riskLevel === 'MODERATE') moderate++;
    else low++;
  }

  const averageScore = evaluations.length > 0
    ? Number((evaluations.reduce((acc, curr) => acc + curr.riskScore, 0) / evaluations.length).toFixed(1))
    : 0;

  return res.json({
    totalInstitutions: evaluations.length,
    averageScore,
    distribution: {
      critical,
      elevated,
      moderate,
      low,
    },
    topFlagged: evaluations.slice(0, 5),
  });
});

// GET /api/anomalies/:institutionId
router.get('/:institutionId', (req: Request, res: Response) => {
  try {
    const session = (req.query.session as string) || '2024-2025';
    const evalResult = AnomalyEngine.evaluateInstitution(req.params.institutionId, session);
    return res.json(evalResult);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// POST /api/anomalies/:id/review
router.post('/:id/review', (req: Request, res: Response) => {
  const { status, comments } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  db.prepare(`
    UPDATE compliance_alerts SET status = ? WHERE id = ?
  `).run(status, req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, 'AICTE_OFFICER', 'ANOMALY_ALERT_REVIEWED', 'compliance_alerts', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    req.params.id,
    JSON.stringify({ newStatus: status, comments }),
    new Date().toISOString()
  );

  return res.json({ success: true, message: 'Anomaly review status updated.' });
});

export default router;
