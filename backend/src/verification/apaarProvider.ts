export interface ApaarVerificationResult {
  apaarId: string;
  status: 'VERIFIED' | 'FLAGGED_MISMATCH' | 'UNAVAILABLE' | 'TIMEOUT';
  isSimulated: boolean;
  provider: string;
  timestamp: string;
  confidenceScore: number;
  matchDetails: {
    nameMatch: boolean;
    dobMatch: boolean;
    genderMatch: boolean;
    score: number;
  };
  regulatoryNotes?: string;
}

export interface ApaarVerificationProvider {
  verifyStudent(
    apaarId: string,
    fullName: string,
    dob: string,
    gender: string
  ): Promise<ApaarVerificationResult>;
}

export class MockApaarVerificationProvider implements ApaarVerificationProvider {
  // Deterministic rule: APAAR IDs ending with '99' or containing 'FAIL' trigger mismatch
  // APAAR IDs ending with '00' or containing 'UNAVAIL' trigger unavailable
  // Otherwise verified with realistic high confidence
  async verifyStudent(
    apaarId: string,
    fullName: string,
    dob: string,
    gender: string
  ): Promise<ApaarVerificationResult> {
    const cleanId = apaarId.replace(/[^0-9]/g, '');

    // Format check: Standard APAAR ID is 12 digits
    if (cleanId.length !== 12) {
      return {
        apaarId,
        status: 'FLAGGED_MISMATCH',
        isSimulated: true,
        provider: 'MockApaarVerificationProvider (AICTE Simulation Sandbox)',
        timestamp: new Date().toISOString(),
        confidenceScore: 0.1,
        matchDetails: {
          nameMatch: false,
          dobMatch: false,
          genderMatch: false,
          score: 0.1,
        },
        regulatoryNotes: 'Invalid APAAR ID format (expected 12 digits). Flagged for institutional administrative check.',
      };
    }

    // Deterministic simulation patterns
    if (cleanId.endsWith('99') || cleanId.endsWith('88') || apaarId.includes('FAIL')) {
      return {
        apaarId,
        status: 'FLAGGED_MISMATCH',
        isSimulated: true,
        provider: 'MockApaarVerificationProvider (AICTE Simulation Sandbox)',
        timestamp: new Date().toISOString(),
        confidenceScore: 0.42,
        matchDetails: {
          nameMatch: false,
          dobMatch: true,
          genderMatch: true,
          score: 0.42,
        },
        regulatoryNotes: 'Simulated Name Discrepancy: Authoritative registry record spelling differs from institutional submission.',
      };
    }

    if (cleanId.endsWith('00') || apaarId.includes('UNAVAIL')) {
      return {
        apaarId,
        status: 'UNAVAILABLE',
        isSimulated: true,
        provider: 'MockApaarVerificationProvider (AICTE Simulation Sandbox)',
        timestamp: new Date().toISOString(),
        confidenceScore: 0.0,
        matchDetails: {
          nameMatch: false,
          dobMatch: false,
          genderMatch: false,
          score: 0.0,
        },
        regulatoryNotes: 'Record not found in Central APAAR Directory. Student has not activated DigiLocker/APAAR consent.',
      };
    }

    // Normal successful match
    return {
      apaarId,
      status: 'VERIFIED',
      isSimulated: true,
      provider: 'MockApaarVerificationProvider (AICTE Simulation Sandbox)',
      timestamp: new Date().toISOString(),
      confidenceScore: 0.99,
      matchDetails: {
        nameMatch: true,
        dobMatch: true,
        genderMatch: true,
        score: 0.99,
      },
      regulatoryNotes: 'Simulated Authoritative Verification: Biometric & Demographics validated against Academic Bank of Credits (ABC).',
    };
  }
}

export const apaarVerificationService = new MockApaarVerificationProvider();
