import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClassicalPkiPage } from './pages/ClassicalPkiPage';
import { CertificateAuthorityPage } from './pages/CertificateAuthorityPage';
import { CertificateManagerPage } from './pages/CertificateManagerPage';
import { DigitalSignaturePage } from './pages/DigitalSignaturePage';
import { PostQuantumPage } from './pages/PostQuantumPage';
import { AttackSimulationPage } from './pages/AttackSimulationPage';
import { BenchmarkingPage } from './pages/BenchmarkingPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { AnalyticsComparisonPage } from './pages/AnalyticsComparisonPage';
import { ReportsExportPage } from './pages/ReportsExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';
import { SystemInfo } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    api.getSystemInfo()
      .then(setSystemInfo)
      .catch((err) => console.error('Failed to load system info:', err));
  }, []);

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      systemInfo={systemInfo}
    >
      {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
      {currentTab === 'classical' && <ClassicalPkiPage />}
      {currentTab === 'ca' && <CertificateAuthorityPage />}
      {currentTab === 'cert-manager' && <CertificateManagerPage />}
      {currentTab === 'signatures' && <DigitalSignaturePage />}
      {currentTab === 'pqc' && <PostQuantumPage />}
      {currentTab === 'attacks' && <AttackSimulationPage />}
      {currentTab === 'benchmark' && <BenchmarkingPage />}
      {currentTab === 'experiments' && <ExperimentsPage />}
      {currentTab === 'analytics' && <AnalyticsComparisonPage />}
      {currentTab === 'reports' && <ReportsExportPage />}
      {currentTab === 'settings' && <SettingsPage />}
    </Layout>
  );
};

export default App;
