import crypto from 'crypto';
import db from '../database/db.js';
import { apaarVerificationService } from '../verification/apaarProvider.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';

export interface ColumnMappingSuggestion {
  sourceColumn: string;
  targetField: string;
  confidence: number;
}

export interface RowValidationError {
  rowNumber: number;
  field: string;
  value: any;
  error: string;
}

export interface NormalizedStudentRow {
  rowNumber: number;
  apaarId: string;
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  rollNumber: string;
  programmeCode: string;
  admissionCategory: string;
  admissionDate: string;
  isValid: boolean;
  errors: string[];
}

export class SmartUploadEngine {
  private static CANONICAL_MAP: Record<string, string[]> = {
    full_name: ['studentname', 'student_name', 'candidatename', 'candidate_name', 'full name', 'fullname', 'name', 'student'],
    apaar_id: ['apaar', 'apaar_id', 'apaarid', 'academic_id', 'academicid', 'apaar_no', 'apaarno', 'abc_id', 'abcid'],
    dob: ['dob', 'date of birth', 'date_of_birth', 'birthdate', 'birth_date'],
    gender: ['gender', 'sex'],
    email: ['email', 'candidate_email', 'student_email', 'email_address'],
    phone: ['phone', 'mobile', 'contact', 'contact_no', 'mobile_no'],
    rollNumber: ['rollno', 'roll_no', 'roll_number', 'rollnumber', 'reg_no', 'registration_no'],
    programmeCode: ['programme', 'course', 'branch', 'department', 'prog_code', 'programme_code'],
    admissionCategory: ['category', 'admission_category', 'quota', 'seat_category'],
    admissionDate: ['admissiondate', 'admission_date', 'date_of_admission', 'admitted_on', 'admission_dt'],
  };

  /**
   * Automatically inspects headers and suggests best field mappings.
   */
  static suggestMappings(headers: string[]): Record<string, string> {
    const mappings: Record<string, string> = {};

    for (const h of headers) {
      const cleanH = h.trim().toLowerCase().replace(/[\s_-]+/g, '');
      let bestMatch = '';
      let bestScore = 0;

      for (const [canonical, aliases] of Object.entries(this.CANONICAL_MAP)) {
        for (const alias of aliases) {
          const cleanAlias = alias.replace(/[\s_-]+/g, '');
          if (cleanH === cleanAlias) {
            bestMatch = canonical;
            bestScore = 1.0;
            break;
          } else if (cleanH.includes(cleanAlias) || cleanAlias.includes(cleanH)) {
            if (bestScore < 0.8) {
              bestMatch = canonical;
              bestScore = 0.8;
            }
          }
        }
        if (bestScore === 1.0) break;
      }

      if (bestMatch && !Object.values(mappings).includes(bestMatch)) {
        mappings[h] = bestMatch;
      }
    }

    return mappings;
  }

  /**
   * Validates raw uploaded rows according to selected column mappings.
   */
  static validateRows(
    rows: any[],
    mappings: Record<string, string>,
    institutionId: string,
    session = '2024-2025'
  ) {
    const normalizedRows: NormalizedStudentRow[] = [];
    const validationErrors: RowValidationError[] = [];
    const seenApaarInBatch = new Set<string>();

    // Fetch valid programmes for this institution
    const validProgrammes = db.prepare(`
      SELECT * FROM programmes WHERE institution_id = ? AND academic_session = ?
    `).all(institutionId, session) as any[];
    const validProgCodes = new Set(validProgrammes.map(p => p.code.toUpperCase()));

    rows.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const rowData: Record<string, any> = {};

      for (const [sourceCol, targetField] of Object.entries(mappings)) {
        rowData[targetField] = raw[sourceCol];
      }

      const errors: string[] = [];
      const apaarRaw = String(rowData.full_name ? rowData.apaar_id || '' : '').trim();
      const cleanApaar = apaarRaw.replace(/[^0-9]/g, '');

      // Validation 1: APAAR ID
      if (!apaarRaw) {
        errors.push('APAAR ID is missing.');
        validationErrors.push({ rowNumber: rowNum, field: 'apaar_id', value: '', error: 'Mandatory APAAR ID missing' });
      } else if (cleanApaar.length !== 12) {
        errors.push(`Invalid APAAR format: Expected 12 digits (found ${cleanApaar.length}).`);
        validationErrors.push({ rowNumber: rowNum, field: 'apaar_id', value: apaarRaw, error: 'Expected 12 numeric digits' });
      } else if (seenApaarInBatch.has(cleanApaar)) {
        errors.push(`Duplicate APAAR ID within this upload batch.`);
        validationErrors.push({ rowNumber: rowNum, field: 'apaar_id', value: apaarRaw, error: 'Duplicate identifier in batch' });
      } else {
        seenApaarInBatch.add(cleanApaar);
      }

      // Validation 2: Full Name
      const name = String(rowData.full_name || '').trim();
      if (!name || name.length < 2) {
        errors.push('Candidate name is missing or invalid.');
        validationErrors.push({ rowNumber: rowNum, field: 'full_name', value: name, error: 'Invalid candidate name' });
      }

      // Validation 3: Programme Code
      const progCode = String(rowData.programmeCode || 'CSE').trim().toUpperCase();
      if (validProgCodes.size > 0 && !validProgCodes.has(progCode)) {
        errors.push(`Programme code "${progCode}" does not match approved programmes for this institution.`);
        validationErrors.push({ rowNumber: rowNum, field: 'programmeCode', value: progCode, error: 'Unrecognized programme code' });
      }

      // Validation 4: Category
      const rawCat = String(rowData.admissionCategory || 'GENERAL').trim().toUpperCase();
      const allowedCategories = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'NRI', 'SUPERNUMERARY_PMSSS', 'SUPERNUMERARY_TFW'];
      const category = allowedCategories.includes(rawCat) ? rawCat : 'GENERAL';

