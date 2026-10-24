# APAAR-Sentinel

> **Intelligent Student Identity, Enrolment Verification and Regulatory Compliance Platform**  
> *Developed for the Smart India Hackathon (SIH) — AICTE Digital Infrastructure & Institutional Regulatory Integrity*

---

## 1. Executive Summary & Problem Context

In India's higher technical education ecosystem, regulatory bodies such as the **All India Council for Technical Education (AICTE)** oversee thousands of engineering and polytechnic institutions. Key regulatory bottlenecks include:
- Unsanctioned admissions exceeding AICTE approved intake quotas.
- Phantom and duplicate enrolments across multiple institutions (students active simultaneously at two colleges without formal transfer clearance).
- Student record discrepancies, delays in identity verification, and manual spreadsheet uploads with divergent column formats.
- Inability to evaluate prospective admission batches prior to formal submission.

**APAAR-Sentinel** solves these challenges by uniting the **Automated Permanent Academic Account Registry (APAAR ID)** with a real-time regulatory compliance engine, dynamic cross-institution conflict network, predictive admission simulator, explainable machine-learning anomaly detector, and verifiable digital enrolment passports.

---

## 2. Platform Architecture & Features Matrix

The application satisfies all **13 required capabilities** (5 Core + 8 SIH Innovative Differentiators):

### A. Core Features (Must Have)
1. **APAAR-Based Student Registration & Verification**:  
   Individual manual registration and bulk processing with deterministic simulation adapter (`MockApaarVerificationProvider`). Automatically validates 12-digit format, demographic matching, and assigns academic session.
2. **Automated Admission & Intake Verification**:  
   Monitors AICTE-approved capacity against reported active admissions across Regular, Category (OBC, SC, ST, EWS), NRI, and Supernumerary (PMSSS, TFW) quotas. Automatically generates alerts when admissions exceed approved ceilings.
3. **Cross-Institution Duplicate Detection**:  
   Detects duplicate APAAR identities across multiple institutions, compares admission dates, withdrawal dates, and flags overlapping active enrolments versus legitimate transfers.
4. **Centralized AICTE & College Dashboards**:  
   High-performance dashboards with national KPIs, state-wise breakdowns, capacity utilization bars, and role-based data isolation.
5. **Student Record Correction & Verification Portal**:  
   Self-service discrepancy reporting portal where students report inaccurate enrolment statuses or demographic errors with supporting evidence, routed to institution administrators for audit-trailed review.

### B. Innovative Differentiators
1. **AI-Powered Admission Fraud & Anomaly Detection**:  
   Hybrid scoring combining rule-based heuristics, temporal burst metrics (late batch ingestion), and machine-learning feature vectors to produce transparent **0–100 Risk Scores** with explainable drivers.
2. **National Student Enrolment Conflict Graph**:  
   Interactive visual network connecting Students, Institutions, and Programmes with pan, zoom, edge-type differentiation, and one-click regulatory case resolution.
3. **Predictive Admission Compliance Simulator**:  
   Allows college administrators to test hypothetical admission batches by category before formal submission, evaluating projected utilization without altering committed database records.
4. **AICTE Regulatory AI Copilot**:  
   Allowlisted analytical tool layer translating natural language regulatory queries into deterministic database operations with zero hallucination.
5. **Smart Digital Enrolment Passport**:  
   Cryptographic HMAC-SHA256 verifiable credentials with dynamic QR codes, third-party verification endpoint, and instant revocation mechanisms.
6. **Student Data Privacy & Consent Dashboard**:  
   Granular consent management allowing students to review, approve, or revoke third-party verification requests from employers or background agencies, backed by a personal access audit log.
7. **AI-Powered Data Cleaning & Smart Upload**:  
   Multi-step bulk upload wizard that recognizes divergent spreadsheet headers (e.g., `CandidateName` → `full_name`, `Academic_ID` → `apaar_id`), validates row formats, and reports specific row errors before database persistence.
8. **Geographical Compliance Risk Heatmap**:  
   Interactive Leaflet map of India featuring state filtering, district analytics, and risk-coded institutional markers.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Strictly zero emojis in UI), Recharts, React-Leaflet, QRCode.
- **Backend**: Node.js 22, Express, TypeScript, Better-SQLite3 (transactional, relational foreign keys, WAL mode), Multer, CSV-Parse, XLSX, PDFKit (real downloadable binary PDF certificates).
- **Security**: Cryptographic HMAC-SHA256 digital seals, JWT authentication, bcrypt password hashing, sensitive APAAR ID masking.

---

## 4. Quick Start & Setup Instructions

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Step 1: Install Dependencies
```bash
# In the backend directory
cd backend
npm install

# In the frontend directory
cd ../frontend
npm install
```

### Step 2: Seed the Database
```bash
cd backend
npm run seed
```
*Seeds 12 institutions across India, 1,109 synthetic students, sanctioned intake quotas, and all test scenarios in seconds.*

### Step 3: Run Backend & Frontend Servers
In Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

Open your browser to: **`http://localhost:3000`**

---

## 5. Seeded Demonstration Accounts

The platform includes **one-click login buttons** on both the Login Screen and the top navigation bar:

