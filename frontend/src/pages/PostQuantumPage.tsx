import React, { useEffect, useState } from 'react';
import {
  Atom, Plus, Download, Copy, Check, ShieldCheck, Binary, Info,
  Network, Cpu, HardDrive, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { KeyPair, PqcTechnicalInfo } from '../types';

export const PostQuantumPage: React.FC = () => {
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [techInfo, setTechInfo] = useState<PqcTechnicalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Keygen form
  const [alias, setAlias] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kData, tData] = await Promise.all([
        api.getPqcKeys(),
        api.getPqcInfo(),
      ]);
      setKeys(kData);
      setTechInfo(tData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      await api.generatePqcKey(alias.trim(), notes.trim() || undefined);
      setIsModalOpen(false);
      setAlias('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'PQC key generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPem = (id: number, pem?: string) => {
    if (!pem) return;
    navigator.clipboard.writeText(pem);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              NIST FIPS 204 Standard
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Post-Quantum Cryptography Module: ML-DSA-44
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate Module-Lattice-Based Digital Signature Algorithm (formerly CRYSTALS-Dilithium2).
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Generate ML-DSA-44 Key Pair</span>
        </button>
      </div>

      {/* NIST FIPS 204 Standard Specifications Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Public Key Size</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">1,312</span>
            <span className="text-xs text-slate-400 font-mono">Bytes</span>
          </div>
          <p className="text-[11px] text-cyan-400 mt-1 font-mono">ρ (32B) + t₁ (1280B)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Secret Key Size</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">2,560</span>
            <span className="text-xs text-slate-400 font-mono">Bytes (Exp)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">32B seed representation</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Signature Size</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">2,420</span>
            <span className="text-xs text-slate-400 font-mono">Bytes</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-mono">Fixed constant length</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Security Category</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-cyan-400">Category 2</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">AES-128 / SHA-256 equivalent</p>
        </div>
      </div>

      {/* Generated PQC Keys Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Generated ML-DSA-44 Key Pairs ({keys.length})</h3>
          </div>
          <Badge variant="cyan" size="sm">FIPS 204 Compliant</Badge>
        </div>

        {keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Alias & Notes</th>
                  <th className="py-3 px-5">Raw Public Key</th>
                  <th className="py-3 px-5">Expanded Secret Key</th>
                  <th className="py-3 px-5">Key Fingerprint</th>
                  <th className="py-3 px-5">Generation Time</th>
                  <th className="py-3 px-5 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-sans">
                      <div className="font-semibold text-white">{k.alias}</div>
                      <div className="text-[11px] text-slate-500">{k.notes || 'ML-DSA-44 Key'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-cyan-400 font-semibold">{k.public_key_bytes_len} Bytes</td>
                    <td className="py-3.5 px-5 text-slate-400">{k.private_key_bytes_len} Bytes</td>
                    <td className="py-3.5 px-5 text-slate-400 text-[10px] max-w-[170px] truncate" title={k.fingerprint_sha256}>
                      {k.fingerprint_sha256}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">{k.keygen_duration_ms.toFixed(3)} ms</td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyPem(k.id, k.public_key_pem)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Copy SPKI PEM"
                        >
                          {copiedKeyId === k.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a
                          href={`/api/pqc/keys/${k.id}/public?format=pem`}
                          download
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                          title="Download SPKI PEM"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <a
                          href={`/api/pqc/keys/${k.id}/public?format=raw`}
                          download
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-purple-400 transition-colors"
                          title="Download Raw 1,312-byte Public Key"
                        >
                          <Binary className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Atom className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No ML-DSA-44 Keys Generated</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Generate an ML-DSA-44 key pair to evaluate post-quantum digital signature performance and size characteristics.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Generate ML-DSA-44 Key</span>
            </button>
          </div>
        )}
      </div>

      {/* Research & Technical Information Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Info className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Academic Research & Technical Deep-Dive: ML-DSA-44 (NIST FIPS 204)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Mathematical Foundation */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <Cpu className="h-4 w-4" />
              <span>Lattice-Based Hardness</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ML-DSA operates over polynomial rings{' '}
              <code className="text-cyan-300 font-mono bg-cyan-950/40 px-1 py-0.5 rounded">
                R_q = Z_q[X] / (X^256 + 1)
              </code>{' '}
              where modulus <code className="text-cyan-300 font-mono">q = 8,380,417</code>. Its security rests on the
              hardness of two foundational lattice problems: <strong>Module Learning With Errors (M-LWE)</strong> and{' '}
              <strong>Module Short Integer Solution (M-SIS)</strong>.
            </p>
            <p className="text-[11px] text-slate-400">
              Unlike integer factorization (RSA) and discrete logarithms (ECDSA), no polynomial-time quantum algorithm is
              known for shortest vector approximations in high-dimensional ideal/module lattices.
            </p>
          </div>

          {/* Card 2: Performance Trade-offs */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Arithmetic Speedup (NTT)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ML-DSA leverages the <strong>Number Theoretic Transform (NTT)</strong> for polynomial multiplication,
              yielding an asymptotically faster operational complexity of{' '}
              <code className="text-emerald-300 font-mono">O(n log n)</code>.
            </p>
            <p className="text-[11px] text-slate-400">
              In experimental benchmarks, ML-DSA-44 signing and verification dramatically outperform classical RSA-2048 modular
              exponentiation (<code className="text-emerald-300 font-mono">O(n^3)</code>), eliminating compute bottlenecks on high-throughput servers.
            </p>
          </div>

          {/* Card 3: Network & Storage Overhead */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <Network className="h-4 w-4" />
              <span>Network MTU & Fragmentation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The primary cost of ML-DSA-44 is structural size: a signature requires{' '}
              <strong>2,420 bytes</strong> and a public key requires <strong>1,312 bytes</strong>.
            </p>
            <p className="text-[11px] text-slate-400">
              Because standard Internet MTU is 1,500 bytes, transmitting ML-DSA-44 signatures in TLS handshakes guarantees
              packet fragmentation, introducing latency penalties across constrained or lossy networks.
            </p>
          </div>
        </div>

        {/* Migration Implications Bullet List */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            PKI Migration Implications for Thesis Evaluation:
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {techInfo?.migration_implications.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                <span>{imp}</span>
              </li>
            )) || (
              <>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                  <span>Bandwidth & MTU Fragmentation: ML-DSA-44 signatures (2,420B) exceed typical network MTU (1,500B).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                  <span>Storage Overhead: PKI certificate stores and embedded HSMs require significantly larger key allocations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                  <span>Compute Advantage: NTT polynomial arithmetic outperforms RSA modular exponentiation.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Keygen Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate ML-DSA-44 Key Pair"
        subtitle="Generates NIST FIPS 204 module-lattice key pair with 1,312-byte public key"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Key Alias / Identifier
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. pqc_signer_mldsa_01"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Research Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ML-DSA-44 benchmark key for thesis trial"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {generating && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{generating ? 'Executing Lattice Keygen...' : 'Generate ML-DSA-44 Key'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
