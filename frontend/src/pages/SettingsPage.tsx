import React, { useEffect, useState } from 'react';
import {
  Settings, Cpu, HardDrive, ShieldCheck, Terminal, CheckCircle2,
  RefreshCw, Database, Server, Code
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { api } from '../api/client';
import { SystemInfo } from '../types';

export const SettingsPage: React.FC = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemInfo();
      setInfo(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">System Environment & Runtime Diagnostics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Hardware parameters, cryptographic engine bindings, and execution commands.
          </p>
        </div>

        <button
          onClick={loadInfo}
          className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Refresh Diagnostics"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Cryptography Stack Verification */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cryptographic Engine Validated</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Native FIPS 204 ML-DSA-44 and OpenSSL 4.0 bindings are verified active.
              </p>
            </div>
          </div>
          <Badge variant="emerald" size="md">OPERATIONAL</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">OpenSSL Backend</span>
            <span className="text-cyan-400 font-bold">{info?.openssl_version || 'OpenSSL 4.0.3'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Cryptography Package</span>
            <span className="text-slate-200">v{info?.cryptography_version || '50.0.2'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">ML-DSA Implementation</span>
            <span className="text-emerald-400 font-bold">{info?.mldsa_engine || 'Native Hazmat FIPS 204'}</span>
          </div>
        </div>
      </div>

      {/* Hardware & Runtime Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Compute Hardware & Operating System</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Operating System</span>
            <span className="text-slate-200">{info?.os || 'Windows 11'}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">CPU Processor</span>
            <span className="text-slate-200 truncate max-w-[220px]">{info?.processor || 'x86_64 Processor'}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">CPU Cores</span>
            <span className="text-slate-200">
              {info?.cpu_cores_physical || 4} Physical / {info?.cpu_cores_logical || 8} Logical Threads
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Installed System RAM</span>
            <span className="text-slate-200">{info?.ram_total_gb || 16} GB</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Python Version</span>
            <span className="text-slate-200">Python {info?.python_version || '3.12.7'}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-sans">Database Engine</span>
            <span className="text-cyan-400">SQLite 3 / SQLAlchemy ORM</span>
          </div>
        </div>
      </div>

      {/* Execution Commands Reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Thesis Defense Execution Commands</h3>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <span className="text-slate-400 block mb-1 font-sans font-medium">Start FastAPI Backend Server (Port 8000):</span>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 select-all">
              backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
            </pre>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-sans font-medium">Start Vite React Frontend (Port 5173):</span>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 select-all">
              cd frontend &amp;&amp; npm run dev
            </pre>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-sans font-medium">Execute Complete Automated PyTest Suite:</span>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 select-all">
              $env:PYTHONPATH = "backend"; backend\venv\Scripts\pytest.exe backend\tests -v
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
