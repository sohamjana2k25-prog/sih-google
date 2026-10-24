import db from './db.js';

export function initializeDatabase() {
  db.exec(`
    -- 1. Users & Authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'AICTE_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT'
      name TEXT NOT NULL,
      institution_id TEXT,
      student_id TEXT,
      created_at TEXT NOT NULL
    );

    -- 2. Institutions
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      aicte_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Government', 'Private', 'Autonomous', 'Deemed'
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'UNDER_REVIEW', 'SUSPENDED'
      risk_score INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 3. Programmes
    CREATE TABLE IF NOT EXISTS programmes (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      degree TEXT NOT NULL,
      duration_years INTEGER NOT NULL,
      approved_intake INTEGER NOT NULL,
      nri_quota INTEGER DEFAULT 0,
      supernumerary_quota INTEGER DEFAULT 0,
      academic_session TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- 4. Category Rules
    CREATE TABLE IF NOT EXISTS intake_category_rules (
      id TEXT PRIMARY KEY,
      programme_id TEXT NOT NULL,
      category TEXT NOT NULL,
      max_seats INTEGER NOT NULL,
      academic_session TEXT NOT NULL,
      FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
    );

    -- 5. Students
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      apaar_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      aadhaar_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 6. Enrolments
    CREATE TABLE IF NOT EXISTS enrolments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      programme_id TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      academic_session TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      admission_category TEXT NOT NULL, -- 'GENERAL', 'OBC', 'SC', 'ST', 'EWS', 'NRI', 'SUPERNUMERARY_PMSSS', 'SUPERNUMERARY_TFW'
      enrolment_status TEXT NOT NULL, -- 'ACTIVE', 'TRANSFERRED', 'COMPLETED', 'WITHDRAWN', 'SUSPENDED'
      verification_status TEXT NOT NULL, -- 'VERIFIED', 'PENDING', 'FLAGGED_MISMATCH', 'UNAVAILABLE'
      verification_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
      FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
    );

    -- 7. Verification Records
    CREATE TABLE IF NOT EXISTS verification_records (
      id TEXT PRIMARY KEY,
      enrolment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      apaar_id TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'MockApaarVerificationProvider',
      result TEXT NOT NULL, -- 'VERIFIED', 'FLAGGED_MISMATCH', 'UNAVAILABLE', 'TIMEOUT'
      verified_at TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (enrolment_id) REFERENCES enrolments(id) ON DELETE CASCADE
    );

    -- 8. Compliance Alerts
    CREATE TABLE IF NOT EXISTS compliance_alerts (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      programme_id TEXT,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
      created_at TEXT NOT NULL,
      evidence TEXT,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- 9. Conflict Cases
    CREATE TABLE IF NOT EXISTS conflict_cases (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      apaar_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      classification TEXT NOT NULL, -- 'OVERLAPPING_ENROLMENT', 'TRANSFER_PENDING', 'LEGITIMATE_HISTORICAL', 'REQUIRES_INVESTIGATION', 'RESOLVED'
      status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED'
      case_notes TEXT,
      resolution_details TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- 10. Conflict Case Enrolment Links
    CREATE TABLE IF NOT EXISTS conflict_case_enrolments (
      case_id TEXT NOT NULL,
      enrolment_id TEXT NOT NULL,
      PRIMARY KEY (case_id, enrolment_id),
      FOREIGN KEY (case_id) REFERENCES conflict_cases(id) ON DELETE CASCADE,
      FOREIGN KEY (enrolment_id) REFERENCES enrolments(id) ON DELETE CASCADE
    );

    -- 11. Anomaly Scores
    CREATE TABLE IF NOT EXISTS anomaly_scores (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      academic_session TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      detection_methods TEXT NOT NULL,
      contributing_factors TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      last_evaluated_at TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- 12. Correction Requests
    CREATE TABLE IF NOT EXISTS correction_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      enrolment_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      current_value TEXT NOT NULL,
      proposed_value TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence_url TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
      reviewer_id TEXT,
      reviewer_comments TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (enrolment_id) REFERENCES enrolments(id) ON DELETE CASCADE
    );

    -- 13. Issued Credentials
    CREATE TABLE IF NOT EXISTS issued_credentials (
      id TEXT PRIMARY KEY,
      credential_reference TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      enrolment_id TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      disclosed_fields TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
      digital_signature TEXT NOT NULL,
      qr_data TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      revoked_at TEXT,
      revocation_reason TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (enrolment_id) REFERENCES enrolments(id) ON DELETE CASCADE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- 14. Consent Requests
    CREATE TABLE IF NOT EXISTS consent_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_type TEXT NOT NULL,
      purpose TEXT NOT NULL,
      requested_fields TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED'
      requested_at TEXT NOT NULL,
      decided_at TEXT,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- 15. Data Access Logs
    CREATE TABLE IF NOT EXISTS data_access_logs (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      accessed_by TEXT NOT NULL,
      purpose TEXT NOT NULL,
      fields_accessed TEXT NOT NULL,
      access_type TEXT NOT NULL, -- 'REGULATORY_LAWFUL', 'CONSENT_BASED', 'CREDENTIAL_VERIFICATION'
      timestamp TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- 16. Upload Batches
    CREATE TABLE IF NOT EXISTS upload_batches (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      valid_rows INTEGER NOT NULL,
      invalid_rows INTEGER NOT NULL,
      duplicate_rows INTEGER NOT NULL,
      status TEXT NOT NULL,
      column_mappings TEXT,
      validation_report TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- 17. Simulation Scenarios
    CREATE TABLE IF NOT EXISTS simulation_scenarios (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      academic_session TEXT NOT NULL,
      programme_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL,
      current_admissions INTEGER NOT NULL,
      proposed_admissions INTEGER NOT NULL,
      proposed_by_category TEXT NOT NULL,
      approved_capacity INTEGER NOT NULL,
      projected_utilization REAL NOT NULL,
      is_compliant INTEGER NOT NULL,
      excess_seats INTEGER NOT NULL,
      warnings TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
      FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
    );

    -- 18. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_enrolments_student ON enrolments(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrolments_institution ON enrolments(institution_id);
    CREATE INDEX IF NOT EXISTS idx_enrolments_programme ON enrolments(programme_id);
    CREATE INDEX IF NOT EXISTS idx_enrolments_session ON enrolments(academic_session);
    CREATE INDEX IF NOT EXISTS idx_students_apaar ON students(apaar_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_institution ON compliance_alerts(institution_id);
    CREATE INDEX IF NOT EXISTS idx_conflicts_student ON conflict_cases(student_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_ref ON issued_credentials(credential_reference);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);
}

export function resetDatabase() {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS simulation_scenarios;
    DROP TABLE IF EXISTS upload_batches;
    DROP TABLE IF EXISTS data_access_logs;
    DROP TABLE IF EXISTS consent_requests;
    DROP TABLE IF EXISTS issued_credentials;
    DROP TABLE IF EXISTS correction_requests;
    DROP TABLE IF EXISTS anomaly_scores;
    DROP TABLE IF EXISTS conflict_case_enrolments;
    DROP TABLE IF EXISTS conflict_cases;
    DROP TABLE IF EXISTS compliance_alerts;
    DROP TABLE IF EXISTS verification_records;
    DROP TABLE IF EXISTS enrolments;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS intake_category_rules;
    DROP TABLE IF EXISTS programmes;
    DROP TABLE IF EXISTS institutions;
    DROP TABLE IF EXISTS users;
    PRAGMA foreign_keys = ON;
  `);
  initializeDatabase();
}
