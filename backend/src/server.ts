import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import institutionRoutes from './routes/institution.routes.js';
import studentRoutes from './routes/student.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import conflictRoutes from './routes/conflicts.routes.js';
import anomalyRoutes from './routes/anomalies.routes.js';
import copilotRoutes from './routes/copilot.routes.js';
import credentialRoutes from './routes/credentials.routes.js';
import consentRoutes from './routes/consent.routes.js';
import correctionRoutes from './routes/corrections.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import geographyRoutes from './routes/geography.routes.js';
import reportRoutes from './routes/reports.routes.js';
import auditRoutes from './routes/audit.routes.js';
import demoRoutes from './routes/demo.routes.js';
import { initializeDatabase } from './database/schema.js';

dotenv.config();

// Ensure DB schema initialized
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'APAAR-Sentinel Backend Regulatory Intelligence Engine',
    version: '1.0.0-SIH',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/public/credentials', credentialRoutes); // Also direct public access
app.use('/api/consents', consentRoutes);
app.use('/api/corrections', correctionRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/demo', demoRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected regulatory server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`   APAAR-Sentinel Backend Engine Running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`================================================================`);
});

export default app;
