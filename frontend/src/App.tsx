import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';
import { PublicVerificationPage } from './pages/public/PublicVerificationPage';

// AICTE Pages
import { AicteOverview } from './pages/aicte/AicteOverview';
import { InstitutionRegistry } from './pages/aicte/InstitutionRegistry';
import { NationalStudentRegistry } from './pages/aicte/NationalStudentRegistry';
import { AdmissionCompliance } from './pages/aicte/AdmissionCompliance';
import { AnomalyIntelligence } from './pages/aicte/AnomalyIntelligence';
import { ConflictNetwork } from './pages/aicte/ConflictNetwork';
import { GeographicHeatmap } from './pages/aicte/GeographicHeatmap';
import { RegulatoryCopilotPage } from './pages/aicte/RegulatoryCopilotPage';
import { AuditLogsPage } from './pages/aicte/AuditLogsPage';

// Institution Pages
import { CollegeOverview } from './pages/institution/CollegeOverview';
import { StudentManagement } from './pages/institution/StudentManagement';
import { BulkUploadWizard } from './pages/institution/BulkUploadWizard';
import { ComplianceSimulatorPage } from './pages/institution/ComplianceSimulatorPage';
import { CorrectionReviewPage } from './pages/institution/CorrectionReviewPage';
import { InstitutionReportsPage } from './pages/institution/InstitutionReportsPage';

// Student Pages
import { StudentOverview } from './pages/student/StudentOverview';
import { DigitalPassportPage } from './pages/student/DigitalPassportPage';
import { StudentCorrectionPage } from './pages/student/StudentCorrectionPage';
import { PrivacyConsentPage } from './pages/student/PrivacyConsentPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('');

  // Check if public verification route is accessed (e.g. /verify/...)
  const isVerifyRoute = window.location.pathname.startsWith('/verify');

  // Set default tab whenever user or user role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'AICTE_ADMIN') {
        setCurrentTab('aicte-overview');
      } else if (user.role === 'INSTITUTION_ADMIN') {
        setCurrentTab('college-overview');
      } else {
        setCurrentTab('student-overview');
      }
    }
  }, [user?.role]);

  if (isVerifyRoute) {
    return <PublicVerificationPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Initializing APAAR-Sentinel Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      // AICTE Views
      case 'aicte-overview':
        return <AicteOverview onNavigateTab={setCurrentTab} />;
      case 'aicte-institutions':
        return <InstitutionRegistry />;
      case 'aicte-students':
        return <NationalStudentRegistry />;
      case 'aicte-compliance':
        return <AdmissionCompliance />;
      case 'aicte-anomalies':
        return <AnomalyIntelligence />;
      case 'aicte-conflicts':
        return <ConflictNetwork />;
      case 'aicte-geography':
        return <GeographicHeatmap />;
      case 'aicte-copilot':
        return <RegulatoryCopilotPage />;
      case 'aicte-audit':
        return <AuditLogsPage />;

      // College Views
      case 'college-overview':
        return <CollegeOverview onNavigateTab={setCurrentTab} />;
      case 'college-students':
        return <StudentManagement />;
      case 'college-upload':
        return <BulkUploadWizard />;
      case 'college-simulator':
        return <ComplianceSimulatorPage />;
      case 'college-corrections':
        return <CorrectionReviewPage />;
      case 'college-reports':
        return <InstitutionReportsPage />;

      // Student Views
      case 'student-overview':
        return <StudentOverview onNavigateTab={setCurrentTab} />;
      case 'student-passport':
        return <DigitalPassportPage />;
      case 'student-corrections':
        return <StudentCorrectionPage />;
      case 'student-privacy':
        return <PrivacyConsentPage />;

      default:
        return user.role === 'AICTE_ADMIN' ? (
          <AicteOverview onNavigateTab={setCurrentTab} />
        ) : user.role === 'INSTITUTION_ADMIN' ? (
          <CollegeOverview onNavigateTab={setCurrentTab} />
        ) : (
          <StudentOverview onNavigateTab={setCurrentTab} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
