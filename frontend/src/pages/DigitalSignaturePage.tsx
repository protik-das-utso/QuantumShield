import React, { useEffect, useState } from 'react';
import {
  FileSignature, Upload, CheckCircle2, XCircle, Download, KeyRound,
  FileText, ShieldCheck, Clock, Hash, ArrowRight, RefreshCw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { KeyPair, SignatureRecord, VerifySignatureResult } from '../types';

export const DigitalSignaturePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sign' | 'verify' | 'history'>('sign');
  const [classicalKeys, setClassicalKeys] = useState<KeyPair[]>([]);
  const [pqcKeys, setPqcKeys] = useState<KeyPair[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Signing form state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docContent, setDocContent] = useState<string>('Contract Agreement / Research Thesis Protocol v1.0');
  const [docName, setDocName] = useState<string>('thesis_agreement.txt');
  const [selectedAlgo, setSelectedAlgo] = useState<'RSA-2048' | 'ECDSA-P256' | 'ML-DSA-44'>('ML-DSA-44');
  const [selectedKeyId, setSelectedKeyId] = useState<number>(0);
  const [signing, setSigning] = useState(false);
  const [signResult, setSignResult] = useState<SignatureRecord | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  // Verification form state
  const [verifyDocContent, setVerifyDocContent] = useState<string>('');
  const [verifySigBase64, setVerifySigBase64] = useState<string>('');
  const [verifyAlgo, setVerifyAlgo] = useState<'RSA-2048' | 'ECDSA-P256' | 'ML-DSA-44'>('ML-DSA-44');
  const [verifyKeyId, setVerifyKeyId] = useState<number>(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifySignatureResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ck, pk, sigs] = await Promise.all([
        api.getClassicalKeys(),
        api.getPqcKeys(),
        api.getSignatures(),
      ]);
      setClassicalKeys(ck);
      setPqcKeys(pk);
      setSignatures(sigs);

      // Default selected key
      if (selectedAlgo === 'ML-DSA-44' && pk.length > 0 && selectedKeyId === 0) {
        setSelectedKeyId(pk[0].id);
      } else if (selectedAlgo !== 'ML-DSA-44' && ck.length > 0 && selectedKeyId === 0) {
        const match = ck.find((k) => k.algorithm === selectedAlgo);
        if (match) setSelectedKeyId(match.id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected key when algorithm changes
  useEffect(() => {
    if (selectedAlgo === 'ML-DSA-44') {
      if (pqcKeys.length > 0) setSelectedKeyId(pqcKeys[0].id);
      else setSelectedKeyId(0);
    } else {
      const match = classicalKeys.find((k) => k.algorithm === selectedAlgo);
      if (match) setSelectedKeyId(match.id);
      else setSelectedKeyId(0);
    }
  }, [selectedAlgo, classicalKeys, pqcKeys]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDocContent(result);
    };
    reader.readAsText(file);
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyId || !docContent) return;

    try {
      setSigning(true);
      setSignError(null);
      setSignResult(null);

      // Convert content to base64
      const base64Doc = btoa(unescape(encodeURIComponent(docContent)));
      const res = await api.signDocument(selectedKeyId, base64Doc, docName);
      setSignResult(res);
      await loadData();
    } catch (err: any) {
      setSignError(err.message || 'Signing failed');
    } finally {
      setSigning(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyDocContent || !verifySigBase64 || !verifyKeyId) return;

    try {
      setVerifying(true);
      setVerifyError(null);
      setVerifyResult(null);

      const base64Doc = btoa(unescape(encodeURIComponent(verifyDocContent)));
      const res = await api.verifySignature({
        document_base64: base64Doc,
        signature_base64: verifySigBase64.trim(),
        key_id: verifyKeyId,
        algorithm: verifyAlgo,
      });
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const copyToVerify = (sig: SignatureRecord) => {
    setVerifySigBase64(sig.signature_bytes_b64);
    setVerifyAlgo(sig.algorithm as any);
    if (sig.key_id) setVerifyKeyId(sig.key_id);
    setActiveTab('verify');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Digital Document Signing & Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign documents with RSA-2048 (PSS), ECDSA (P-256), and NIST FIPS 204 (ML-DSA-44 Pure Mode).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('sign')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sign' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Document
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'verify' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verify Signature
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Signature Log ({signatures.length})
          </button>
        </div>
      </div>

      {/* SIGN TAB */}
      {activeTab === 'sign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-sm font-semibold text-white">Document Payload & Signing Parameters</h3>

            <form onSubmit={handleSign} className="space-y-4">
              {signError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                  {signError}
                </div>
              )}

              {/* Algorithm Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Signing Algorithm
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['ML-DSA-44', 'RSA-2048', 'ECDSA-P256'] as const).map((algo) => (
                    <button
                      key={algo}
                      type="button"
                      onClick={() => setSelectedAlgo(algo)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedAlgo === algo
                          ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>{algo}</span>
                        {algo === 'ML-DSA-44' && <Badge variant="cyan" size="sm">PQC</Badge>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {algo === 'ML-DSA-44'
                          ? 'FIPS 204 (2,420B sig)'
                          : algo === 'RSA-2048'
                          ? 'PSS + SHA-256 (256B sig)'
                          : 'ECDSA + SHA-256 (64B sig)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Private Key
                </label>
                <select
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {selectedAlgo === 'ML-DSA-44' ? (
                    pqcKeys.length > 0 ? (
                      pqcKeys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.alias} (FIPS 204 ML-DSA-44)
                        </option>
                      ))
                    ) : (
                      <option value={0}>No ML-DSA-44 keys available (Generate one in PQC module)</option>
                    )
                  ) : (
                    classicalKeys
                      .filter((k) => k.algorithm === selectedAlgo)
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.alias} ({k.algorithm})
                        </option>
                      ))
                  )}
                </select>
              </div>

              {/* File upload or text */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Document Filename
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Attach Local File (PDF, DOCX, TXT)
                  </label>
                  <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 cursor-pointer hover:border-cyan-500 hover:text-white transition-colors">
                    <Upload className="h-4 w-4 text-cyan-400" />
                    <span className="truncate">{docFile ? docFile.name : 'Upload File...'}</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Document Payload (Raw Text / Pre-image Bytes)
                </label>
                <textarea
                  rows={4}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={signing || selectedKeyId === 0 || !docContent}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
                >
                  {signing && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  <FileSignature className="h-4 w-4" />
                  <span>{signing ? 'Cryptographically Signing...' : `Sign with ${selectedAlgo}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Result / Receipt Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">Signature Output & Metadata</h3>

            {signResult ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide">Signature Generated</div>
                      <div className="text-[10px] opacity-80">{signResult.signing_duration_ms.toFixed(3)} ms execution</div>
                    </div>
                  </div>
                  <Badge variant="emerald" size="sm">VALID</Badge>
                </div>

                <div className="space-y-2 text-xs font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-500 font-sans">Algorithm:</span>
                    <span className="text-cyan-400 font-bold">{signResult.algorithm}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-500 font-sans">Signature Size:</span>
                    <span className="text-slate-200">{signResult.signature_size_bytes} Bytes</span>
                  </div>
                  <div className="flex flex-col gap-0.5 py-1 border-b border-slate-800/80">
                    <span className="text-slate-500 font-sans text-[10px] uppercase font-semibold">Document SHA-256</span>
                    <span className="text-slate-300 text-[10px] break-all">{signResult.document_hash_sha256}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-slate-500 font-sans text-[10px] uppercase font-semibold">Signer Fingerprint</span>
                    <span className="text-cyan-400 text-[10px] break-all">{signResult.public_key_fingerprint}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Detached Signature (Base64)</span>
                  <textarea
                    readOnly
                    rows={4}
                    value={signResult.signature_bytes_b64}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-[10px] text-slate-300 font-mono select-all focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/api/signatures/${signResult.id}/download`}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Download .sig File</span>
                  </a>
                  <button
                    onClick={() => copyToVerify(signResult)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  >
                    <span>Send to Verifier</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                <FileSignature className="mx-auto h-8 w-8 text-slate-700 mb-2" />
                Select an algorithm, provide a document payload, and click Sign to view the cryptographic signature receipt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERIFY TAB */}
      {activeTab === 'verify' && (
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-5">
          <h3 className="text-sm font-semibold text-white">Cryptographic Signature Verification</h3>

          <form onSubmit={handleVerify} className="space-y-4">
            {verifyError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {verifyError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Expected Algorithm
                </label>
                <select
                  value={verifyAlgo}
                  onChange={(e) => setVerifyAlgo(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ML-DSA-44">ML-DSA-44 (NIST FIPS 204)</option>
                  <option value="RSA-2048">RSA-2048 (PSS / SHA-256)</option>
                  <option value="ECDSA-P256">ECDSA P-256</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Verification Public Key
                </label>
                <select
                  value={verifyKeyId}
                  onChange={(e) => setVerifyKeyId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {verifyAlgo === 'ML-DSA-44'
                    ? pqcKeys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.alias} (ML-DSA-44)
                        </option>
                      ))
                    : classicalKeys
                        .filter((k) => k.algorithm === verifyAlgo)
                        .map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.alias} ({k.algorithm})
                          </option>
                        ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Original Document Content (To Verify)
              </label>
              <textarea
                rows={3}
                required
                value={verifyDocContent}
                onChange={(e) => setVerifyDocContent(e.target.value)}
                placeholder="Enter exact document content..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Detached Signature (Base64)
              </label>
              <textarea
                rows={4}
                required
                value={verifySigBase64}
                onChange={(e) => setVerifySigBase64(e.target.value)}
                placeholder="Paste base64 signature bytes here..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={verifying || !verifyDocContent || !verifySigBase64 || !verifyKeyId}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
              >
                {verifying && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                <ShieldCheck className="h-4 w-4" />
                <span>{verifying ? 'Verifying Math...' : 'Verify Cryptographic Signature'}</span>
              </button>
            </div>
          </form>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-4 rounded-xl border ${
                verifyResult.is_valid
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              } animate-in fade-in`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {verifyResult.is_valid ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">
                      {verifyResult.is_valid ? 'Signature Valid – Document Authenticated' : 'Signature Verification Failed'}
                    </h4>
                    <p className="text-[11px] opacity-90 mt-0.5">{verifyResult.message}</p>
                    <p className="text-[10px] opacity-75 font-mono mt-1">
                      Computed SHA-256: {verifyResult.document_hash_sha256} | Verified in {verifyResult.verification_duration_ms.toFixed(3)} ms
                    </p>
                  </div>
                </div>
                <Badge variant={verifyResult.is_valid ? 'emerald' : 'rose'} size="md">
                  {verifyResult.is_valid ? 'AUTHENTIC' : 'INVALID'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Cryptographic Signature Audit Log</h3>
            <Badge variant="cyan" size="sm">{signatures.length} Records</Badge>
          </div>

          {signatures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Document</th>
                    <th className="py-3 px-5">Algorithm</th>
                    <th className="py-3 px-5">Doc Digest (SHA-256)</th>
                    <th className="py-3 px-5">Signature Size</th>
                    <th className="py-3 px-5">Signing Latency</th>
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {signatures.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-5 font-sans font-medium text-white">{s.document_name}</td>
                      <td className="py-3 px-5">
                        <Badge variant={s.algorithm === 'ML-DSA-44' ? 'cyan' : 'blue'} size="sm">
                          {s.algorithm}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-slate-400 text-[10px] max-w-[150px] truncate" title={s.document_hash_sha256}>
                        {s.document_hash_sha256}
                      </td>
                      <td className="py-3 px-5 text-slate-300">{s.signature_size_bytes} B</td>
                      <td className="py-3 px-5 text-slate-400">{s.signing_duration_ms.toFixed(3)} ms</td>
                      <td className="py-3 px-5 text-slate-400 font-sans text-[11px]">{new Date(s.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-5 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToVerify(s)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                            title="Verify in Verifier"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <a
                            href={`/api/signatures/${s.id}/download`}
                            download
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Download .sig"
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
            <div className="p-12 text-center text-xs text-slate-500">
              No signatures created yet. Use the 'Sign Document' tab to sign your first document.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
