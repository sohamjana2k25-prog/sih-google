import { Router, Request, Response } from 'express';
import db from '../database/db.js';
import { SimulatorEngine } from '../simulations/simulatorEngine.js';

const router = Router();

// POST /api/simulations/run
router.post('/run', (req: Request, res: Response) => {
  const { institutionId, programmeId, proposedBatches, scenarioName, academicSession } = req.body;

  if (!institutionId || !programmeId || !proposedBatches || !Array.isArray(proposedBatches)) {
    return res.status(400).json({ error: 'institutionId, programmeId, and proposedBatches array are required' });
  }

  try {
    const result = SimulatorEngine.runSimulation(
      institutionId,
      programmeId,
      proposedBatches,
      scenarioName || 'Admission Batch Simulation',
      academicSession || '2024-2025'
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/simulations/history/:institutionId
router.get('/history/:institutionId', (req: Request, res: Response) => {
  const scenarios = db.prepare(`
    SELECT s.*, p.name as programme_name, p.code as programme_code
    FROM simulation_scenarios s
    JOIN programmes p ON s.programme_id = p.id
    WHERE s.institution_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.institutionId);

  return res.json({ scenarios });
});

export default router;
