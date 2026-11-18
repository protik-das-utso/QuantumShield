import React from 'react';
import {
  LayoutDashboard, KeyRound, Building2, FileCheck, FileSignature,
  Atom, Shield, ShieldAlert, Gauge, FlaskConical, BarChart3, FileDown,
  Settings, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Core' },
    { id: 'classical', label: 'Classical PKI', icon: KeyRound, category: 'PKI Infrastructure' },
    { id: 'ca', label: 'Certificate Authority', icon: Building2, category: 'PKI Infrastructure' },
    { id: 'cert-manager', label: 'Certificate Manager', icon: FileCheck, category: 'PKI Infrastructure' },
    { id: 'signatures', label: 'Digital Signature', icon: FileSignature, category: 'Operations' },
    { id: 'pqc', label: 'Post-Quantum (ML-DSA)', icon: Atom, category: 'Post-Quantum' },
    { id: 'attacks', label: 'Attack Simulation', icon: ShieldAlert, category: 'Evaluation' },
    { id: 'benchmark', label: 'Benchmarking', icon: Gauge, category: 'Evaluation' },
    { id: 'experiments', label: 'Research Experiments', icon: FlaskConical, category: 'Research' },
    { id: 'analytics', label: 'Analytics & Comparison', icon: BarChart3, category: 'Research' },
    { id: 'reports', label: 'Reports & Export', icon: FileDown, category: 'Research' },
    { id: 'settings', label: 'Settings & Environment', icon: Settings, category: 'System' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#090E1A] flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand / Title Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                QuantumShield <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-mono px-1.5 py-0.2 rounded border border-cyan-500/30">FIPS 204</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Evaluation Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Crypto Engine
          </span>
          <span className="font-mono text-slate-400">v1.0-Thesis</span>
        </div>
      </div>
    </aside>
  );
};
