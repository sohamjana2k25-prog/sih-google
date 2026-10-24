import db from '../database/db.js';
import { apaarVerificationService } from '../verification/apaarProvider.js';
import { ComplianceEngine } from '../compliance/complianceEngine.js';
import { ConflictDetector } from '../conflicts/conflictDetector.js';
import { AnomalyEngine } from '../anomalies/anomalyEngine.js';
import { RegulatoryCopilot } from '../copilot/regulatoryCopilot.js';
import { CredentialManager } from '../credentials/credentialManager.js';
import { SmartUploadEngine } from '../uploads/smartUpload.js';
import { SimulatorEngine } from '../simulations/simulatorEngine.js';

async function runSystemTests() {
  console.log('====================================================');
  console.log('   RUNNING APAAR-SENTINEL VERIFICATION TEST SUITE   ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // Test 1: Database Seed Integrity
  const instCount = (db.prepare('SELECT COUNT(*) as c FROM institutions').get() as any).c;
  assert(instCount === 12, `Seeded exactly 12 institutions across India (Found: ${instCount})`);

  const studentCount = (db.prepare('SELECT COUNT(*) as c FROM students').get() as any).c;
  assert(studentCount >= 1000, `Seeded at least 1,000 students (Found: ${studentCount})`);

  // Test 2: Mock APAAR Verification Provider Deterministic Behavior
  const validRes = await apaarVerificationService.verifyStudent('9821-4432-8812', 'Rahul Sharma', '2004-04-12', 'MALE');
  assert(validRes.status === 'VERIFIED', `Valid APAAR ID verified with high confidence (Status: ${validRes.status})`);

  const mismatchRes = await apaarVerificationService.verifyStudent('9821-4432-8899', 'Mismatch Name', '2004-04-12', 'MALE');
  assert(mismatchRes.status === 'FLAGGED_MISMATCH', `Mismatched ending-99 APAAR flagged (Status: ${mismatchRes.status})`);

  // Test 3: Automated Intake Compliance Check
  const compliance = ComplianceEngine.evaluateInstitutionCompliance('inst-kolkata-01');
  const cseProg = compliance.programmes.find(p => p.programmeCode === 'CSE');
  assert(cseProg && cseProg.excessAdmissions > 0, `College A CSE exceeds approved 120 intake (Excess: +${cseProg?.excessAdmissions})`);

  // Test 4: Conflict Graph & Detection Engine
  const conflicts = ConflictDetector.getConflictGraph();
  assert(conflicts.totalConflicts >= 1, `Cross-institution dual active enrolment detected (Total: ${conflicts.totalConflicts})`);
  assert(conflicts.nodes.length > 0 && conflicts.edges.length > 0, `Conflict graph nodes and edges generated dynamically`);

  // Test 5: Predictive Admission Simulator
  const sim = SimulatorEngine.runSimulation('inst-kolkata-01', cseProg!.programmeId, [
    { category: 'GENERAL', count: 10 },
  ]);
  assert(!sim.isCompliant, `Simulator accurately projected violation when adding seats to oversubscribed CSE`);

  // Test 6: AI Regulatory Copilot Execution
  const copilotRes = await RegulatoryCopilot.executeQuery('Show colleges in West Bengal exceeding approved CSE intake');
  assert(copilotRes.matchedTool === 'getIntakeViolations()', `Copilot accurately routed to getIntakeViolations tool`);
  assert(copilotRes.data.length > 0, `Copilot returned real database-derived matching colleges`);

  // Test 7: Verifiable Credential Issuance & Cryptographic Check
  const priya = db.prepare(`SELECT * FROM students WHERE email = 'priya.das@student.apaar.gov.in'`).get() as any;
  const creds = db.prepare(`SELECT * FROM issued_credentials WHERE student_id = ?`).all(priya.id) as any[];
  assert(creds.length > 0, `Priya Das has an active verifiable credential`);

  const verifyCheck = CredentialManager.verifyCredential(creds[0].credential_reference);
  assert(verifyCheck.isValid, `HMAC-SHA256 digital signature verified successfully for credential`);

  // Test 8: Revocation Pipeline
  CredentialManager.revokeCredential(creds[0].credential_reference, 'Testing revocation in test suite');
  const verifyRevoked = CredentialManager.verifyCredential(creds[0].credential_reference);
  assert(!verifyRevoked.isValid && verifyRevoked.status === 'REVOKED', `Subsequent verification shows status REVOKED`);

  // Restore credential for demo
  db.prepare(`UPDATE issued_credentials SET status = 'ACTIVE', revoked_at = NULL WHERE id = ?`).run(creds[0].id);

  // Test 9: Anomaly Engine Risk Scoring
  const anomalies = AnomalyEngine.evaluateAllInstitutions();
  const topRisk = anomalies[0];
  assert(topRisk.riskScore >= 50, `High/Elevated risk institution flagged by anomaly engine (Score: ${topRisk.riskScore}/100)`);
  assert(topRisk.contributingFactors.length > 0, `Anomaly factors explain score transparently`);


  // Test 10: Smart Column Mapping Auto-Detection
  const detected = SmartUploadEngine.suggestMappings(['CandidateName', 'APAAR_NO', 'Branch', 'Category']);
  assert(detected['CandidateName'] === 'full_name', `CandidateName mapped to full_name`);
  assert(detected['APAAR_NO'] === 'apaar_id', `APAAR_NO mapped to apaar_id`);

  console.log('====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runSystemTests().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
