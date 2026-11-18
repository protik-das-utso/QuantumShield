import React, { useEffect, useState } from 'react';
import {
  Gauge, Play, Download, RefreshCw, BarChart2, Layers,
  Clock, HardDrive, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { api } from '../api/client';
import { BenchmarkSession } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export const BenchmarkingPage: React.FC = () => {
  const [sessions, setSessions] = useState<BenchmarkSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BenchmarkSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Run form
  const [iterations, setIterations] = useState(100);
  const [warmupRuns, setWarmupRuns] = useState(5);
  const [payloadSize, setPayloadSize] = useState(1024);
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getBenchmarkResults();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRunBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRunning(true);
      const newSession = await api.runBenchmark({
        algorithms: ['RSA-2048', 'ECDSA-P256', 'ML-DSA-44'],
        iterations: Number(iterations),
        warmup_runs: Number(warmupRuns),
        payload_size_bytes: Number(payloadSize),
        notes: notes.trim() || undefined,
      });
      setSelectedSession(newSession);
      await loadSessions();
    } catch (err: any) {
      alert(`Benchmark execution failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // Build chart dataset from selectedSession
  const timingChartData = selectedSession
    ? [
        {
          algorithm: 'RSA-2048',
          keygen: selectedSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'keygen')?.mean_ms || 0,
          sign: selectedSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'sign')?.mean_ms || 0,
          verify: selectedSession.metrics.find((m) => m.algorithm === 'RSA-2048' && m.operation === 'verify')?.mean_ms || 0,
        },
        {
          algorithm: 'ECDSA P-256',
          keygen: selectedSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'keygen')?.mean_ms || 0,
          sign: selectedSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'sign')?.mean_ms || 0,
          verify: selectedSession.metrics.find((m) => m.algorithm === 'ECDSA-P256' && m.operation === 'verify')?.mean_ms || 0,
        },
        {
          algorithm: 'ML-DSA-44',
          keygen: selectedSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'keygen')?.mean_ms || 0,
          sign: selectedSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'sign')?.mean_ms || 0,
          verify: selectedSession.metrics.find((m) => m.algorithm === 'ML-DSA-44' && m.operation === 'verify')?.mean_ms || 0,
        },
      ]
    : [];

  const sizeChartData = [
    { algorithm: 'RSA-2048', pubKey: 270, privKey: 1190, signature: 256 },
    { algorithm: 'ECDSA P-256', pubKey: 65, privKey: 32, signature: 64 },
    { algorithm: 'ML-DSA-44', pubKey: 1312, privKey: 2560, signature: 2420 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Reproducible Empirical Engine (time.perf_counter_ns)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Performance Benchmarking Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Collect microsecond-precision execution timings, size metrics, and statistical distributions across candidate algorithms.
          </p>
        </div>
      </div>

      {/* Benchmark Execution Configuration Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Configure Benchmark Experiment</h3>
          </div>
          <Badge variant="cyan" size="sm">N=100 Repetitions Standard</Badge>
        </div>

        <form onSubmit={handleRunBenchmark} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Iterations (Samples)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Warm-up Iterations
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={warmupRuns}
                onChange={(e) => setWarmupRuns(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Payload Size (Bytes)
              </label>
              <input
                type="number"
                min="32"
                max="1048576"
                value={payloadSize}
                onChange={(e) => setPayloadSize(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Experiment Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard thesis trial run"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Evaluates: RSA-2048, ECDSA P-256, and ML-DSA-44 across Keygen, Signing, and Verification.
            </span>
            <button
              type="submit"
              disabled={running}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
            >
              {running && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <Play className="h-4 w-4 fill-current" />
              <span>{running ? `Executing ${iterations} Repetitions...` : 'Run Benchmark Experiment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Session Viewer */}
      {selectedSession && (
        <div className="space-y-6">
          {/* Session Header / Metadata Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                {selectedSession.session_code}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">{selectedSession.name}</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedSession.cpu_model} | Python {selectedSession.python_version} | {selectedSession.crypto_library_version}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`/api/benchmark/export/${selectedSession.id}/csv`}
                download
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          {/* Interactive Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Execution Latency (Mean ms)</h4>
                  <p className="text-xs text-slate-400">Key generation, signing, and verification latency</p>
                </div>
                <Badge variant="cyan" size="sm">Milliseconds (ms)</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timingChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                      labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="keygen" name="Keygen (ms)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sign" name="Signing (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="verify" name="Verification (ms)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Size Footprint Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Memory & Payload Footprint (Bytes)</h4>
                  <p className="text-xs text-slate-400">Public key, private key, and signature size</p>
                </div>
                <Badge variant="purple" size="sm">Bytes (B)</Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sizeChartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                      labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="pubKey" name="Public Key (B)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="signature" name="Signature (B)" fill="#EC4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="privKey" name="Private Key (B)" fill="#64748B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Statistical Breakdown Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Detailed Statistical Metrics ({selectedSession.iterations} Iterations per Operation)
              </h4>
              <Badge variant="cyan" size="sm">NIST FIPS 204 Evaluation</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Algorithm</th>
                    <th className="py-3 px-5">Operation</th>
                    <th className="py-3 px-5">Mean (ms)</th>
                    <th className="py-3 px-5">Median (ms)</th>
                    <th className="py-3 px-5">Min / Max (ms)</th>
                    <th className="py-3 px-5">Std Dev (ms)</th>
                    <th className="py-3 px-5">P95 (ms)</th>
                    <th className="py-3 px-5 text-right">Payload Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedSession.metrics.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-5 font-sans">
                        <Badge variant={m.algorithm === 'ML-DSA-44' ? 'cyan' : m.algorithm === 'RSA-2048' ? 'blue' : 'slate'} size="sm">
                          {m.algorithm}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 font-sans font-medium text-slate-200 uppercase text-[11px]">
                        {m.operation}
                      </td>
                      <td className="py-3 px-5 font-bold text-white">{m.mean_ms.toFixed(3)} ms</td>
                      <td className="py-3 px-5 text-slate-300">{m.median_ms.toFixed(3)} ms</td>
                      <td className="py-3 px-5 text-slate-400">
                        {m.min_ms.toFixed(3)} / {m.max_ms.toFixed(3)}
                      </td>
                      <td className="py-3 px-5 text-slate-400">&plusmn;{m.std_dev_ms.toFixed(3)}</td>
                      <td className="py-3 px-5 text-cyan-400">{m.p95_ms.toFixed(3)} ms</td>
                      <td className="py-3 px-5 text-right text-slate-300">
                        {m.signature_bytes ? `${m.signature_bytes} B (Sig)` : m.public_key_bytes ? `${m.public_key_bytes} B (PK)` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historical Sessions Selector */}
      {sessions.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Prior Benchmark Sessions ({sessions.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedSession?.id === s.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-cyan-400">{s.session_code}</span>
                  <span className="text-[10px] text-slate-500">{new Date(s.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
