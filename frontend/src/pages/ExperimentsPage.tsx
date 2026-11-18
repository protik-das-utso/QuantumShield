import React, { useEffect, useState } from 'react';
import {
  FlaskConical, Plus, Download, FileText, CheckCircle2,
  Calendar, Layers, ArrowRight, RefreshCw, Cpu
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { ExperimentRecord } from '../types';

export const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedExp, setSelectedExp] = useState<ExperimentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('Comparative Evaluation of ML-DSA-44 vs Classical PKI');
  const [description, setDescription] = useState('Empirical validation for undergraduate final-year thesis research');
  const [iterations, setIterations] = useState(100);
  const [payloadSize, setPayloadSize] = useState(1024);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await api.getExperiments();
      setExperiments(data);
      if (data.length > 0 && !selectedExp) {
        setSelectedExp(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRunning(true);
      setError(null);
      const newExp = await api.createExperiment({
        title: title.trim(),
        description: description.trim() || undefined,
        algorithms: ['RSA-2048', 'ECDSA-P256', 'ML-DSA-44'],
        iterations: Number(iterations),
        payload_size_bytes: Number(payloadSize),
      });
      setIsModalOpen(false);
      setSelectedExp(newExp);
      await loadExperiments();
    } catch (err: any) {
      setError(err.message || 'Experiment execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Research Experiment Workspace
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Thesis Experimental Trials & Matrix Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct formal parameterized experiment runs and generate structured comparative matrix tables.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Research Experiment</span>
        </button>
      </div>

      {/* Selected Experiment View */}
      {selectedExp ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded">
                    {selectedExp.experiment_code}
                  </span>
                  <Badge variant="emerald" size="sm">{selectedExp.status}</Badge>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedExp.title}</h3>
                {selectedExp.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{selectedExp.description}</p>
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-3">
                <a
                  href={`/api/experiments/${selectedExp.id}/export/csv`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>CSV Export</span>
                </a>
                <a
                  href={`/api/experiments/${selectedExp.id}/export/json`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-purple-400" />
                  <span>JSON Export</span>
                </a>
                <a
                  href={`/api/reports/pdf/${selectedExp.id}`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Generate PDF Report</span>
                </a>
              </div>
            </div>

            {/* Environment Specification Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">CPU Processor</span>
                <span className="text-slate-300 truncate block">{selectedExp.system_specs?.processor || 'AMD/Intel x86_64'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">OpenSSL Engine</span>
                <span className="text-cyan-400 truncate block">{selectedExp.system_specs?.openssl_version || 'OpenSSL 4.0'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Sample Size</span>
                <span className="text-white block">{selectedExp.iterations} Repetitions</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Payload Size</span>
                <span className="text-white block">{selectedExp.payload_size_bytes} Bytes</span>
              </div>
            </div>
          </div>

          {/* Thesis Standard Comparison Table (Direct Requirement from Prompt Section 10) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Empirical Research Comparison Matrix</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actual recorded performance measurements and byte sizes (No fabricated values)
                </p>
              </div>
              <Badge variant="cyan" size="sm">Thesis Table Section 10</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Evaluation Metric</th>
                    <th className="py-3.5 px-6">RSA-2048 (Classical)</th>
                    <th className="py-3.5 px-6">ECDSA P-256 (Classical)</th>
                    <th className="py-3.5 px-6 text-cyan-400 font-bold">ML-DSA-44 (NIST FIPS 204)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedExp.comparison_table.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-white">{row.metric}</td>
                      <td className="py-3.5 px-6 text-slate-300">{row.rsa_2048}</td>
                      <td className="py-3.5 px-6 text-slate-300">{row.ecdsa_p256}</td>
                      <td className="py-3.5 px-6 text-cyan-400 font-bold bg-cyan-950/10">
                        {row.mldsa_44}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <FlaskConical className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Research Experiments Recorded</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Execute a new research experiment to measure and generate the standardized classical vs post-quantum comparison table.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Launch First Experiment</span>
          </button>
        </div>
      )}

      {/* Prior Experiments List */}
      {experiments.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            All Experiment Sessions ({experiments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {experiments.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedExp(e)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedExp?.id === e.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-semibold">
                  <span className="text-cyan-400">{e.experiment_code}</span>
                  <span className="text-[10px] text-slate-500">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs font-sans font-medium text-slate-200 mt-1 truncate">{e.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{e.iterations} iterations &bull; {e.payload_size_bytes}B payload</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Experiment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Research Experiment"
        subtitle="Executes automated multi-iteration benchmarking across RSA-2048, ECDSA P-256, and ML-DSA-44"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Experiment Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Research Description / Thesis Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
              disabled={running}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {running && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{running ? `Running ${iterations} Samples...` : 'Run Experiment'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
