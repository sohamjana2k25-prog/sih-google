import crypto from 'crypto';
import db from '../database/db.js';

const CREDENTIAL_SECRET = process.env.JWT_SECRET || 'apaar-credential-signature-secret-2024';

export interface VerifiableEnrolmentCredential {
  credentialReference: string;
  studentId: string;
  studentName: string;
  apaarIdMasked: string;
  institutionName: string;
  aicteId: string;
  programmeName: string;
  programmeCode: string;
  rollNumber: string;
  academicSession: string;
  enrolmentStatus: string;
  issuedAt: string;
  expiresAt: string;
  issuer: string;
  isPrototypeDemonstration: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  digitalSignature: string;
  verificationUrl: string;
}

export class CredentialManager {
  /**
   * Generates a digitally signed verifiable enrolment passport credential.
   */
  static issueCredential(
    studentId: string,
    enrolmentId: string,
    disclosedFields: string[] = ['fullName', 'institution', 'programme', 'session', 'status'],
    validityDays = 90
  ): VerifiableEnrolmentCredential {
    const student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(studentId) as any;
    if (!student) throw new Error('Student not found');

    const enrolment = db.prepare(`
      SELECT e.*, i.name as institution_name, i.aicte_id, p.name as programme_name, p.code as programme_code
      FROM enrolments e
      JOIN institutions i ON e.institution_id = i.id
      JOIN programmes p ON e.programme_id = p.id
      WHERE e.id = ? AND e.student_id = ?
    `).get(enrolmentId, studentId) as any;

    if (!enrolment) throw new Error('Enrolment record not found');

    const credentialRef = `SENTINEL-PASSPORT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      credentialReference: credentialRef,
      studentId,
      institutionId: enrolment.institution_id,
      enrolmentId,
      academicSession: enrolment.academic_session,
      rollNumber: enrolment.roll_number,
      enrolmentStatus: enrolment.enrolment_status,
      issuedAt,
      expiresAt,
    };

    // Cryptographic signature: HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', CREDENTIAL_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const verificationUrl = `/verify/${credentialRef}`;

    db.prepare(`
      INSERT INTO issued_credentials (
        id, credential_reference, student_id, enrolment_id, institution_id, disclosed_fields, status, digital_signature, qr_data, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      credentialRef,
      studentId,
      enrolmentId,
      enrolment.institution_id,
      JSON.stringify(disclosedFields),
      signature,
      JSON.stringify({ ref: credentialRef, sig: signature.slice(0, 16) }),
      expiresAt,
      issuedAt
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, ?, 'CREDENTIAL_ISSUED', 'issued_credentials', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      studentId,
      student.email,
      credentialRef,
      JSON.stringify({ ref: credentialRef, student: student.full_name }),
      issuedAt
    );

    return {
      credentialReference: credentialRef,
      studentId,
      studentName: student.full_name,
      apaarIdMasked: `••••-••••-${student.apaar_id.slice(-4)}`,
      institutionName: enrolment.institution_name,
      aicteId: enrolment.aicte_id,
      programmeName: enrolment.programme_name,
      programmeCode: enrolment.programme_code,
      rollNumber: enrolment.roll_number,
      academicSession: enrolment.academic_session,
      enrolmentStatus: enrolment.enrolment_status,
      issuedAt,
      expiresAt,
      issuer: 'APAAR-Sentinel National Academic Verification Service',
      isPrototypeDemonstration: true,
      status: 'ACTIVE',
      digitalSignature: signature,
      verificationUrl,
    };
  }

  /**
   * Publicly verifies a credential reference.
   */
  static verifyCredential(reference: string) {
    const cred = db.prepare(`
      SELECT c.*, s.full_name, s.apaar_id, s.dob, i.name as institution_name, i.aicte_id,
             p.name as programme_name, p.code as programme_code, e.roll_number, e.academic_session, e.enrolment_status
      FROM issued_credentials c
      JOIN students s ON c.student_id = s.id
      JOIN institutions i ON c.institution_id = i.id
      JOIN enrolments e ON c.enrolment_id = e.id
      JOIN programmes p ON e.programme_id = p.id
      WHERE c.credential_reference = ?
    `).get(reference) as any;

    if (!cred) {
      return {
        isValid: false,
        status: 'NOT_FOUND',
        message: 'No record found matching this credential reference.',
      };
    }

    // Check expiry
    const isExpired = new Date(cred.expires_at) < new Date();
    if (isExpired && cred.status === 'ACTIVE') {
      cred.status = 'EXPIRED';
    }

    // Verify cryptographic integrity
    const payload = {
      credentialReference: cred.credential_reference,
      studentId: cred.student_id,
      institutionId: cred.institution_id,
      enrolmentId: cred.enrolment_id,
      academicSession: cred.academic_session,
      rollNumber: cred.roll_number,
      enrolmentStatus: cred.enrolment_status,
      issuedAt: cred.created_at,
      expiresAt: cred.expires_at,
    };

    const calculatedSig = crypto
      .createHmac('sha256', CREDENTIAL_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const signatureValid = calculatedSig === cred.digital_signature;

    // Log data access for student privacy transparency
    db.prepare(`
      INSERT INTO data_access_logs (id, student_id, accessed_by, purpose, fields_accessed, access_type, timestamp)
      VALUES (?, ?, 'Third-Party Verification Portal', 'Public Credential Verification Request', 'Student Name, Institution, Programme, Roll Number, Session, Enrolment Status', 'CREDENTIAL_VERIFICATION', ?)
    `).run(crypto.randomUUID(), cred.student_id, new Date().toISOString());

    return {
      isValid: cred.status === 'ACTIVE' && signatureValid && !isExpired,
      status: cred.status,
      message: cred.status === 'ACTIVE' && signatureValid 
        ? 'Digital Credential Verified: Authenticity guaranteed via AICTE APAAR-Sentinel cryptographic seal.'
        : cred.status === 'REVOKED'
        ? 'Credential Revoked: The issuing student or institution has formally revoked this enrolment passport.'
        : isExpired
        ? 'Credential Expired: Validity period has lapsed.'
        : 'Invalid Digital Signature: Tampering detected.',
      credentialDetails: {
        credentialReference: cred.credential_reference,
        studentName: cred.full_name,
        apaarIdMasked: `••••-••••-${cred.apaar_id.slice(-4)}`,
        institutionName: cred.institution_name,
        aicteId: cred.aicte_id,
        programmeName: cred.programme_name,
        programmeCode: cred.programme_code,
        rollNumber: cred.roll_number,
        academicSession: cred.academic_session,
        enrolmentStatus: cred.enrolment_status,
        issuedAt: cred.created_at,
        expiresAt: cred.expires_at,
        revokedAt: cred.revoked_at,
        revocationReason: cred.revocation_reason,
        issuer: 'APAAR-Sentinel National Academic Verification Service',
        isDemonstrationPrototype: true,
      },
    };
  }

  /**
   * Revokes a credential.
   */
  static revokeCredential(reference: string, reason = 'Student requested credential invalidation') {
    const cred = db.prepare(`SELECT * FROM issued_credentials WHERE credential_reference = ?`).get(reference) as any;
    if (!cred) throw new Error('Credential not found');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE issued_credentials 
      SET status = 'REVOKED', revoked_at = ?, revocation_reason = ?
      WHERE credential_reference = ?
    `).run(now, reason, reference);

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, 'CREDENTIAL_REVOKED', 'issued_credentials', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      cred.student_id,
      reference,
      JSON.stringify({ ref: reference, reason }),
      now
    );

    return { success: true, reference, revokedAt: now };
  }
}
