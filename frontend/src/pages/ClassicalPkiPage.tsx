import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Download, Copy, Check, Clock, ShieldCheck, Hash } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { KeyPair } from '../types';

export const ClassicalPkiPage: React.FC = () => {
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Form state
  const [algorithm, setAlgorithm] = useState<'RSA-2048' | 'ECDSA-P256'>('RSA-2048');
  const [alias, setAlias] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await api.getClassicalKeys();
      setKeys(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;

    try {
      setGenerating(true);
      setError(null);
      await api.generateClassicalKey(algorithm, alias.trim(), notes.trim() || undefined);
      setIsModalOpen(false);
      setAlias('');
      setNotes('');
      await loadKeys();
    } catch (err: any) {
      setError(err.message || 'Key generation failed');
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Classical Cryptographic Key Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate and manage RSA-2048 and ECDSA NIST P-256 asymmetric cryptographic key pairs.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Key Pair</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Generated Classical Key Pairs ({keys.length})</h3>
          </div>
          <Badge variant="blue" size="sm">RSA-2048 & ECDSA P-256</Badge>
        </div>

        {keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Alias & Family</th>
                  <th className="py-3 px-5">Algorithm</th>
                  <th className="py-3 px-5">Public Key Size</th>
                  <th className="py-3 px-5">Private Key Size</th>
                  <th className="py-3 px-5">Fingerprint (SHA-256)</th>
                  <th className="py-3 px-5">Generation Time</th>
                  <th className="py-3 px-5 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-sans">
                      <div className="font-semibold text-white">{k.alias}</div>
                      {k.notes && <div className="text-[11px] text-slate-400 font-normal">{k.notes}</div>}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={k.algorithm === 'RSA-2048' ? 'blue' : 'cyan'} size="sm">
                        {k.algorithm}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-mono">
                      {k.public_key_bytes_len} B
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono">
                      {k.private_key_bytes_len} B
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px] max-w-[180px] truncate" title={k.fingerprint_sha256}>
                      {k.fingerprint_sha256}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-mono">
                      {k.keygen_duration_ms.toFixed(3)} ms
                    </td>
                    <td className="py-3.5 px-5 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyPem(k.id, k.public_key_pem)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Copy Public Key PEM"
                        >
                          {copiedKeyId === k.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a
                          href={`/api/classical/keys/${k.id}/public?format=pem`}
                          download
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                          title="Download Public Key PEM"
                        >
                          <Download className="h-4 w-4" />
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
            <KeyRound className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No Classical Key Pairs</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Generate an RSA-2048 or ECDSA P-256 key pair to use for digital signing or root certificate authority creation.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Generate First Key</span>
            </button>
          </div>
        )}
      </div>

      {/* Key Generation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Classical Key Pair"
        subtitle="Generates cryptographically secure private/public keys with precision timing measurement"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cryptographic Algorithm
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAlgorithm('RSA-2048')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  algorithm === 'RSA-2048'
                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm shadow-blue-500/20'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs">RSA-2048</div>
                <div className="text-[11px] text-slate-500 mt-0.5">2048-bit modulus, e=65537</div>
              </button>

              <button
                type="button"
                onClick={() => setAlgorithm('ECDSA-P256')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  algorithm === 'ECDSA-P256'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs">ECDSA P-256</div>
                <div className="text-[11px] text-slate-500 mt-0.5">NIST SECP256R1 Curve</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Key Alias / Unique Identifier
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. thesis_signer_rsa_01"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
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
              placeholder="e.g. Primary signer for evaluation batch A"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {generating && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{generating ? 'Generating Primitives...' : 'Generate Key Pair'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