| Role | Name | Email | Password | Primary Demo Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **AICTE Admin** | Dr. Ramesh Chandra | `aicte.admin@aicte-india.org` | `admin123` | National audit, Anomaly Intelligence, Conflict Network, AI Copilot, Heatmap |
| **College A Admin** | Prof. Subhasis Banerjee | `admin@tit-kolkata.edu.in` | `admin123` | Tech Institute of Technology Kolkata (145/120 CSE Intake Excess Alert, Bulk Upload) |
| **College B Admin** | Dr. Radhakrishnan Nair | `admin@apex-bengaluru.edu.in` | `admin123` | Apex National Engineering College Bengaluru (Transfer Conflict Resolution) |
| **Student** | Rahul Sharma | `rahul.sharma@student.apaar.gov.in` | `student123` | Dual-college active enrolment conflict, Transfer correction request |
| **Student** | Priya Das | `priya.das@student.apaar.gov.in` | `student123` | Smart Digital Passport, QR verification, Third-party employer consent |

---

## 6. Guided 10-Step SIH Technical Demonstration

1. **AICTE National Overview**:  
   Login as AICTE Admin. Observe 12 institutions, 1,109 students, state-wise capacity charts, and the high-visibility **Intake Capacity Excess Alert** for College A.
2. **Inspect Institutional Excess**:  
   Navigate to **Admission Compliance**. See that Tech Institute of Technology Kolkata is sanctioned for 120 CSE regular seats but reported 145 admissions (+25 excess seats, 120.8% utilization).
3. **Conflict Network (Rahul Sharma Case)**:  
   Navigate to **Conflict Network**. Select Rahul Sharma. The graph visualizes active simultaneous links to both College A (Kolkata) and College B (Bengaluru).
4. **AICTE Regulatory AI Copilot**:  
   Navigate to **AI Regulatory Copilot**. Click the prompt *"Show colleges in West Bengal exceeding approved CSE intake"*. Watch the system route to `getIntakeViolations()` and return live database records with zero hallucination.
5. **Geographical Heatmap**:  
   Navigate to **Geographic Heatmap**. Filter by *West Bengal* or click the Kolkata marker to inspect college risk scores and download signed PDF reports.
6. **Smart Bulk Upload Wizard**:  
   Switch to **College A Admin** (`admin@tit-kolkata.edu.in`). Open **Smart Bulk Upload**. Upload `demo-data/sample-uploads/mixed_admissions_with_errors.csv`. Observe the AI mapping headers, flagging missing APAARs, detecting format errors, and preparing valid records for import.
7. **Predictive Admission Simulator**:  
   Open **Admission Simulator**. Propose 15 additional General admissions for CSE. The simulator flags that admissions will exceed capacity by 40 seats. Reduce to 0 and test Mechanical Engineering to observe a compliant scenario.
8. **Student Discrepancy Correction**:  
   Switch to **Student Rahul Sharma**. Open **Record Corrections**. Submit a request to update College A enrolment status to `TRANSFERRED`. Switch back to **College A Admin**, review the request in **Correction Requests**, and click **Approve & Sync**. Notice the conflict case automatically resolves!
9. **Digital Enrolment Passport & Public Verification**:  
   Switch to **Student Priya Das**. Open **Digital Passport**. View the verifiable credential with QR code and HMAC-SHA256 signature. Click **Open Verification Portal** (`/verify/SENTINEL-PASSPORT-...`) to see the authentic seal. Click **Revoke Credential**, verify again, and observe the instant **REVOKED** warning.
10. **Data Privacy & Consent**:  
    As Priya Das, open **Data Privacy & Consent**. Review the pending verification request from **Tata Consultancy Services (HR Campus)** and click **Approve Limited Sharing**. Observe the new event logged in the transparent data access audit trail.

---

## 7. Running the Automated Test Suite

A comprehensive 17-point automated system test verifies all algorithms, intake limits, cryptographic seals, and AI copilot tools:

```bash
cd backend
npx tsx src/tests/system.test.ts
```

Output:
```
====================================================
   RUNNING APAAR-SENTINEL VERIFICATION TEST SUITE   
====================================================
[PASS] Seeded exactly 12 institutions across India (Found: 12)
[PASS] Seeded at least 1,000 students (Found: 1109)
[PASS] Valid APAAR ID verified with high confidence (Status: VERIFIED)
[PASS] Mismatched ending-99 APAAR flagged (Status: FLAGGED_MISMATCH)
[PASS] College A CSE exceeds approved 120 intake (Excess: +25)
[PASS] Cross-institution dual active enrolment detected (Total: 1)
[PASS] Conflict graph nodes and edges generated dynamically
[PASS] Simulator accurately projected violation when adding seats to oversubscribed CSE
[PASS] Copilot accurately routed to getIntakeViolations tool
[PASS] Copilot returned real database-derived matching colleges
[PASS] Priya Das has an active verifiable credential
[PASS] HMAC-SHA256 digital signature verified successfully for credential
[PASS] Subsequent verification shows status REVOKED
[PASS] High/Elevated risk institution flagged by anomaly engine (Score: 50/100)
[PASS] Anomaly factors explain score transparently
[PASS] CandidateName mapped to full_name
[PASS] APAAR_NO mapped to apaar_id
====================================================
TEST RESULTS: 17 PASSED, 0 FAILED
====================================================
```

---

## 8. Resetting Demo Baseline

At any point during a demonstration, click the **Reset Demo Baseline** button in the top navigation bar or issue:
```bash
curl -X POST http://localhost:5000/api/demo/reset
```
This restores all 12 institutions, 1,109 students, and test scenarios to pristine initial condition in under 3 seconds.

---

*APAAR-Sentinel: Intelligent Student Identity, Enrolment Verification and Regulatory Compliance Platform.*
