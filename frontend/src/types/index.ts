export type UserRole = 'AICTE_ADMIN' | 'INSTITUTION_ADMIN' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  institutionId?: string;
  studentId?: string;
  institution?: Institution;
  student?: Student;
}

export interface Institution {
  id: string;
  aicte_id: string;
  name: string;
  state: string;
  district: string;
  address: string;
  type: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED';
  risk_score: number;
  total_approved_intake?: number;
  total_active_enrolment?: number;
  programmes_count?: number;
  active_alerts_count?: number;
}

export interface Programme {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  degree: string;
  duration_years: number;
  approved_intake: number;
  nri_quota: number;
  supernumerary_quota: number;
  academic_session: string;
  effective_date: string;
  current_admissions?: number;
}

export interface Student {
  id: string;
  apaar_id: string;
  apaar_id_masked: string;
  full_name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  created_at: string;
  enrolment_id?: string;
  institution_id?: string;
  institution_name?: string;
  programme_id?: string;
  programme_name?: string;
  programme_code?: string;
  roll_number?: string;
  admission_category?: string;
  enrolment_status?: 'ACTIVE' | 'TRANSFERRED' | 'COMPLETED' | 'WITHDRAWN' | 'SUSPENDED';
  verification_status?: 'VERIFIED' | 'PENDING' | 'FLAGGED_MISMATCH' | 'UNAVAILABLE';
  verification_notes?: string;
}

export interface ComplianceAlert {
  id: string;
  institution_id: string;
  institution_name?: string;
  programme_id?: string;
  programme_name?: string;
  programme_code?: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  evidence?: string;
}

export interface ConflictCase {
  id: string;
  student_id: string;
  student_name: string;
  apaar_id: string;
  apaar_id_masked: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  classification: 'OVERLAPPING_ENROLMENT' | 'TRANSFER_PENDING' | 'LEGITIMATE_HISTORICAL' | 'REQUIRES_INVESTIGATION' | 'RESOLVED';
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED';
  case_notes: string;
  resolution_details?: string;
  created_at: string;
  updated_at: string;
  institutions_involved_count?: number;
}

export interface IssuedCredential {
  id: string;
  credential_reference: string;
  student_id: string;
  enrolment_id: string;
  institution_id: string;
  institution_name?: string;
  programme_name?: string;
  programme_code?: string;
  roll_number?: string;
  academic_session?: string;
  enrolment_status?: string;
  disclosed_fields: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  digital_signature: string;
  qr_data: string;
  expires_at: string;
  created_at: string;
  revoked_at?: string;
  revocation_reason?: string;
}

export interface CorrectionRequest {
  id: string;
  student_id: string;
  student_name?: string;
  apaar_id_masked?: string;
  institution_name?: string;
  institution_id?: string;
  programme_name?: string;
  roll_number?: string;
  enrolment_id: string;
  field_name: string;
  current_value: string;
  proposed_value: string;
  reason: string;
  evidence_url?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewer_comments?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ConsentRequest {
  id: string;
  student_id: string;
  requester_name: string;
  requester_type: 'EMPLOYER' | 'VERIFICATION_AGENCY' | 'ACADEMIC_INSTITUTION' | 'GOVERNMENT';
  purpose: string;
  requested_fields: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  requested_at: string;
  decided_at?: string;
  expires_at: string;
}

export interface DataAccessLog {
  id: string;
  student_id: string;
  accessed_by: string;
  purpose: string;
  fields_accessed: string;
  access_type: 'REGULATORY_LAWFUL' | 'CONSENT_BASED' | 'CREDENTIAL_VERIFICATION';
  timestamp: string;
}
