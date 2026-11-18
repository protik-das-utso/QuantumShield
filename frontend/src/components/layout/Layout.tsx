import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SystemInfo } from '../../types';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  systemInfo: SystemInfo | null;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  systemInfo,
  children,
}) => {
  const tabNames: Record<string, string> = {
    dashboard: 'Research Overview Dashboard',
    classical: 'Classical Public Key Infrastructure (RSA & ECDSA)',
    ca: 'Certificate Authority (Root CA)',
    'cert-manager': 'X.509 Certificate Management & Validation',
    signatures: 'Digital Document Signing & Detached Verification',
    pqc: 'Post-Quantum Module (ML-DSA-44 / NIST FIPS 204)',
    attacks: 'Security Attack Simulation & Tamper Detection Laboratory',
    benchmark: 'Performance Benchmarking Engine',
    experiments: 'Experimental Research Workspace',
    analytics: 'Analytics & Classical vs PQC Comparison',
    reports: 'Research Reports & Data Export',
    settings: 'Hardware Environment & System Specifications',
  };

  return (
    <div className="flex min-h-screen bg-[#060B14]">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentTabName={tabNames[currentTab] || 'Dashboard'} systemInfo={systemInfo} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
