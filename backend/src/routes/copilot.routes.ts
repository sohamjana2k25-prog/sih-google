import { Router, Request, Response } from 'express';
import { RegulatoryCopilot } from '../copilot/regulatoryCopilot.js';

const router = Router();

// POST /api/copilot/query
router.post('/query', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query text is required' });
  }

  try {
    const response = await RegulatoryCopilot.executeQuery(query);
    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process regulatory query: ' + err.message });
  }
});

// GET /api/copilot/suggestions
router.get('/suggestions', (req: Request, res: Response) => {
  return res.json({
    suggestions: [
      'Show colleges in West Bengal exceeding approved CSE intake',
      'Which institutions have the most unresolved duplicate enrolment cases?',
      'What is the verification rate for engineering students in Maharashtra?',
      'Compare admission utilization across three institutions',
      'Explain why College XYZ has a high anomaly score',
      'Show institutions with pending verification cases',
      'Summarize enrolment trends for the current academic session',
    ],
  });
});

export default router;
