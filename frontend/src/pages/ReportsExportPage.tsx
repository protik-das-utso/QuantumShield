import React, { useEffect, useState } from 'react';
import {
  FileDown, FileText, Download, CheckCircle2, ShieldCheck,
  Calendar, Layers, ArrowRight, RefreshCw, Cpu
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { api } from '../api/client';
import { ExperimentRecord, BenchmarkSession } from '../types';

export const ReportsExportPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expData, benchData] = await Promise.all([
        api.getExperiments(),
        api.getBenchmarkResults(),
      ]);
      setExperiments(expData);
      setBenchmarks(benchData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Thesis Documentation & Data Export
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Research Reports & Experimental Data Export
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download thesis-ready PDF research evaluation reports, raw CSV data sheets, and JSON schemas.
          </p>
        </div>

        <button
          onClick={loadData}
          className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* PDF Report Generation Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generate Publication-Grade PDF Research Report</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatted according to academic thesis standards with environment specs, timing tables, attack logs, and discussion.
              </p>
            </div>
          </div>
          <Badge variant="blue" size="sm">ReportLab PDF Engine</Badge>
        </div>

        {experiments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{exp.experiment_code}</span>
                    <span className="text-[10px] text-slate-500">{new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{exp.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{exp.description || 'Thesis experiment run'}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-500">
                    <span>{exp.iterations} Samples</span>
                    <span>&bull;</span>
                    <span>{exp.payload_size_bytes}B Payload</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/experiments/${exp.id}/export/csv`}
                      download
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      CSV
                    </a>
                    <a
                      href={`/api/experiments/${exp.id}/export/json`}
                      download
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      JSON
                    </a>
                  </div>

                  <a
                    href={`/api/reports/pdf/${exp.id}`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No experiment sessions recorded yet. Run an experiment in the 'Research Experiments' tab first.
          </div>
        )}
      </div>

      {/* Raw Benchmark Sessions CSV Export Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Raw Benchmark Dataset Downloads ({benchmarks.length})</h3>
          <Badge variant="cyan" size="sm">CSV Format</Badge>
        </div>

        {benchmarks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Session Code</th>
                  <th className="py-3 px-5">Iterations</th>
                  <th className="py-3 px-5">Payload Size</th>
                  <th className="py-3 px-5">CPU Processor</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {benchmarks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 font-bold text-cyan-400">{b.session_code}</td>
                    <td className="py-3 px-5 text-slate-300">{b.iterations}</td>
                    <td className="py-3 px-5 text-slate-300">{b.payload_size_bytes} Bytes</td>
                    <td className="py-3 px-5 font-sans text-slate-400 text-[11px] truncate max-w-[200px]">{b.cpu_model}</td>
                    <td className="py-3 px-5 font-sans text-slate-400 text-[11px]">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-right font-sans">
                      <a
                        href={`/api/benchmark/export/${b.id}/csv`}
                        download
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No raw benchmark sessions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
