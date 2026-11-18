import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Play, AlertOctagon, CheckCircle2,
  XCircle, Clock, Zap, ArrowRight, RefreshCw, FileText, Ban,
  Atom, Cpu, Binary, Unlock, Lock, AlertTriangle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { api } from '../api/client';
import { AttackSimulationRecord, QuantumAttackResult } from '../types';

export const AttackSimulationPage: React.FC = () => {
  const [history, setHistory] = useState<AttackSimulationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlgo, setSelectedAlgo] = useState<'ML-DSA-44' | 'RSA-2048' | 'ECDSA-P256'>('ML-DSA-44');
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<AttackSimulationRecord | null>(null);

  // Quantum Attack State
  const [quantumTarget, setQuantumTarget] = useState<'toy_rsa' | 'rsa_2048' | 'ecdsa_p256' | 'mldsa_44'>('toy_rsa');
  const [toyRsaBits, setToyRsaBits] = useState<number>(16);
  const [runningQuantum, setRunningQuantum] = useState(false);
  const [quantumResult, setQuantumResult] = useState<QuantumAttackResult | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getAttackHistory();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runTest = async (testType: string) => {
    try {
      setRunningTest(testType);
      const res = await api.simulateAttack(testType, selectedAlgo);
      setLatestResult(res);
      await loadHistory();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setRunningTest(null);
    }
  };

  const handleRunQuantumAttack = async () => {
    try {
      setRunningQuantum(true);
      const res = await api.runQuantumAttack(quantumTarget, toyRsaBits);
      setQuantumResult(res);
      await loadHistory();
    } catch (err: any) {
      alert(`Quantum attack execution failed: ${err.message}`);
    } finally {
      setRunningQuantum(false);
    }
  };

  const testSuites = [
    {
      id: 'document_tamper',
      code: 'TEST-1',
      title: 'Document Bit-Tampering Attack',
      description: 'Mutates document payload bytes post-signature and evaluates whether signature verification fails as required.',
      expected: 'VERIFICATION_FAILURE',
      type: 'Integrity',
    },
    {
      id: 'signature_tamper',
      code: 'TEST-2',
      title: 'Signature Payload Tampering Attack',
      description: 'Mutates random bits inside the detached cryptographic signature buffer and verifies whether signature forgery is detected.',
      expected: 'VERIFICATION_FAILURE',
      type: 'Authentication',
    },
    {
      id: 'wrong_key',
      code: 'TEST-3',
      title: 'Wrong Public Key Substitution Attack',
      description: 'Generates a genuine signature with Key Pair A and attempts verification using distinct Public Key B of identical algorithm family.',
      expected: 'VERIFICATION_FAILURE',
      type: 'Identity',
    },
    {
      id: 'invalid_sig',
      code: 'TEST-4',
      title: 'Invalid / Random Entropy Signature',
      description: 'Feeds random byte noise of expected signature length into the cryptographic engine to verify mathematical boundary rejection.',
      expected: 'VERIFICATION_FAILURE',
      type: 'Robustness',
    },
    {
      id: 'cert_validation',
      code: 'TEST-5',
      title: 'Certificate Validation & Revocation Test',
      description: 'Evaluates X.509 certificate chain validation, untrusted CA rejection, expired validity dates, and CRL revocation enforcement.',
      expected: 'VERIFICATION_FAILURE',
      type: 'Trust Chain',
    },
    {
      id: 'migration_demo',
      code: 'TEST-6',
      title: 'Algorithm Migration Comparison Demonstration',
      description: 'Comparative execution across Classical (RSA-2048) and Post-Quantum (ML-DSA-44) analyzing signature sizes, speed, and theoretical quantum resilience.',
      expected: 'MIGRATION_VALIDATED',
      type: 'Migration',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
              Security Testing & Cryptanalysis Laboratory
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-1">
            Attack Simulation & Quantum Cryptanalysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute simulated Shor's quantum attacks against classical PKI (RSA/ECDSA) and verify post-quantum immunity on ML-DSA-44.
          </p>
        </div>

        {/* Algorithm selector for classical tests */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Standard Test Algo:</span>
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['ML-DSA-44', 'RSA-2048', 'ECDSA-P256'] as const).map((algo) => (
              <button
                key={algo}
                onClick={() => setSelectedAlgo(algo)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedAlgo === algo ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SPECIAL RESEARCH SECTION: QUANTUM CRYPTANALYSIS (SHOR'S ALGORITHM) */}
      <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-slate-950 via-[#0B132B] to-slate-950 p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Atom className="h-6 w-6 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Quantum Attack Laboratory: Shor's Period-Finding</h3>
                <Badge variant="cyan" size="sm">Quantum Simulator</Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulate quantum period-finding factorization to recover private keys, forge signatures, and evaluate ML-DSA immunity.
              </p>
            </div>
          </div>
        </div>

        {/* Target Selection & Attack Runner */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setQuantumTarget('toy_rsa')}
            className={`p-4 rounded-xl border text-left transition-all ${
              quantumTarget === 'toy_rsa'
                ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Live Shor's Attack on RSA</span>
              <Unlock className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Live order-finding simulation. Factors N into p & q, extracts private key d, and forges signature!
            </p>
          </button>

          <button
            type="button"
            onClick={() => setQuantumTarget('rsa_2048')}
            className={`p-4 rounded-xl border text-left transition-all ${
              quantumTarget === 'rsa_2048'
                ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Full RSA-2048 Model</span>
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Gidney-Ekerå 2021 model: 4,098 logical qubits, 20M physical qubits, breaks in ~7.8 hours on CRQC.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setQuantumTarget('ecdsa_p256')}
            className={`p-4 rounded-xl border text-left transition-all ${
              quantumTarget === 'ecdsa_p256'
                ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">ECDSA P-256 Model</span>
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Roetteler model: 2,330 logical qubits. Solves discrete logarithm problem in ~9.2 minutes on CRQC.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setQuantumTarget('mldsa_44')}
            className={`p-4 rounded-xl border text-left transition-all ${
              quantumTarget === 'mldsa_44'
                ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">ML-DSA-44 Immunity Test</span>
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Attempts lattice reduction. Verifies quantum resistance: requires &gt; 2^128 gates (&gt;10^22 years)!
            </p>
          </button>
        </div>

        {/* Attack Parameters & Execution Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-4 text-xs">
            {quantumTarget === 'toy_rsa' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Modulus Key Size:</span>
                <select
                  value={toyRsaBits}
                  onChange={(e) => setToyRsaBits(Number(e.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                >
                  <option value={12}>12 bits (Fastest, &lt;1 ms)</option>
                  <option value={16}>16 bits (Standard demo, ~1-3 ms)</option>
                  <option value={20}>20 bits (~5-15 ms)</option>
                  <option value={24}>24 bits (~20-80 ms)</option>
                </select>
              </div>
            )}
            <span className="text-slate-500 text-[11px]">
              {quantumTarget === 'toy_rsa'
                ? 'Simulates quantum register phase estimation & order finding to crack N = p * q'
                : quantumTarget === 'mldsa_44'
                ? 'Tests quantum sieving against M-LWE/M-SIS non-abelian lattice problems'
                : 'Evaluates fault-tolerant quantum computer requirements under Shor’s algorithm'}
            </span>
          </div>

          <button
            onClick={handleRunQuantumAttack}
            disabled={runningQuantum}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/25 hover:from-rose-500 hover:to-purple-500 disabled:opacity-50 transition-all"
          >
            {runningQuantum ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-current text-yellow-300" />
            )}
            <span>
              {runningQuantum
                ? 'Executing Quantum Cryptanalysis...'
                : `Launch Quantum Attack on ${quantumTarget.toUpperCase()}`}
            </span>
          </button>
        </div>

        {/* Live Attack Outcome Display */}
        {quantumResult && (
          <div className="space-y-4 animate-in fade-in">
            {/* Outcome Banner */}
            <div
              className={`p-5 rounded-2xl border ${
                quantumResult.defense_passed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-rose-500/50 bg-rose-950/25 text-rose-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {quantumResult.defense_passed ? (
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400 border border-rose-500/30">
                      <AlertOctagon className="h-7 w-7" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">
                        {quantumResult.defense_passed
                          ? 'ATTACK FAILED: QUANTUM RESISTANT (IMMUNE)'
                          : 'ATTACK SUCCESS: ALGORITHM CRACKED!'}
                      </h4>
                      <Badge variant={quantumResult.defense_passed ? 'emerald' : 'rose'} size="sm">
                        {quantumResult.status}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-90 mt-0.5">
                      Target: {quantumResult.target_algorithm} | {quantumResult.attack_name}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400">Quantum Execution Time:</div>
                  <div className="text-lg font-bold text-white">
                    {quantumResult.estimated_quantum_runtime
                      ? quantumResult.estimated_quantum_runtime
                      : `${quantumResult.execution_duration_ms.toFixed(3)} ms`}
                  </div>
                </div>
              </div>
            </div>

            {/* If Key Was Cracked: Show Recovered Cryptographic Secrets! */}
            {!quantumResult.defense_passed && quantumResult.recovered_private_key_d && (
              <div className="p-5 rounded-xl border border-rose-500/30 bg-slate-950/80 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-rose-400 font-sans font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Unlock className="h-4 w-4" />
                    <span>Recovered Private Key & Factored Primes</span>
                  </span>
                  <Badge variant="rose" size="sm">
                    {quantumResult.quantum_iterations} Quantum Queries
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Public Modulus (N)</span>
                    <span className="text-white font-bold">{quantumResult.modulus_n}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Factored Prime (p)</span>
                    <span className="text-emerald-400 font-bold">{quantumResult.recovered_prime_p}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Factored Prime (q)</span>
                    <span className="text-emerald-400 font-bold">{quantumResult.recovered_prime_q}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Cracked Private Exponent (d)</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      d = {quantumResult.recovered_private_key_d}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Signature Forgery Verification</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Forged Signature Validated Mathematically!</span>
                    </span>
                  </div>
                </div>

                {quantumResult.forged_signature_sample && (
                  <div className="p-2.5 rounded-lg bg-slate-900/60 text-[11px] text-slate-300">
                    <span className="text-slate-500 font-sans font-semibold mr-2">Forged Signature Sample:</span>
                    {quantumResult.forged_signature_sample}
                  </div>
                )}
              </div>
            )}

            {/* If Full Resource Estimation (RSA-2048, ECDSA, or ML-DSA) */}
            {quantumResult.logical_qubits_required !== undefined && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Logical Qubits</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {quantumResult.logical_qubits_required.toLocaleString()} Qubits
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Physical Qubits</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {quantumResult.physical_qubits_required ? `${(quantumResult.physical_qubits_required / 1e6).toFixed(1)}M Qubits` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Time to Break</span>
                  <span className={`font-bold text-sm ${quantumResult.defense_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {quantumResult.estimated_quantum_runtime}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold block">Quantum Security</span>
                  <span className="text-white font-bold text-sm truncate block">
                    {quantumResult.security_level_quantum}
                  </span>
                </div>
              </div>
            )}

            {/* Thesis Research Explanation */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-slate-300 leading-relaxed space-y-2">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider block">
                Academic & Cryptographic Analysis:
              </span>
              <p>{quantumResult.theoretical_notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* STANDARD TAMPERING & SECURITY ATTACKS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Controlled Cryptographic Defense Laboratory</h3>
            <p className="text-xs text-slate-400">
              Evaluates bit-tampering, mutated signatures, key mismatches, and certificate revocation.
            </p>
          </div>
          <Badge variant="rose" size="sm">6 Automated Tests</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testSuites.map((suite) => {
            const isRunning = runningTest === suite.id;
            return (
              <div
                key={suite.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {suite.code}
                    </span>
                    <Badge variant="rose" size="sm">{suite.type}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{suite.title}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{suite.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Expected:</span>
                    <span className="text-slate-300 font-medium">{suite.expected}</span>
                  </div>
                  <button
                    onClick={() => runTest(suite.id)}
                    disabled={isRunning}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    {isRunning ? (
                      <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-rose-400 fill-current" />
                    )}
                    <span>{isRunning ? 'Simulating Attack...' : `Execute Attack on ${selectedAlgo}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attack Simulation History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">Attack Simulation Audit Log ({history.length})</h3>
          </div>
          <button
            onClick={loadHistory}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Test ID & Name</th>
                  <th className="py-3 px-5">Algorithm</th>
                  <th className="py-3 px-5">Target</th>
                  <th className="py-3 px-5">Defense Result</th>
                  <th className="py-3 px-5">Duration</th>
                  <th className="py-3 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 font-sans">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400">{h.test_id}</span>
                        <span>{h.test_name}</span>
                      </div>
                      {h.tamper_details && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[280px] truncate" title={h.tamper_details}>
                          {h.tamper_details}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={h.algorithm.includes('ML-DSA') ? 'cyan' : 'blue'} size="sm">
                        {h.algorithm}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-slate-400 font-sans text-[11px] max-w-[180px] truncate">
                      {h.target_description}
                    </td>
                    <td className="py-3 px-5 font-sans">
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                        h.defense_passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {h.defense_passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        <span>{h.defense_passed ? 'Attack Detected (Passed)' : 'Compromised / Cracked'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-300">{h.execution_duration_ms.toFixed(3)} ms</td>
                    <td className="py-3 px-5 text-right font-sans text-slate-400 text-[11px]">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No attack simulations recorded yet. Run a test above to evaluate cryptographic defenses.
          </div>
        )}
      </div>
    </div>
  );
};
