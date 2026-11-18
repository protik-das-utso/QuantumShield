import React, { useState } from 'react';
import {
  BarChart3, Zap, ShieldCheck, Scale, Network, Cpu, HardDrive,
  Info, TrendingUp, ArrowRight, AlertTriangle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';

export const AnalyticsComparisonPage: React.FC = () => {
  const [metricTab, setMetricTab] = useState<'timing' | 'sizes' | 'tradeoffs'>('timing');

  const timingData = [
    { algorithm: 'RSA-2048', keygen: 24.12, sign: 1.48, verify: 0.08, total: 25.68 },
    { algorithm: 'ECDSA P-256', keygen: 0.12, sign: 0.28, verify: 0.44, total: 0.84 },
    { algorithm: 'ML-DSA-44 (FIPS 204)', keygen: 0.18, sign: 0.35, verify: 0.16, total: 0.69 },
  ];

  const sizeData = [
    { algorithm: 'RSA-2048', pubKey: 270, privKey: 1190, signature: 256, handshakeTotal: 526 },
    { algorithm: 'ECDSA P-256', pubKey: 65, privKey: 32, signature: 64, handshakeTotal: 129 },
    { algorithm: 'ML-DSA-44 (FIPS 204)', pubKey: 1312, privKey: 2560, signature: 2420, handshakeTotal: 3732 },
  ];

  const speedupFactors = [
    { comparison: 'ML-DSA-44 Keygen vs RSA-2048', multiplier: '134x Faster', desc: 'Polynomial lattice initialization vs 2048-bit prime search' },
    { comparison: 'ML-DSA-44 Signing vs RSA-2048', multiplier: '4.2x Faster', desc: 'Fast NTT arithmetic vs modular exponentiation' },
    { comparison: 'ECDSA Signature vs ML-DSA-44', multiplier: '37.8x Smaller', desc: 'Compact 64-byte curve point vs 2,420-byte polynomial vector' },
    { comparison: 'RSA-2048 PubKey vs ML-DSA-44', multiplier: '4.8x Smaller', desc: '270-byte modulus/exponent vs 1,312-byte ring element' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Comparative Analysis & Trade-Off Matrix
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Classical vs Post-Quantum Architecture Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesis of cryptographic throughput, memory overhead, network bandwidth impact, and quantum resistance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setMetricTab('timing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricTab === 'timing' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Compute Latency
          </button>
          <button
            onClick={() => setMetricTab('sizes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricTab === 'sizes' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Size & MTU Footprint
          </button>
          <button
            onClick={() => setMetricTab('tradeoffs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricTab === 'tradeoffs' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Theoretical Trade-offs
          </button>
        </div>
      </div>

      {/* Relative Multipliers Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {speedupFactors.map((f, idx) => (
          <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {f.comparison}
            </span>
            <div className="text-xl font-bold font-mono text-cyan-400">{f.multiplier}</div>
            <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Charts & Visualizations */}
      {metricTab === 'timing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-white mb-1">Signing & Verification Execution Latency (ms)</h4>
            <p className="text-xs text-slate-400 mb-4">Lower is faster (Arithmetic performance comparison)</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timingData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-white mb-1">Key Generation Latency (ms)</h4>
            <p className="text-xs text-slate-400 mb-4">Prime searching (RSA) vs Matrix initialization (ML-DSA)</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timingData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="keygen" name="Keygen Duration (ms)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {metricTab === 'sizes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-white mb-1">Public Key & Signature Payload (Bytes)</h4>
            <p className="text-xs text-slate-400 mb-4">Impact on storage and cryptographic transmission</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="pubKey" name="Public Key (Bytes)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="signature" name="Signature (Bytes)" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">TLS Handshake Transmission Overhead</h4>
              <p className="text-xs text-slate-400 mb-4">Total bytes transmitted (Public Key + Signature) vs 1,500B Ethernet MTU</p>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">ECDSA P-256 (129 Bytes)</span>
                    <span className="text-emerald-400">8.6% of MTU (1 Packet)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '8.6%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">RSA-2048 (526 Bytes)</span>
                    <span className="text-blue-400">35.0% of MTU (1 Packet)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">ML-DSA-44 (3,732 Bytes)</span>
                    <span className="text-rose-400 font-bold">248.8% of MTU (3 Packets - Fragmented)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 mt-4 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Network Engineering Finding:</strong> ML-DSA-44 guarantees packet fragmentation over default Ethernet networks.
                Middleboxes and lossy satellite/wireless networks may drop fragmented UDP packets (e.g. DNSSEC or QUIC handshakes).
              </span>
            </div>
          </div>
        </div>
      )}

      {metricTab === 'tradeoffs' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-white">Comprehensive Cryptographic Property Matrix</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Characteristic</th>
                  <th className="py-3.5 px-6">RSA-2048</th>
                  <th className="py-3.5 px-6">ECDSA P-256</th>
                  <th className="py-3.5 px-6 text-cyan-400 font-bold">ML-DSA-44 (NIST FIPS 204)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Underlying Mathematical Problem</td>
                  <td className="py-3 px-6 text-slate-300">Integer Factorization Problem</td>
                  <td className="py-3 px-6 text-slate-300">Elliptic Curve Discrete Logarithm (ECDLP)</td>
                  <td className="py-3 px-6 text-cyan-300 font-mono">Module-LWE & Module-SIS</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Quantum Resistance Status</td>
                  <td className="py-3 px-6 text-rose-400 font-semibold">Vulnerable to Shor's Algorithm</td>
                  <td className="py-3 px-6 text-rose-400 font-semibold">Vulnerable to Shor's Algorithm</td>
                  <td className="py-3 px-6 text-emerald-400 font-bold">Quantum-Resistant (FIPS 204)</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Shor's Algorithm Complexity</td>
                  <td className="py-3 px-6 font-mono text-slate-400">O((log N)^3) Polynomial</td>
                  <td className="py-3 px-6 font-mono text-slate-400">O((log N)^3) Polynomial</td>
                  <td className="py-3 px-6 font-mono text-emerald-400">No known polynomial attack</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Public Key Footprint</td>
                  <td className="py-3 px-6 font-mono text-slate-300">270 Bytes</td>
                  <td className="py-3 px-6 font-mono text-emerald-400">65 Bytes (Smallest)</td>
                  <td className="py-3 px-6 font-mono text-amber-400">1,312 Bytes (~20x ECDSA)</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Signature Footprint</td>
                  <td className="py-3 px-6 font-mono text-slate-300">256 Bytes</td>
                  <td className="py-3 px-6 font-mono text-emerald-400">64 Bytes (Smallest)</td>
                  <td className="py-3 px-6 font-mono text-rose-400">2,420 Bytes (~38x ECDSA)</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-3 px-6 font-semibold text-white">Signing Throughput</td>
                  <td className="py-3 px-6 text-amber-400">Slow (Modular exponentiation)</td>
                  <td className="py-3 px-6 text-slate-300">Moderate</td>
                  <td className="py-3 px-6 text-emerald-400 font-bold">Extremely Fast (NTT Polynomials)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
