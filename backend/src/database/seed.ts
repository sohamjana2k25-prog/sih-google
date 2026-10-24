import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from './db.js';
import { resetDatabase } from './schema.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';
import { AnomalyEngine } from '../anomalies/anomalyEngine.js';
import { CredentialManager } from '../credentials/credentialManager.js';

export async function seedDatabase() {
  console.log('[SEED] Resetting database schema...');
  resetDatabase();

  const passwordHashAdmin = bcrypt.hashSync('admin123', 8);
  const passwordHashStudent = bcrypt.hashSync('student123', 8);

  console.log('[SEED] Seeding 12 AICTE Institutions...');
  const institutions = [
    {
      id: 'inst-kolkata-01',
      aicte_id: '1-3329104821',
      name: 'Tech Institute of Technology, Kolkata',
      state: 'West Bengal',
      district: 'Kolkata',
      address: 'EM Bypass, Sector V, Salt Lake, Kolkata, West Bengal 700091',
      type: 'Autonomous',
      latitude: 22.5726,
      longitude: 88.3639,
      status: 'ACTIVE',
    },
    {
      id: 'inst-bengaluru-02',
      aicte_id: '1-4491028372',
      name: 'Apex National Engineering College, Bengaluru',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      address: 'Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037',
      type: 'Private',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'ACTIVE',
    },
    {
      id: 'inst-mumbai-03',
      aicte_id: '1-2819038291',
      name: 'Mumbai Polytechnic & Technology Institute',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      address: 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051',
      type: 'Government',
      latitude: 19.0760,
      longitude: 72.8777,
      status: 'ACTIVE',
    },
    {
      id: 'inst-delhi-04',
      aicte_id: '1-1092837465',
      name: 'Delhi Institute of Advanced Engineering',
      state: 'Delhi',
      district: 'New Delhi',
      address: 'Institutional Area, Okhla Phase III, New Delhi 110020',
      type: 'Autonomous',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'ACTIVE',
    },
    {
      id: 'inst-chennai-05',
      aicte_id: '1-5582910384',
      name: 'Chennai Institute of Higher Technology',
      state: 'Tamil Nadu',
      district: 'Chennai',
      address: 'OMR IT Corridor, Thoraipakkam, Chennai, Tamil Nadu 600097',
      type: 'Deemed',
      latitude: 13.0827,
      longitude: 80.2707,
      status: 'ACTIVE',
    },
    {
      id: 'inst-hyderabad-06',
      aicte_id: '1-6671829304',
      name: 'Hyderabad University of Engineering & Tech',
      state: 'Telangana',
      district: 'Hyderabad',
      address: 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
      type: 'Autonomous',
      latitude: 17.3850,
      longitude: 78.4867,
      status: 'ACTIVE',
    },
    {
      id: 'inst-lucknow-07',
      aicte_id: '1-7782910492',
      name: 'Lucknow National Engineering Institute',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      address: 'Gomti Nagar Extension, Lucknow, Uttar Pradesh 226010',
      type: 'Government',
      latitude: 26.8467,
      longitude: 80.9462,
      status: 'ACTIVE',
    },
    {
      id: 'inst-ahmedabad-08',
      aicte_id: '1-8891029384',
      name: 'Ahmedabad College of Engineering & Research',
      state: 'Gujarat',
      district: 'Ahmedabad',
      address: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054',
      type: 'Private',
      latitude: 23.0225,
      longitude: 72.5714,
      status: 'ACTIVE',
    },
    {
      id: 'inst-pune-09',
      aicte_id: '1-9901827364',
      name: 'Pune National Institute of Applied Technology',
      state: 'Maharashtra',
      district: 'Pune',
      address: 'Hinjawadi Phase 1, Pune, Maharashtra 411057',
      type: 'Autonomous',
      latitude: 18.5204,
      longitude: 73.8567,
      status: 'ACTIVE',
    },
    {
      id: 'inst-kolkata-10',
      aicte_id: '1-1122334455',
      name: 'Kolkata Institute of Science & Technology',
      state: 'West Bengal',
      district: 'North 24 Parganas',
      address: 'New Town Action Area I, Rajarhat, Kolkata, West Bengal 700156',
      type: 'Private',
      latitude: 22.5850,
      longitude: 88.4700,
      status: 'ACTIVE',
    },
    {
      id: 'inst-bengaluru-11',
      aicte_id: '1-2233445566',
      name: 'Bengaluru Institute of Information Science',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      address: 'Electronic City Phase 1, Bengaluru, Karnataka 560100',
      type: 'Deemed',
      latitude: 12.8450,
      longitude: 77.6600,
      status: 'ACTIVE',
    },
    {
      id: 'inst-durgapur-12',
      aicte_id: '1-3344556677',
      name: 'Durgapur College of Engineering',
      state: 'West Bengal',
      district: 'Paschim Bardhaman',
      address: 'Mahatma Gandhi Avenue, Durgapur, West Bengal 713209',
      type: 'Government',
      latitude: 23.5204,
      longitude: 87.3119,
      status: 'ACTIVE',
    },
  ];

  for (const inst of institutions) {
    db.prepare(`
      INSERT INTO institutions (id, aicte_id, name, state, district, address, type, latitude, longitude, status, risk_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      inst.id,
      inst.aicte_id,
      inst.name,
      inst.state,
      inst.district,
      inst.address,
      inst.type,
      inst.latitude,
      inst.longitude,
      inst.status,
      new Date().toISOString()
    );
  }

  console.log('[SEED] Seeding Programmes and Sanctioned Intake...');
  const progTemplates = [
    { name: 'Computer Science and Engineering', code: 'CSE', degree: 'B.Tech', duration: 4, intake: 120, nri: 15, super: 12 },
    { name: 'Electronics and Communication Engineering', code: 'ECE', degree: 'B.Tech', duration: 4, intake: 90, nri: 10, super: 9 },
    { name: 'Mechanical Engineering', code: 'ME', degree: 'B.Tech', duration: 4, intake: 60, nri: 5, super: 6 },
    { name: 'Civil Engineering', code: 'CE', degree: 'B.Tech', duration: 4, intake: 60, nri: 5, super: 6 },
    { name: 'Electrical Engineering', code: 'EE', degree: 'B.Tech', duration: 4, intake: 60, nri: 5, super: 6 },
    { name: 'Information Technology', code: 'IT', degree: 'B.Tech', duration: 4, intake: 60, nri: 5, super: 6 },
    { name: 'Artificial Intelligence and Machine Learning', code: 'AIML', degree: 'B.Tech', duration: 4, intake: 60, nri: 10, super: 6 },
  ];

  const programmeMap: Record<string, Record<string, string>> = {}; // [instId][progCode] -> progId

  for (const inst of institutions) {
    programmeMap[inst.id] = {};
    for (const t of progTemplates) {
      const progId = `prog-${inst.id}-${t.code}`;
      programmeMap[inst.id][t.code] = progId;

      db.prepare(`
        INSERT INTO programmes (id, institution_id, name, code, degree, duration_years, approved_intake, nri_quota, supernumerary_quota, academic_session, effective_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2024-2025', '2024-06-01')
      `).run(
        progId,
        inst.id,
        t.name,
        t.code,
        t.degree,
        t.duration,
        t.intake,
        t.nri,
        t.super
      );

      // Category rules
      const cats = [
        { cat: 'GENERAL', max: Math.round(t.intake * 0.40) },
        { cat: 'OBC', max: Math.round(t.intake * 0.27) },
        { cat: 'SC', max: Math.round(t.intake * 0.15) },
        { cat: 'ST', max: Math.round(t.intake * 0.08) },
        { cat: 'EWS', max: Math.round(t.intake * 0.10) },
        { cat: 'NRI', max: t.nri },
        { cat: 'SUPERNUMERARY_PMSSS', max: Math.round(t.super * 0.5) },
        { cat: 'SUPERNUMERARY_TFW', max: Math.round(t.super * 0.5) },
      ];

      for (const c of cats) {
        db.prepare(`
          INSERT INTO intake_category_rules (id, programme_id, category, max_seats, academic_session)
          VALUES (?, ?, ?, ?, '2024-2025')
        `).run(crypto.randomUUID(), progId, c.cat, c.max);
      }
    }
  }

  console.log('[SEED] Seeding Core Demo Users...');
  // AICTE Admin
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, created_at)
    VALUES ('user-aicte-admin', 'aicte.admin@aicte-india.org', ?, 'AICTE_ADMIN', 'Dr. Ramesh Chandra (AICTE Director)', ?)
  `).run(passwordHashAdmin, new Date().toISOString());

  // College A Admin (Tech Institute of Technology, Kolkata)
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, institution_id, created_at)
    VALUES ('user-college-a', 'admin@tit-kolkata.edu.in', ?, 'INSTITUTION_ADMIN', 'Prof. Subhasis Banerjee (Registrar, TIT Kolkata)', 'inst-kolkata-01', ?)
  `).run(passwordHashAdmin, new Date().toISOString());

  // College B Admin (Apex National Engineering College, Bengaluru)
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, institution_id, created_at)
    VALUES ('user-college-b', 'admin@apex-bengaluru.edu.in', ?, 'INSTITUTION_ADMIN', 'Dr. Radhakrishnan Nair (Dean Admissions, Apex)', 'inst-bengaluru-02', ?)
  `).run(passwordHashAdmin, new Date().toISOString());

  // Named Demo Students
  const rahulId = 'student-rahul-sharma';
  const priyaId = 'student-priya-das';
  const arjunId = 'student-arjun-mehta';
  const snehaId = 'student-sneha-roy';

  db.prepare(`
    INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
    VALUES (?, '9821-4432-8812', 'Rahul Sharma', '2004-04-12', 'MALE', 'rahul.sharma@student.apaar.gov.in', '9812345678', 'hash-aadhaar-rahul', ?)
  `).run(rahulId, new Date().toISOString());

  db.prepare(`
    INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
    VALUES (?, '9821-7744-1029', 'Priya Das', '2004-09-24', 'FEMALE', 'priya.das@student.apaar.gov.in', '9823456789', 'hash-aadhaar-priya', ?)
  `).run(priyaId, new Date().toISOString());

  db.prepare(`
    INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
    VALUES (?, '9821-5511-3948', 'Arjun Mehta', '2003-12-05', 'MALE', 'arjun.mehta@student.apaar.gov.in', '9834567890', 'hash-aadhaar-arjun', ?)
  `).run(arjunId, new Date().toISOString());

  db.prepare(`
    INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
    VALUES (?, '9821-6622-4820', 'Sneha Roy', '2004-02-18', 'FEMALE', 'sneha.roy@student.apaar.gov.in', '9845678901', 'hash-aadhaar-sneha', ?)
  `).run(snehaId, new Date().toISOString());

  // Student Users
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, student_id, created_at)
    VALUES ('user-rahul', 'rahul.sharma@student.apaar.gov.in', ?, 'STUDENT', 'Rahul Sharma', ?, ?)
  `).run(passwordHashStudent, rahulId, new Date().toISOString());

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, student_id, created_at)
    VALUES ('user-priya', 'priya.das@student.apaar.gov.in', ?, 'STUDENT', 'Priya Das', ?, ?)
  `).run(passwordHashStudent, priyaId, new Date().toISOString());

  console.log('[SEED] Generating 1,000+ realistic synthetic students and enrolments...');
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Rohan', 'Dhruv', 'Kabir', 'Ananya', 'Diya', 'Isha', 'Aadhya', 'Saanvi', 'Pooja', 'Tanvi', 'Kavya', 'Rhea', 'Meera', 'Riya', 'Avani', 'Nisha', 'Shreya', 'Sneha', 'Ritika', 'Debasree', 'Sourav', 'Bikram', 'Subhadip', 'Debabrata', 'Poulami', 'Tathagata', 'Swarup', 'Debjyoti'];
  const lastNames = ['Mukherjee', 'Chatterjee', 'Banerjee', 'Ghosh', 'Bose', 'Dutta', 'Sengupta', 'Roy', 'Chakraborty', 'Das', 'Sen', 'Mitra', 'Patel', 'Shah', 'Mehta', 'Deshmukh', 'Kulkarni', 'Joshi', 'Patil', 'Iyer', 'Nair', 'Menon', 'Rao', 'Reddy', 'Chowdhury', 'Kapoor', 'Verma', 'Sharma', 'Gupta', 'Singh', 'Agarwal', 'Bhat', 'Hegde', 'Gowda'];
  const categories = ['GENERAL', 'GENERAL', 'OBC', 'OBC', 'SC', 'ST', 'EWS', 'NRI'];

  // Seed College A (Tech Institute of Technology, Kolkata) with 500 records:
  // - CSE: 145 regular admissions (exceeds approved 120 intake -> Triggers Intake Violation)
  // - 480 verified, 20 flagged review
  const collegeA_Id = 'inst-kolkata-01';
  let totalStudentCount = 4; // Already seeded 4 named students

  // Insert 500 students into College A
  const collegeAStudents: any[] = [];
  for (let i = 1; i <= 500; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fn} ${ln}`;
    const sId = `student-kolkata-${i}`;

    // Deterministic rule: out of 500, exactly 20 flagged records
    let isFlagged = i <= 20;
    let apaarEnding = isFlagged ? (i % 2 === 0 ? '99' : '00') : String(1000 + i).slice(-4);
    let apaar = `9822-${String(1000 + (i % 8999))}-${apaarEnding}`;

    let progCode = 'CSE';
    if (i <= 145) progCode = 'CSE'; // 145 CSE regular admissions -> violates 120 intake!
    else if (i <= 235) progCode = 'ECE'; // 90 ECE
    else if (i <= 295) progCode = 'ME';  // 60 ME
    else if (i <= 355) progCode = 'CE';  // 60 CE
    else if (i <= 415) progCode = 'EE';  // 60 EE
    else if (i <= 465) progCode = 'IT';  // 50 IT
    else progCode = 'AIML';             // 35 AIML

    const cat = i <= 145 ? 'GENERAL' : categories[i % categories.length];
    const verStatus = isFlagged ? (apaarEnding === '99' ? 'FLAGGED_MISMATCH' : 'UNAVAILABLE') : 'VERIFIED';

    collegeAStudents.push({
      id: sId,
      apaarId: apaar,
      name,
      dob: `2004-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      gender: i % 3 === 0 ? 'FEMALE' : 'MALE',
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@student.tit.edu.in`,
      phone: `98${String(10000000 + i)}`,
      progCode,
      category: cat,
      verStatus,
      roll: `TIT-2024-${progCode}-${String(i).padStart(3, '0')}`,
    });
  }

  // Insert College A students
  for (const s of collegeAStudents) {
    db.prepare(`
      INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.id,
      s.apaarId,
      s.name,
      s.dob,
      s.gender,
      s.email,
      s.phone,
      crypto.createHash('sha256').update(s.apaarId).digest('hex'),
      new Date().toISOString()
    );

    const progId = programmeMap[collegeA_Id][s.progCode];
    const enrId = `enr-${s.id}`;

    db.prepare(`
      INSERT INTO enrolments (
        id, student_id, institution_id, programme_id, roll_number, academic_session,
        admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, '2024-2025', '2024-08-01', ?, 'ACTIVE', ?, ?, ?, ?)
    `).run(
      enrId,
      s.id,
      collegeA_Id,
      progId,
      s.roll,
      s.category,
      s.verStatus,
      s.verStatus === 'VERIFIED'
        ? 'Verified via MockApaarVerificationProvider against ABC Registry'
        : s.verStatus === 'FLAGGED_MISMATCH'
        ? 'Flagged: Candidate name spelling does not match central APAAR ledger'
        : 'Unavailable: Record not activated in Central APAAR repository',
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Verification record
    db.prepare(`
      INSERT INTO verification_records (id, enrolment_id, student_id, apaar_id, provider, result, verified_at, metadata)
      VALUES (?, ?, ?, ?, 'MockApaarVerificationProvider', ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      enrId,
      s.id,
      s.apaarId,
      s.verStatus,
      new Date().toISOString(),
      JSON.stringify({ simulated: true, confidence: s.verStatus === 'VERIFIED' ? 0.99 : 0.4 })
    );

    totalStudentCount++;
  }

  // Seed remaining 500+ students across institutions 2 to 12
  console.log('[SEED] Distributing remaining 500+ students across other institutions...');
  let otherCount = 0;
  for (let instIdx = 1; instIdx < institutions.length; instIdx++) {
    const inst = institutions[instIdx];
    const studentsForInst = 55; // 55 * 11 = 605 students

    for (let k = 1; k <= studentsForInst; k++) {
      otherCount++;
      const fn = firstNames[(otherCount + k) % firstNames.length];
      const ln = lastNames[(otherCount + k) % lastNames.length];
      const sId = `student-other-${instIdx}-${k}`;
      const apaar = `9823-${String(1000 + instIdx * 100 + k)}-${String(1000 + otherCount).slice(-4)}`;
      const progCode = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'AIML'][k % 6];
      const cat = categories[k % categories.length];

      db.prepare(`
        INSERT INTO students (id, apaar_id, full_name, dob, gender, email, phone, aadhaar_hash, created_at)
        VALUES (?, ?, ?, '2004-06-15', ?, ?, ?, ?, ?)
      `).run(
        sId,
        apaar,
        `${fn} ${ln}`,
        k % 2 === 0 ? 'FEMALE' : 'MALE',
        `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu.in`,
        `97${String(10000000 + otherCount)}`,
        crypto.createHash('sha256').update(apaar).digest('hex'),
        new Date().toISOString()
      );

      const progId = programmeMap[inst.id][progCode];
      const enrId = `enr-${sId}`;

      db.prepare(`
        INSERT INTO enrolments (
          id, student_id, institution_id, programme_id, roll_number, academic_session,
          admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, '2024-2025', '2024-08-01', ?, 'ACTIVE', 'VERIFIED', 'APAAR Identity Validated', ?, ?)
      `).run(
        enrId,
        sId,
        inst.id,
        progId,
        `${inst.state.slice(0, 2).toUpperCase()}-2024-${k}`,
        cat,
        new Date().toISOString(),
        new Date().toISOString()
      );

      totalStudentCount++;
    }
  }

  console.log(`[SEED] Total ${totalStudentCount} students successfully seeded.`);

  console.log('[SEED] Setting up Special Demonstration Scenarios...');
  // Scenario A: Rahul Sharma Overlapping Enrolment Conflict
  // Rahul is enrolled in College A (Tech Institute of Technology) AND College B (Apex Bengaluru)
  const rahulProgA = programmeMap['inst-kolkata-01']['CSE'];
  const rahulProgB = programmeMap['inst-bengaluru-02']['CSE'];

  const enrRahulA = 'enr-rahul-kolkata';
  const enrRahulB = 'enr-rahul-bengaluru';

  db.prepare(`
    INSERT INTO enrolments (id, student_id, institution_id, programme_id, roll_number, academic_session, admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at)
    VALUES (?, ?, 'inst-kolkata-01', ?, 'TIT-2024-CSE-099', '2024-2025', '2024-07-15', 'GENERAL', 'ACTIVE', 'VERIFIED', 'APAAR Verified', ?, ?)
  `).run(enrRahulA, rahulId, rahulProgA, new Date().toISOString(), new Date().toISOString());

  db.prepare(`
    INSERT INTO enrolments (id, student_id, institution_id, programme_id, roll_number, academic_session, admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at)
    VALUES (?, ?, 'inst-bengaluru-02', ?, 'APEX-2024-CSE-045', '2024-2025', '2024-08-20', 'GENERAL', 'ACTIVE', 'VERIFIED', 'APAAR Verified', ?, ?)
  `).run(enrRahulB, rahulId, rahulProgB, new Date().toISOString(), new Date().toISOString());

  // Pending Correction Request for Rahul Sharma
  db.prepare(`
    INSERT INTO correction_requests (id, student_id, enrolment_id, field_name, current_value, proposed_value, reason, evidence_url, status, created_at)
    VALUES ('corr-rahul-01', ?, ?, 'enrolment_status', 'ACTIVE', 'TRANSFERRED', 'Admitted to Apex National Engineering College Bengaluru via Centralized Counselling. Requesting Tech Institute of Technology Kolkata to update status to TRANSFERRED.', 'doc_transfer_certificate_tc8912.pdf', 'SUBMITTED', ?)
  `).run(rahulId, enrRahulA, new Date().toISOString());

  // Scenario B: Priya Das Enrolment & Verifiable Credential
  const priyaProgA = programmeMap['inst-kolkata-01']['CSE'];
  const enrPriyaA = 'enr-priya-kolkata';

  db.prepare(`
    INSERT INTO enrolments (id, student_id, institution_id, programme_id, roll_number, academic_session, admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at)
    VALUES (?, ?, 'inst-kolkata-01', ?, 'TIT-2024-CSE-012', '2024-2025', '2024-07-20', 'GENERAL', 'ACTIVE', 'VERIFIED', 'APAAR Verified', ?, ?)
  `).run(enrPriyaA, priyaId, priyaProgA, new Date().toISOString(), new Date().toISOString());

  // Generate Credential for Priya
  CredentialManager.issueCredential(priyaId, enrPriyaA);

  // Priya Consent Request from TCS
  db.prepare(`
    INSERT INTO consent_requests (id, student_id, requester_name, requester_type, purpose, requested_fields, status, requested_at, expires_at)
    VALUES ('consent-priya-01', ?, 'Tata Consultancy Services (HR Campus Recruitment)', 'EMPLOYER', 'Pre-offer academic enrolment & APAAR identity verification', '["Full Name", "Institution Name", "Programme", "Current Session", "Enrolment Status"]', 'PENDING', ?, ?)
  `).run(
    priyaId,
    new Date().toISOString(),
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  );

  // Scenario C: Arjun Mehta & Sneha Roy enrolments
  const arjunProg = programmeMap['inst-delhi-04']['ECE'];
  db.prepare(`
    INSERT INTO enrolments (id, student_id, institution_id, programme_id, roll_number, academic_session, admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at)
    VALUES ('enr-arjun-delhi', ?, 'inst-delhi-04', ?, 'DIAE-2024-ECE-019', '2024-2025', '2024-08-01', 'GENERAL', 'ACTIVE', 'VERIFIED', 'APAAR Verified', ?, ?)
  `).run(arjunId, arjunProg, new Date().toISOString(), new Date().toISOString());

  const snehaProg = programmeMap['inst-chennai-05']['IT'];
  db.prepare(`
    INSERT INTO enrolments (id, student_id, institution_id, programme_id, roll_number, academic_session, admission_date, admission_category, enrolment_status, verification_status, verification_notes, created_at, updated_at)
    VALUES ('enr-sneha-chennai', ?, 'inst-chennai-05', ?, 'CIHT-2024-IT-008', '2024-2025', '2024-08-05', 'GENERAL', 'ACTIVE', 'VERIFIED', 'APAAR Verified', ?, ?)
  `).run(snehaId, snehaProg, new Date().toISOString(), new Date().toISOString());

  // Sample Upload Batch record for College A
  db.prepare(`
    INSERT INTO upload_batches (id, institution_id, filename, total_rows, valid_rows, invalid_rows, duplicate_rows, status, column_mappings, validation_report, created_at)
    VALUES ('batch-sample-kolkata', 'inst-kolkata-01', 'TIT_Admissions_Batch_2024.csv', 500, 480, 20, 0, 'CONFIRMED', '{"CandidateName":"full_name","Academic_ID":"apaar_id","Branch":"programmeCode","Category":"admissionCategory"}', '{"valid":480,"invalid":20,"summary":"Completed with 20 flagged records"}', ?)
  `).run(new Date().toISOString());

  console.log('[SEED] Running Automated Conflict Detection...');
  const conflictsCreated = ConflictDetector.runConflictScan();
  console.log(`[SEED] Created ${conflictsCreated} cross-institution conflict case(s).`);

  console.log('[SEED] Evaluating Compliance for all institutions...');
  for (const inst of institutions) {
    ComplianceEngine.evaluateInstitutionCompliance(inst.id, '2024-2025');
  }

  console.log('[SEED] Running Anomaly Detection and Risk Scoring Engine...');
  AnomalyEngine.evaluateAllInstitutions('2024-2025');

  console.log('[SEED] Database seeding complete! All 13 core & innovative feature scenarios seeded.');
}

// Only execute if called as standalone script via CLI
const isDirectCli = process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));
if (isDirectCli) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}

