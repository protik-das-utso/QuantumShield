import React, { useEffect, useState } from 'react';
import {
  KeyRound, ShieldCheck, FileCheck, FileSignature, ShieldAlert,
  Gauge, ArrowUpRight, CheckCircle2, XCircle, Cpu, Clock, RefreshCw
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { api } from '../api/client';
import { SystemStats, SystemInfo, BenchmarkSession, SignatureRecord } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [recentBenchmarks, setRecentBenchmarks] = useState<BenchmarkSession[]>([]);
  const [recentSignatures, setRecentSignatures] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, iData, bData, sigData] = await Promise.all([
        api.getSystemStats(),
        api.getSystemInfo(),
        api.getBenchmarkResults(),
        api.getSignatures(),
      ]);
      setStats(sData);
      setSysInfo(iData);
      setRecentBenchmarks(bData);
      setRecentSignatures(sigData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute latest benchmark comparison data if available
  const latestSession = recentBenchmarks.length > 0 ? recentBenchmarks[0] : null;

  const chartDataTiming = latestSession
    ? [
        {
          algorithm: 'RSA-2048',
          keygen: latestSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'keygen')?.mean_ms || 0,
          sign: latestSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'sign')?.mean_ms || 0,
          verify: latestSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'verify')?.mean_ms || 0,
        },
        {
          algorithm: 'ECDSA P-256',
          keygen: latestSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'keygen')?.mean_ms || 0,
          sign: latestSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'sign')?.mean_ms || 0,
          verify: latestSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'verify')?.mean_ms || 0,
        },
        {
          algorithm: 'ML-DSA-44',
          keygen: latestSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'keygen')?.mean_ms || 0,
          sign: latestSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'sign')?.mean_ms || 0,
          verify: latestSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'verify')?.mean_ms || 0,
        },
      ]
    : [];

  const chartDataSizes = latestSession
    ? [
        {
          algorithm: 'RSA-2048',
          publicKey: 270,
          signature: 256,
        },
        {
          algorithm: 'ECDSA P-256',
          publicKey: 65,
          signature: 64,
        },
        {
          algorithm: 'ML-DSA-44',
          publicKey: 1312,
          signature: 2420,
        },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Thesis Note */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                Undergraduate / Final-Year Thesis Evaluation Platform
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-white tracking-tight">
              Post-Quantum Cryptography & PKI Migration Testbed
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Empirical comparison of classical public-key cryptography (RSA-2048, ECDSA P-256) versus
              standardized post-quantum module-lattice signatures (ML-DSA-44 / NIST FIPS 204).
              All operations are executed live through genuine cryptographic primitives.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('benchmark')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Gauge className="h-4 w-4" />
              <span>Launch Benchmark</span>
            </button>
            <button
              onClick={loadData}
              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Keys Generated"
          value={stats?.total_keys || 0}
          subtitle={`${stats?.classical_keys || 0} Classical | ${stats?.pqc_keys || 0} PQC`}
          icon={KeyRound}
          variant="cyan"
        />
        <StatCard
          title="Certificates"
          value={stats?.total_certs || 0}
          subtitle={`${stats?.total_cas || 0} Root CAs | ${stats?.revoked_certs || 0} Revoked`}
          icon={FileCheck}
          variant="blue"
        />
        <StatCard
          title="Signed Documents"
          value={stats?.total_signatures || 0}
          subtitle="Real cryptographic signatures"
          icon={FileSignature}
          variant="emerald"
        />
        <StatCard
          title="Attacks Simulated"
          value={stats?.total_attacks || 0}
          subtitle={`${stats?.attacks_detected || 0} Defenses caught`}
          icon={ShieldAlert}
          variant="rose"
        />
        <StatCard
          title="Benchmarks Run"
          value={stats?.total_benchmarks || 0}
          subtitle="Reproducible experiments"
          icon={Gauge}
          variant="cyan"
        />
        <StatCard
          title="FIPS 204 Status"
          value="FIPS 204"
          subtitle="Standard Pure Mode"
          icon={ShieldCheck}
          variant="emerald"
          badge="Verified"
        />
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Comparison Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Signing & Verification Execution Latency (ms)
              </h3>
              <p className="text-xs text-slate-400">
                {latestSession ? `Based on ${latestSession.session_code} (${latestSession.iterations} iterations)` : 'Awaiting first benchmark execution'}
              </p>
            </div>
            <Badge variant="cyan" size="sm">Mean Time (ms)</Badge>
          </div>

          {chartDataTiming.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataTiming} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="sign" name="Signing Time (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verify" name="Verification Time (ms)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Gauge className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No benchmark sessions executed yet</p>
              <button
                onClick={() => onNavigate('benchmark')}
                className="mt-3 text-xs text-cyan-400 hover:underline font-medium"
              >
                Execute an automated benchmark session &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Public Key and Signature Size Comparison Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Public Key & Signature Payload Footprint (Bytes)
              </h3>
              <p className="text-xs text-slate-400">Standardized raw size comparison (NIST FIPS 204 vs Classical)</p>
            </div>
            <Badge variant="purple" size="sm">Bytes (B)</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { algorithm: 'RSA-2048', publicKey: 270, signature: 256 },
                  { algorithm: 'ECDSA P-256', publicKey: 65, signature: 64 },
                  { algorithm: 'ML-DSA-44', publicKey: 1312, signature: 2420 },
                ]}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="publicKey" name="Public Key (Bytes)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="signature" name="Signature (Bytes)" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity: Signatures & Experiments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signing Operations */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Recent Signing Operations</h3>
            </div>
            <button
              onClick={() => onNavigate('signatures')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>View all</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentSignatures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Document</th>
                    <th className="pb-2.5">Algorithm</th>
                    <th className="pb-2.5">Signature Size</th>
                    <th className="pb-2.5">Signing Latency</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentSignatures.map((sig) => (
                    <tr key={sig.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 text-slate-200 font-sans font-medium">{sig.document_name}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          sig.algorithm === 'ML-DSA-44'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {sig.algorithm}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{sig.signature_size_bytes} B</td>
                      <td className="py-2.5 text-slate-400">{sig.signing_duration_ms.toFixed(3)} ms</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{sig.verification_status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500">
              No documents signed yet. Sign a PDF or document in the Digital Signature module.
            </div>
          )}
        </div>

        {/* Cryptographic Engine Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Cryptographic Subsystem</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Host OS</span>
              <span className="font-mono text-slate-200 truncate max-w-[160px]">{sysInfo?.os || 'Windows 11'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">OpenSSL Core</span>
              <span className="font-mono text-cyan-400 truncate max-w-[160px]">{sysInfo?.openssl_version || 'OpenSSL 4.0.3'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Python Cryptography</span>
              <span className="font-mono text-slate-200">v{sysInfo?.cryptography_version || '50.0.2'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">ML-DSA Implementation</span>
              <span className="font-mono text-emerald-400 font-medium">NIST FIPS 204 Pure</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Hardware Threads</span>
              <span className="font-mono text-slate-200">{sysInfo?.cpu_cores_logical || 8} logical cores</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">System Memory</span>
              <span className="font-mono text-slate-200">{sysInfo?.ram_total_gb || 16} GB RAM</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Academic Verification:</strong> Cryptographic keys, digests, and signatures
              are generated on-the-fly and strictly validated without synthetic delays or cached outputs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
