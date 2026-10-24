import { Router, Request, Response } from 'express';
import db from '../database/db.js';

const router = Router();

// GET /api/audit-logs
router.get('/', (req: Request, res: Response) => {
  const { action, limit = '50' } = req.query;
  const l = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));

  let sql = `SELECT * FROM audit_logs WHERE 1=1`;
  const params: any[] = [];

  if (action) {
    sql += ` AND action = ?`;
    params.push(action);
  }

  sql += ` ORDER BY timestamp DESC LIMIT ?`;
  params.push(l);

  const logs = db.prepare(sql).all(...params);
  return res.json({ logs, count: logs.length });
});

export default router;
