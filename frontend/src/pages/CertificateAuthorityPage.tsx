import React, { useEffect, useState } from 'react';
import { Building2, Plus, Download, ShieldCheck, FileCheck, Calendar, ArrowRight, FileText } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../api/client';
import { CertificateAuthority } from '../types';

export const CertificateAuthorityPage: React.FC = () => {
  const [cas, setCas] = useState<CertificateAuthority[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [algorithm, setAlgorithm] = useState('RSA-2048');
  const [commonName, setCommonName] = useState('QuantumShield Research Root CA');
  const [organization, setOrganization] = useState('QuantumShield Evaluation Laboratory');
  const [organizationalUnit, setOrganizationalUnit] = useState('Cryptography Division');
  const [country, setCountry] = useState('US');
  const [validityDays, setValidityDays] = useState(3650);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCAs = async () => {
    try {
      setLoading(true);
      const data = await api.getCAs();
      setCas(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCAs();
  }, []);

  const handleCreateCA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      await api.createCA({
        name: name.trim(),
        algorithm,
        common_name: commonName.trim(),
        organization: organization.trim(),
        organizational_unit: organizationalUnit.trim() || undefined,
        country: country.trim().toUpperCase(),
        validity_days: Number(validityDays),
      });
      setIsModalOpen(false);
      setName('');
      await loadCAs();
    } catch (err: any) {
      setError(err.message || 'CA creation failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Certificate Authority (Root CA)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Establish trust anchors and manage self-signed X.509 v3 Root Certificate Authorities.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create Root CA</span>
        </button>
      </div>

      {/* CAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cas.map((ca) => (
          <div key={ca.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{ca.name}</h3>
                  <p className="text-xs font-mono text-cyan-400">Serial: {ca.serial_number}</p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">Active Root</Badge>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold tracking-wider">Subject DN</span>
                <span className="text-slate-300 break-all">{ca.subject_dn}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-500 font-sans">Valid From:</span>
                <span className="text-slate-300">{new Date(ca.valid_from).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Valid Until:</span>
                <span className="text-slate-300">{new Date(ca.valid_to).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">CRL Revision:</span>
                <span className="text-cyan-400 font-bold">#{ca.crl_number}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`data:application/x-pem-file;charset=utf-8,${encodeURIComponent(ca.certificate_pem)}`}
                download={`${ca.name}_root.pem`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download CA Cert</span>
              </a>
              <a
                href={`/api/classical/cas/${ca.id}/crl`}
                download
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                <span>Download CRL</span>
              </a>
            </div>
          </div>
        ))}

        {cas.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No Certificate Authorities Created</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a self-signed Root CA to begin issuing and managing standard X.509 end-entity certificates.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Root CA</span>
            </button>
          </div>
        )}
      </div>

      {/* Create CA Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Root Certificate Authority"
        subtitle="Generates a self-signed X.509 v3 root certificate with KeyCertSign and CRLSign extensions"
      >
        <form onSubmit={handleCreateCA} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              CA Friendly Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Root CA 2026"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Key Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="RSA-2048">RSA-2048</option>
                <option value="ECDSA-P256">ECDSA P-256</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Validity (Days)
              </label>
              <input
                type="number"
                min="30"
                max="7300"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Common Name (CN)
            </label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
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
                Country (C)
              </label>
              <input
                type="text"
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none uppercase"
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
              disabled={creating}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {creating && <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{creating ? 'Issuing Root CA...' : 'Create Root CA'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
