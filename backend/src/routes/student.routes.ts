import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../database/db.js';
import { apaarVerificationService } from '../verification/apaarProvider.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';

const router = Router();

// GET /api/students
router.get('/', (req: Request, res: Response) => {
  const { institutionId, programmeId, verificationStatus, search, page = '1', limit = '20' } = req.query;
  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const offset = (p - 1) * l;

  let countSql = `
    SELECT COUNT(DISTINCT s.id) as total
    FROM students s
    JOIN enrolments e ON s.id = e.student_id
    WHERE 1=1
  `;
  let dataSql = `
    SELECT s.id, s.apaar_id, s.full_name, s.dob, s.gender, s.email, s.phone, s.created_at,
           e.id as enrolment_id, e.institution_id, e.programme_id, e.roll_number, e.academic_session,
           e.admission_category, e.enrolment_status, e.verification_status, e.verification_notes,
           i.name as institution_name, i.aicte_id,
           p.name as programme_name, p.code as programme_code
    FROM students s
    JOIN enrolments e ON s.id = e.student_id
    JOIN institutions i ON e.institution_id = i.id
    JOIN programmes p ON e.programme_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (institutionId) {
    countSql += ` AND e.institution_id = ?`;
    dataSql += ` AND e.institution_id = ?`;
    params.push(institutionId);
  }
  if (programmeId) {
    countSql += ` AND e.programme_id = ?`;
    dataSql += ` AND e.programme_id = ?`;
    params.push(programmeId);
  }
  if (verificationStatus) {
    countSql += ` AND e.verification_status = ?`;
    dataSql += ` AND e.verification_status = ?`;
    params.push(verificationStatus);
  }
  if (search) {
    const s = `%${search}%`;
    const searchFilter = ` AND (s.full_name LIKE ? OR s.apaar_id LIKE ? OR e.roll_number LIKE ? OR s.email LIKE ?)`;
    countSql += searchFilter;
    dataSql += searchFilter;
    params.push(s, s, s, s);
  }

  const total = (db.prepare(countSql).get(...params) as any).total;

  dataSql += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(dataSql).all(...params, l, offset) as any[];

  // Privacy: Mask sensitive APAAR ID for tabular view
  const maskedRows = rows.map(r => ({
    ...r,
    apaar_id_masked: `${r.apaar_id.slice(0, 4)}-••••-${r.apaar_id.slice(-4)}`,
  }));

  return res.json({
    students: maskedRows,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    },
  });
});

// GET /api/students/:id
router.get('/:id', (req: Request, res: Response) => {
  const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(req.params.id) as any;
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  const enrolments = db.prepare(`
    SELECT e.*, i.name as institution_name, i.aicte_id, i.state, p.name as programme_name, p.code as programme_code, p.degree
    FROM enrolments e
    JOIN institutions i ON e.institution_id = i.id
    JOIN programmes p ON e.programme_id = p.id
    WHERE e.student_id = ?
    ORDER BY e.admission_date DESC
  `).all(req.params.id);

  const verifications = db.prepare(`
    SELECT * FROM verification_records WHERE student_id = ? ORDER BY verified_at DESC
  `).all(req.params.id);

  const credentials = db.prepare(`
    SELECT * FROM issued_credentials WHERE student_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  const conflicts = db.prepare(`
    SELECT * FROM conflict_cases WHERE student_id = ?
  `).all(req.params.id);

  const corrections = db.prepare(`
    SELECT * FROM correction_requests WHERE student_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  return res.json({
    student: {
      ...student,
      apaar_id_masked: `${student.apaar_id.slice(0, 4)}-••••-${student.apaar_id.slice(-4)}`,
    },
    enrolments,
    verifications,
    credentials,
    conflicts,
    corrections,
  });
});

// POST /api/students (Manual Student Registration Form)
router.post('/', async (req: Request, res: Response) => {
  const {
    apaarId,
    fullName,
    dob,
    gender,
    email,
    phone,
    institutionId,
    programmeId,
    rollNumber,
    academicSession = '2024-2025',
    admissionDate = new Date().toISOString().split('T')[0],
    admissionCategory = 'GENERAL',
  } = req.body;

  if (!apaarId || !fullName || !institutionId || !programmeId || !rollNumber) {
    return res.status(400).json({ error: 'Missing mandatory fields: APAAR ID, Full Name, Institution, Programme, Roll Number' });
  }

  // Format check
  const cleanApaar = apaarId.replace(/[^0-9]/g, '');
  if (cleanApaar.length !== 12) {
    return res.status(400).json({ error: 'Invalid APAAR format: Expected 12 digits' });
  }
  const formattedApaar = `${cleanApaar.slice(0, 4)}-${cleanApaar.slice(4, 8)}-${cleanApaar.slice(8, 12)}`;

  // Find or create student
  let student = db.prepare(`SELECT * FROM students WHERE apaar_id = ?`).get(formattedApaar) as any;
  let studentId = student?.id;

  if (!studentId) {
    studentId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentId,
      formattedApaar,
      fullName,
      dob || '2004-01-01',
      gender || 'MALE',
      email || `${cleanApaar}@student.edu.in`,
      phone || '9800000000',
      crypto.createHash('sha256').update(formattedApaar).digest('hex'),
      new Date().toISOString()
    );
  }

  // Check duplicate enrolment in same institution & session
  const existingEnrolment = db.prepare(`
    SELECT * FROM enrolments WHERE student_id = ? AND institution_id = ? AND academic_session = ?
  `).get(studentId, institutionId, academicSession);

  if (existingEnrolment) {
    return res.status(409).json({ error: 'Student already has an active enrolment in this institution for the selected academic session.' });
  }

  const enrolmentId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO enrolments (
      id, student_id, institution_id, programme_id, roll_number, academic_session,
      admission_date, admission_category, enrolment_status, verification_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'PENDING', ?, ?)
  `).run(
    enrolmentId,
    studentId,
    institutionId,
    programmeId,
    rollNumber,
    academicSession,
    admissionDate,
    admissionCategory,
    new Date().toISOString(),
    new Date().toISOString()
  );

  // Run Mock APAAR Verification Pipeline
  const verResult = await apaarVerificationService.verifyStudent(formattedApaar, fullName, dob, gender);

  db.prepare(`
    UPDATE enrolments SET verification_status = ?, verification_notes = ? WHERE id = ?
  `).run(verResult.status, verResult.regulatoryNotes, enrolmentId);

  db.prepare(`
    INSERT INTO verification_records (id, enrolment_id, student_id, apaar_id, provider, result, verified_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    enrolmentId,
    studentId,
    formattedApaar,
    verResult.provider,
    verResult.status,
    verResult.timestamp,
    JSON.stringify(verResult.matchDetails)
  );

  // Trigger automated duplicate conflict check & intake compliance evaluation
  ConflictDetector.runConflictScan();
  ComplianceEngine.evaluateInstitutionCompliance(institutionId, academicSession);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
    VALUES (?, ?, 'STUDENT_MANUAL_REGISTRATION', 'students', ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    institutionId,
    studentId,
    JSON.stringify({ apaar: formattedApaar, name: fullName, roll: rollNumber, verification: verResult.status }),
    new Date().toISOString()
  );

  return res.status(201).json({
    success: true,
    message: 'Student registered and verified successfully',
    studentId,
    enrolmentId,
    verification: verResult,
  });
});

export default router;
