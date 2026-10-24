const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('sentinel_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('sentinel_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('sentinel_token');
  localStorage.removeItem('sentinel_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  getDemoAccounts: () => request<any[]>('/auth/demo-accounts'),

  // Institutions
  getInstitutions: (params: { state?: string; search?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.state) q.set('state', params.state);
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    return request<{ institutions: any[]; count: number }>(`/institutions?${q.toString()}`);
  },
  getInstitution: (id: string) => request<any>(`/institutions/${id}`),
  getInstitutionStats: (id: string) => request<any>(`/institutions/${id}/statistics`),

  // Students
  getStudents: (params: { institutionId?: string; programmeId?: string; verificationStatus?: string; search?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.institutionId) q.set('institutionId', params.institutionId);
    if (params.programmeId) q.set('programmeId', params.programmeId);
    if (params.verificationStatus) q.set('verificationStatus', params.verificationStatus);
    if (params.search) q.set('search', params.search);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    return request<{ students: any[]; pagination: any }>(`/students?${q.toString()}`);
  },
  getStudent: (id: string) => request<any>(`/students/${id}`),
  createStudent: (studentData: any) =>
    request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  // Compliance
  getComplianceOverview: (session = '2024-2025') =>
    request<any>(`/compliance/overview?session=${session}`),
  getInstitutionCompliance: (id: string, session = '2024-2025') =>
    request<any>(`/compliance/institutions/${id}?session=${session}`),
  getViolations: (params: { institutionId?: string; severity?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.institutionId) q.set('institutionId', params.institutionId);
    if (params.severity) q.set('severity', params.severity);
    if (params.status) q.set('status', params.status);
    return request<{ alerts: any[]; count: number }>(`/compliance/violations?${q.toString()}`);
  },
  recalculateCompliance: (institutionId?: string) =>
    request<any>('/compliance/recalculate', {
      method: 'POST',
      body: JSON.stringify({ institutionId }),
    }),

  // Conflicts
  getConflicts: (params: { status?: string; severity?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.severity) q.set('severity', params.severity);
    return request<{ cases: any[]; count: number }>(`/conflicts?${q.toString()}`);
  },
  getConflict: (id: string) => request<any>(`/conflicts/${id}`),
  getConflictGraph: (params: { studentId?: string; institutionId?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.studentId) q.set('studentId', params.studentId);
    if (params.institutionId) q.set('institutionId', params.institutionId);
    return request<any>(`/conflicts/graph?${q.toString()}`);
  },
  resolveConflict: (id: string, data: { resolutionDetails: string; primaryEnrolmentId?: string; secondaryEnrolmentAction?: string }) =>
    request<any>(`/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Anomalies
  getAnomalies: (session = '2024-2025') => request<{ evaluations: any[]; count: number }>(`/anomalies?session=${session}`),
  getAnomalyStats: () => request<any>('/anomalies/statistics'),
  getInstitutionAnomaly: (institutionId: string, session = '2024-2025') =>
    request<any>(`/anomalies/${institutionId}?session=${session}`),
  reviewAnomalyAlert: (id: string, data: { status: string; comments?: string }) =>
    request<any>(`/anomalies/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // AI Copilot
  queryCopilot: (query: string) =>
    request<any>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  getCopilotSuggestions: () => request<{ suggestions: string[] }>('/copilot/suggestions'),

  // Credentials
  issueCredential: (data: { studentId: string; enrolmentId: string; disclosedFields?: string[]; validityDays?: number }) =>
    request<any>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStudentCredentials: (studentId: string) =>
    request<{ credentials: any[] }>(`/credentials/student/${studentId}`),
  revokeCredential: (ref: string, reason?: string) =>
    request<any>(`/credentials/${ref}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  verifyPublicCredential: (ref: string) =>
    request<any>(`/public/credentials/verify/${ref}`),

  // Consents & Privacy
  getStudentConsents: (studentId: string) =>
    request<{ consents: any[] }>(`/consents/student/${studentId}`),
  approveConsent: (id: string) => request<any>(`/consents/${id}/approve`, { method: 'POST' }),
  rejectConsent: (id: string) => request<any>(`/consents/${id}/reject`, { method: 'POST' }),
  revokeConsent: (id: string) => request<any>(`/consents/${id}/revoke`, { method: 'POST' }),
  getDataAccessLogs: (studentId: string) =>
    request<{ logs: any[] }>(`/consents/access-logs/${studentId}`),

  // Corrections
  getCorrections: (params: { institutionId?: string; studentId?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.institutionId) q.set('institutionId', params.institutionId);
    if (params.studentId) q.set('studentId', params.studentId);
    if (params.status) q.set('status', params.status);
    return request<{ requests: any[]; count: number }>(`/corrections?${q.toString()}`);
  },
  submitCorrection: (data: any) =>
    request<any>('/corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reviewCorrection: (id: string, data: { decision: string; comments?: string }) =>
    request<any>(`/corrections/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Simulations
  runSimulation: (data: { institutionId: string; programmeId: string; proposedBatches: any[]; scenarioName?: string; academicSession?: string }) =>
    request<any>('/simulations/run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSimulationHistory: (institutionId: string) =>
    request<{ scenarios: any[] }>(`/simulations/history/${institutionId}`),

  // Uploads
  parseUploadFile: (formData: FormData) =>
    request<any>('/uploads/parse', {
      method: 'POST',
      body: formData,
    }),
  validateUploadRows: (data: { rows: any[]; mappings: Record<string, string>; institutionId: string; session?: string }) =>
    request<any>('/uploads/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmUploadImport: (data: { institutionId: string; validRows: any[]; filename?: string; session?: string }) =>
    request<any>('/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUploadHistory: (institutionId: string) =>
    request<{ batches: any[] }>(`/uploads/history/${institutionId}`),

  // Geography
  getGeoStates: () => request<{ states: any[] }>('/geography/states'),
  getGeoInstitutions: (state?: string) =>
    request<{ institutions: any[] }>(`/geography/institutions${state ? `?state=${encodeURIComponent(state)}` : ''}`),

  // Reports
  getAicteReportSummary: () => request<any>('/reports/aicte/summary'),
  getInstitutionReportPdfUrl: (institutionId: string) => `${API_BASE}/reports/institution/${institutionId}/pdf`,
  getInstitutionReportCsvUrl: (institutionId: string) => `${API_BASE}/reports/institution/${institutionId}/csv`,

  // Audit Logs
  getAuditLogs: (limit = 50) => request<{ logs: any[]; count: number }>(`/audit-logs?limit=${limit}`),

  // Demo Controls
  getDemoStatus: () => request<any>('/demo/status'),
  resetDemoDatabase: () => request<any>('/demo/reset', { method: 'POST' }),
};
