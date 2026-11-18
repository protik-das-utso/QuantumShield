import React from 'react';
import { ShieldCheck, Cpu, Terminal, Clock } from 'lucide-react';
import { SystemInfo } from '../../types';

interface HeaderProps {
  currentTabName: string;
  systemInfo: SystemInfo | null;
}

export const Header: React.FC<HeaderProps> = ({ currentTabName, systemInfo }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0B1120]/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">{currentTabName}</h2>
        <span className="hidden sm:inline-block text-slate-600">/</span>
        <span className="hidden sm:inline-block text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
          Research Workbench
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* ML-DSA FIPS 204 Status Pill */}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="font-medium">ML-DSA-44 (FIPS 204) Active</span>
        </div>

        {/* OpenSSL indicator */}
        {systemInfo && (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 font-mono">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>OpenSSL 4.0 / Crypto 50.0</span>
          </div>
        )}
      </div>
    </header>
  );
};
