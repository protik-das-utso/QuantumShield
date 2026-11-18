import React, { useEffect, useState } from 'react';
import {
  FileCheck, Plus, Download, ShieldCheck, AlertTriangle, XCircle,
  CheckCircle2, RefreshCw, Eye, Ban, Calendar
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { Certificate, CertificateAuthority, KeyPair, CertificateVerifyResult } from '../types';

export const CertificateManagerPage: React.FC = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [cas, setCas] = useState<CertificateAuthority[]>([]);
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [verifyResult, setVerifyResult] = useState<CertificateVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Form states
  const [selectedCaId, setSelectedCaId] = useState<number>(0);
  const [selectedKeyId, setSelectedKeyId] = useState<number>(0);
  const [commonName, setCommonName] = useState('server.research.lab');
  const [organization, setOrganization] = useState('End Entity Research');
  const [validityDays, setValidityDays] = useState(365);
  const [dnsSan, setDnsSan] = useState('server.research.lab, api.research.lab');
  const [issuing, setIssuing] = useState(false);
  const [revocationReason, setRevocationReason] = useState('keyCompromise');
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, caData, kData] = await Promise.all([
        api.getCertificates(),
        api.getCAs(),
        api.getClassicalKeys(),
      ]);
      setCerts(cData);
      setCas(caData);
      setKeys(kData);
      if (caData.length > 0 && selectedCaId === 0) setSelectedCaId(caData[0].id);
      if (kData.length > 0 && selectedKeyId === 0) setSelectedKeyId(kData[0].id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaId || !selectedKeyId) return;

    try {
      setIssuing(true);
      setError(null);
      const sanList = dnsSan.split(',').map((s) => s.trim()).filter(Boolean);
      await api.issueCertificate({
        ca_id: selectedCaId,
        key_id: selectedKeyId,
        common_name: commonName.trim(),
        organization: organization.trim(),
        validity_days: Number(validityDays),
        dns_san: sanList.length > 0 ? sanList : undefined,
      });
      setIsIssueModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Certificate issuance failed');
    } finally {
      setIssuing(false);
    }
  };

  const handleVerify = async (cert: Certificate) => {
    setSelectedCert(cert);
    setIsDetailModalOpen(true);
    try {
      setVerifying(true);
      const res = await api.verifyCertificate(cert.id);
      setVerifyResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedCert) return;
    try {
      setRevoking(true);
      await api.revokeCertificate(selectedCert.id, revocationReason);
      setIsRevokeModalOpen(false);
      setIsDetailModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">X.509 Certificate Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Issue, inspect, cryptographically verify, and revoke end-entity X.509 certificates.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsIssueModalOpen(true);
          }}
          disabled={cas.length === 0 || keys.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Issue New Certificate</span>
        </button>
      </div>

      {/* Warning if no CA or Keys */}
      {cas.length === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>Please create at least one Root CA in the Certificate Authority tab before issuing certificates.</span>
        </div>
      )}

      {/* Certificates Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Issued Certificates ({certs.length})</h3>
          </div>
          <Badge variant="cyan" size="sm">X.509 v3 Standard</Badge>
        </div>

        {certs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Common Name & Serial</th>
                  <th className="py-3 px-5">Validity Period</th>
                  <th className="py-3 px-5">Cert Size</th>
                  <th className="py-3 px-5">Issuance Latency</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {certs.map((c) => {
                  const isExpired = new Date(c.valid_to) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5 font-sans">
                        <div className="font-semibold text-white">{c.common_name}</div>
                        <div className="text-[11px] font-mono text-cyan-400">{c.serial_number}</div>
                      </td>
                      <td className="py-3.5 px-5 font-sans text-slate-300 text-[11px]">
                        <div>From: {new Date(c.valid_from).toLocaleDateString()}</div>
                        <div>To: {new Date(c.valid_to).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300">{c.cert_size_bytes} B</td>
                      <td className="py-3.5 px-5 text-slate-400">{c.issuance_duration_ms.toFixed(3)} ms</td>
                      <td className="py-3.5 px-5 font-sans">
                        {c.is_revoked ? (
                          <Badge variant="rose" size="sm">Revoked ({c.revocation_reason})</Badge>
                        ) : isExpired ? (
                          <Badge variant="amber" size="sm">Expired</Badge>
                        ) : (
                          <Badge variant="emerald" size="sm">Valid & Trusted</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerify(c)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Inspect</span>
                          </button>
                          <a
                            href={`/api/classical/certificates/${c.id}/download?format=pem`}
                            download
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Download PEM"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileCheck className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No Certificates Issued Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Issue an end-entity certificate signed by an active Root CA for client/server authentication or digital signatures.
            </p>
          </div>
        )}
      </div>

      {/* Issue Certificate Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue End-Entity Certificate"
        subtitle="Signs a new X.509 certificate with Subject Key Identifier, SANs, and KeyUsage extensions"
      >
        <form onSubmit={handleIssueCert} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Issuing Root CA
            </label>
            <select
              value={selectedCaId}
              onChange={(e) => setSelectedCaId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {cas.map((ca) => (
                <option key={ca.id} value={ca.id}>
                  {ca.name} (Serial: {ca.serial_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Subject Public Key
            </label>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.alias} ({k.algorithm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Common Name (CN) / Hostname
            </label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="e.g. auth.node1.local"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject Alternative Names (DNS SAN - Comma separated)
            </label>
            <input
              type="text"
              value={dnsSan}
              onChange={(e) => setDnsSan(e.target.value)}
              placeholder="e.g. node1.local, api.node1.local"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organization (O)
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="1825"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issuing}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {issuing && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{issuing ? 'Signing Certificate...' : 'Issue Certificate'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Certificate Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="X.509 Certificate Inspector & Verification"
        subtitle={`Serial: ${selectedCert?.serial_number}`}
        maxWidth="2xl"
      >
        {selectedCert && (
          <div className="space-y-4">
            {/* Live Verification Status Card */}
            <div className={`p-4 rounded-xl border ${
              verifyResult?.overall_valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {verifyResult?.overall_valid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">
                      {verifyResult?.overall_valid ? 'Certificate Signature & Trust Valid' : 'Certificate Verification Failed'}
                    </h4>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Verified cryptographic signature against CA trust anchor in {verifyResult?.validation_duration_ms.toFixed(3) || '0'} ms
                    </p>
                  </div>
                </div>
                <Badge variant={verifyResult?.overall_valid ? 'emerald' : 'rose'} size="sm">
                  {verifyResult?.overall_valid ? 'TRUSTED' : 'UNTRUSTED'}
                </Badge>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-semibold">Common Name</span>
                <span className="text-white font-sans font-medium">{selectedCert.common_name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-semibold">DER Size</span>
                <span className="text-slate-300">{selectedCert.cert_size_bytes} Bytes</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-semibold">Subject DN</span>
                <span className="text-slate-300 break-all">{selectedCert.subject_dn}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-semibold">Issuer DN</span>
                <span className="text-slate-300 break-all">{selectedCert.issuer_dn}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-sans block text-[10px] uppercase font-semibold">Thumbprint (SHA-256)</span>
                <span className="text-cyan-400 break-all">{selectedCert.fingerprint_sha256}</span>
              </div>
            </div>

            {/* Certificate PEM */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Encoded X.509 Certificate (PEM)</span>
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                {selectedCert.certificate_pem}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                {!selectedCert.is_revoked && (
                  <button
                    onClick={() => setIsRevokeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Revoke Certificate</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/classical/certificates/${selectedCert.id}/download?format=pem`}
                  download
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Download PEM
                </a>
                <a
                  href={`/api/classical/certificates/${selectedCert.id}/download?format=der`}
                  download
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Download DER
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Revocation Confirmation Modal */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title="Revoke X.509 Certificate"
        subtitle={`Serial: ${selectedCert?.serial_number}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Revoking this certificate marks it permanently invalid in the local PKI registry and updates the Root CA's signed Certificate Revocation List (CRL).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              RFC 5280 Revocation Reason
            </label>
            <select
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="keyCompromise">Key Compromise (Private key exposed)</option>
              <option value="caCompromise">CA Compromise</option>
              <option value="affiliationChanged">Affiliation Changed</option>
              <option value="superseded">Superseded (Replaced by new cert)</option>
              <option value="cessationOfOperation">Cessation of Operation</option>
              <option value="certificateHold">Certificate Hold</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsRevokeModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500 disabled:opacity-50 transition-all"
            >
              {revoking ? 'Revoking...' : 'Confirm Revocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