      // Normalized format
      const formattedApaar = cleanApaar.length === 12 
        ? `${cleanApaar.slice(0, 4)}-${cleanApaar.slice(4, 8)}-${cleanApaar.slice(8, 12)}`
        : apaarRaw;

      normalizedRows.push({
        rowNumber: rowNum,
        apaarId: formattedApaar,
        fullName: name || `Student ${rowNum}`,
        dob: rowData.dob || '2004-05-15',
        gender: (rowData.gender || 'MALE').toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE',
        email: rowData.email || `student.${rowNum}@example.edu.in`,
        phone: rowData.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        rollNumber: rowData.rollNumber || `ROLL-${2024000 + rowNum}`,
        programmeCode: progCode,
        admissionCategory: category,
        admissionDate: rowData.admissionDate || '2024-08-01',
        isValid: errors.length === 0,
        errors,
      });
    });

    const validCount = normalizedRows.filter(r => r.isValid).length;
    const invalidCount = normalizedRows.length - validCount;

    return {
      totalRows: normalizedRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      normalizedRows,
      validationErrors,
    };
  }

  /**
   * Commits validated student records into database, executes verification, and runs duplicate & compliance checks.
   */
  static async commitImport(
    batchId: string,
    institutionId: string,
    validRows: NormalizedStudentRow[],
    session = '2024-2025'
  ) {
    const institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(institutionId) as any;
    if (!institution) throw new Error('Institution not found');

    const programmes = db.prepare(`
      SELECT * FROM programmes WHERE institution_id = ? AND academic_session = ?
    `).all(institutionId, session) as any[];
    const progMap: Record<string, string> = {};
    for (const p of programmes) progMap[p.code.toUpperCase()] = p.id;

    let importedCount = 0;
    let verifiedCount = 0;
    let mismatchCount = 0;

    // Use SQLite transaction for atomic batch insertion
    const insertTransaction = db.transaction((rows: NormalizedStudentRow[]) => {
      for (const r of rows) {
        // 1. Insert or get student
        let student = db.prepare(`SELECT * FROM students WHERE apaar_id = ?`).get(r.apaarId) as any;
        let studentId = student?.id;

        if (!studentId) {
          studentId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            studentId,
            r.apaarId,
            r.fullName,
            r.dob,
            r.gender,
            r.email,
            r.phone,
            crypto.createHash('sha256').update(r.apaarId).digest('hex'),
            new Date().toISOString()
          );
        }

        // 2. Insert Enrolment
        const programmeId = progMap[r.programmeCode.toUpperCase()] || programmes[0]?.id;
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
          r.rollNumber,
          session,
          r.admissionDate,
          r.admissionCategory,
          new Date().toISOString(),
          new Date().toISOString()
        );

        importedCount++;
      }
    });

    insertTransaction(validRows);

    // Run verification pipeline
    for (const r of validRows) {
      const student = db.prepare(`SELECT * FROM students WHERE apaar_id = ?`).get(r.apaarId) as any;
      if (!student) continue;

      const enrolment = db.prepare(`
        SELECT * FROM enrolments WHERE student_id = ? AND institution_id = ? AND academic_session = ?
      `).get(student.id, institutionId, session) as any;
      if (!enrolment) continue;

      const res = await apaarVerificationService.verifyStudent(r.apaarId, r.fullName, r.dob, r.gender);

      db.prepare(`
        UPDATE enrolments 
        SET verification_status = ?, verification_notes = ?, updated_at = ?
        WHERE id = ?
      `).run(res.status, res.regulatoryNotes, new Date().toISOString(), enrolment.id);

      db.prepare(`
        INSERT INTO verification_records (id, enrolment_id, student_id, apaar_id, provider, result, verified_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        enrolment.id,
        student.id,
        r.apaarId,
        res.provider,
        res.status,
        res.timestamp,
        JSON.stringify(res.matchDetails)
      );

      if (res.status === 'VERIFIED') verifiedCount++;
      else mismatchCount++;
    }

    // Run Duplicate & Conflict Detector
    ConflictDetector.runConflictScan();

    // Recalculate Compliance
    ComplianceEngine.evaluateInstitutionCompliance(institutionId, session);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, 'BULK_STUDENT_IMPORT_COMMITTED', 'upload_batches', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      institutionId,
      batchId,
      JSON.stringify({ imported: importedCount, verified: verifiedCount, mismatch: mismatchCount }),
      new Date().toISOString()
    );

    return {
      batchId,
      importedCount,
      verifiedCount,
      mismatchCount,
      timestamp: new Date().toISOString(),
    };
  }
}
