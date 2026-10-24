import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse as parseCsv } from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import crypto from 'crypto';
import db from '../database/db.js';
import { SmartUploadEngine } from '../uploads/smartUpload.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// POST /api/uploads/parse (Step 1: Upload & Header Extraction)
router.post('/parse', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please provide a CSV or XLSX file.' });
  }

  try {
    const filename = req.file.originalname;
    let headers: string[] = [];
    let rows: any[] = [];

    if (filename.endsWith('.csv')) {
      const csvContent = req.file.buffer.toString('utf-8');
      const records = parseCsv(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      rows = records;
      if (rows.length > 0) {
        headers = Object.keys(rows[0]);
      }
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = xlsx.utils.sheet_to_json(sheet);
      if (rows.length > 0) {
        headers = Object.keys(rows[0]);
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload CSV or XLSX.' });
    }

    const suggestedMappings = SmartUploadEngine.suggestMappings(headers);

    return res.json({
      filename,
      totalRows: rows.length,
      headers,
      suggestedMappings,
      previewRows: rows.slice(0, 10),
      rawRows: rows, // Returned to client state for next step
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to parse file: ' + err.message });
  }
});

// POST /api/uploads/validate (Step 2: Validate with Selected Column Mappings)
router.post('/validate', (req: Request, res: Response) => {
  const { rows, mappings, institutionId, session = '2024-2025' } = req.body;

  if (!rows || !Array.isArray(rows) || !mappings || !institutionId) {
    return res.status(400).json({ error: 'rows, mappings, and institutionId are required' });
  }

  try {
    const validationResult = SmartUploadEngine.validateRows(rows, mappings, institutionId, session);
    return res.json(validationResult);
  } catch (err: any) {
    return res.status(500).json({ error: 'Validation failed: ' + err.message });
  }
});

// POST /api/uploads/confirm (Step 3: Commit Valid Rows into Database & Pipeline)
router.post('/confirm', async (req: Request, res: Response) => {
  const { institutionId, validRows, filename, session = '2024-2025' } = req.body;

  if (!institutionId || !validRows || !Array.isArray(validRows)) {
    return res.status(400).json({ error: 'institutionId and validRows are required' });
  }

  try {
    const batchId = `batch-${crypto.randomUUID().slice(0, 8)}`;
    const result = await SmartUploadEngine.commitImport(batchId, institutionId, validRows, session);

    // Save batch record
    db.prepare(`
      INSERT INTO upload_batches (
        id, institution_id, filename, total_rows, valid_rows, invalid_rows, duplicate_rows, status, validation_report, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 'CONFIRMED', ?, ?)
    `).run(
      batchId,
      institutionId,
      filename || 'Batch_Import.csv',
      validRows.length,
      result.importedCount,
      JSON.stringify(result),
      new Date().toISOString()
    );

    return res.json({
      success: true,
      message: `Successfully imported ${result.importedCount} student records. APAAR verification completed (${result.verifiedCount} verified, ${result.mismatchCount} review flags). Intake compliance updated.`,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Import confirmation failed: ' + err.message });
  }
});

// GET /api/uploads/history/:institutionId
router.get('/history/:institutionId', (req: Request, res: Response) => {
  const batches = db.prepare(`
    SELECT * FROM upload_batches WHERE institution_id = ? ORDER BY created_at DESC
  `).all(req.params.institutionId);

  return res.json({ batches });
});

export default router;
