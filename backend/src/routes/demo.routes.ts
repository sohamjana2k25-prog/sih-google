import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { seedDatabase } from '../database/seed.js';

const router = Router();

// POST /api/demo/reset
router.post('/reset', async (req: Request, res: Response) => {
  try {
    console.log('[DEMO RESET] Re-seeding database upon administrator request...');
    await seedDatabase();
    return res.json({
      success: true,
      message: 'Demo database has been successfully reset to initial hackathon demonstration baseline.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset demo database: ' + err.message });
  }
});

// GET /api/demo/status
router.get('/status', (req: Request, res: Response) => {
  const institutions = (db.prepare(`SELECT COUNT(*) as count FROM institutions`).get() as any).count;
  const students = (db.prepare(`SELECT COUNT(*) as count FROM students`).get() as any).count;
  const alerts = (db.prepare(`SELECT COUNT(*) as count FROM compliance_alerts WHERE status = 'OPEN'`).get() as any).count;
  const conflicts = (db.prepare(`SELECT COUNT(*) as count FROM conflict_cases WHERE status = 'OPEN'`).get() as any).count;

  return res.json({
    isDemonstrationMode: true,
    databaseStatus: 'OPERATIONAL',
    indexedInstitutions: institutions,
    indexedStudents: students,
    activeAlerts: alerts,
    activeConflicts: conflicts,
    currentTime: new Date().toISOString(),
  });
});

export default router;
