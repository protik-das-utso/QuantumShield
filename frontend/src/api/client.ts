import {
  SystemInfo, SystemStats, KeyPair, CertificateAuthority,
  Certificate, CertificateVerifyResult, SignatureRecord, VerifySignatureResult,
  AttackSimulationRecord, BenchmarkSession, ExperimentRecord, PqcTechnicalInfo,
  QuantumAttackResult
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errMsg;
    } catch {
      // no JSON body
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // System
  getSystemInfo: () => fetchJson<SystemInfo>('/system/info'),
  getSystemStats: () => fetchJson<SystemStats>('/system/stats'),

  // Classical PKI
  generateClassicalKey: (algorithm: string, alias: string, notes?: string) =>
    fetchJson<KeyPair>('/classical/generate-key', {
      method: 'POST',
      body: JSON.stringify({ algorithm, alias, notes }),
    }),
  getClassicalKeys: () => fetchJson<KeyPair[]>('/classical/keys'),
  createCA: (data: {
    name: string;
    algorithm: string;
    common_name: string;
    organization: string;
    organizational_unit?: string;
    country: string;
    state?: string;
    locality?: string;
    validity_days: number;
  }) =>
    fetchJson<CertificateAuthority>('/classical/create-ca', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCAs: () => fetchJson<CertificateAuthority[]>('/classical/cas'),
  issueCertificate: (data: {
    ca_id: number;
    key_id: number;
    common_name: string;
    organization?: string;
    organizational_unit?: string;
    country?: string;
    validity_days: number;
    dns_san?: string[];
  }) =>
    fetchJson<Certificate>('/classical/issue-certificate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCertificates: () => fetchJson<Certificate[]>('/classical/certificates'),
  verifyCertificate: (certId: number) =>
    fetchJson<CertificateVerifyResult>(`/classical/certificates/${certId}/verify`, {
      method: 'POST',
    }),
  revokeCertificate: (certId: number, reason: string) =>
    fetchJson<{ status: string; certificate_id: number; serial_number: string }>(
      `/classical/certificates/${certId}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({ certificate_id: certId, reason }),
      }
    ),

  // PQC (ML-DSA-44)
  generatePqcKey: (alias: string, notes?: string) =>
    fetchJson<KeyPair>('/pqc/generate-key', {
      method: 'POST',
      body: JSON.stringify({ algorithm: 'ML-DSA-44', alias, notes }),
    }),
  getPqcKeys: () => fetchJson<KeyPair[]>('/pqc/keys'),
  getPqcInfo: () => fetchJson<PqcTechnicalInfo>('/pqc/info'),

  // Digital Signatures
  signDocument: (key_id: number, document_base64: string, document_name: string) =>
    fetchJson<SignatureRecord>('/signatures/sign', {
      method: 'POST',
      body: JSON.stringify({ key_id, document_base64, document_name }),
    }),
  verifySignature: (data: {
    document_base64: string;
    signature_base64: string;
    key_id?: number;
    public_key_pem?: string;
    algorithm: string;
  }) =>
    fetchJson<VerifySignatureResult>('/signatures/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSignatures: () => fetchJson<SignatureRecord[]>('/signatures'),

  // Attack Simulation
  simulateAttack: (test_type: string, algorithm: string, key_id?: number, document_base64?: string, document_name?: string, cert_id?: number) => {
    let endpoint = '/attacks/document-tampering';
    if (test_type === 'signature_tamper') endpoint = '/attacks/signature-tampering';
    else if (test_type === 'wrong_key') endpoint = '/attacks/wrong-key';
    else if (test_type === 'invalid_sig') endpoint = '/attacks/invalid-sig';
    else if (test_type === 'cert_validation') endpoint = '/attacks/cert-validation';
    else if (test_type === 'migration_demo') endpoint = '/attacks/migration-demo';

    return fetchJson<AttackSimulationRecord>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ test_type, algorithm, key_id, document_base64, document_name, cert_id }),
    });
  },
  runQuantumAttack: (target_type: string, bits: number = 16) =>
    fetchJson<QuantumAttackResult>('/attacks/quantum-attack', {
      method: 'POST',
      body: JSON.stringify({ target_type, bits }),
    }),
  getAttackHistory: () => fetchJson<AttackSimulationRecord[]>('/attacks/history'),

  // Performance Benchmarking
  runBenchmark: (data: {
    algorithms: string[];
    iterations: number;
    warmup_runs: number;
    payload_size_bytes: number;
    notes?: string;
  }) =>
    fetchJson<BenchmarkSession>('/benchmark/run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBenchmarkResults: () => fetchJson<BenchmarkSession[]>('/benchmark/results'),

  // Experiments
  createExperiment: (data: {
    experiment_code?: string;
    title: string;
    description?: string;
    algorithms: string[];
    iterations: number;
    payload_size_bytes: number;
  }) =>
    fetchJson<ExperimentRecord>('/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getExperiments: () => fetchJson<ExperimentRecord[]>('/experiments'),
  getExperiment: (id: number) => fetchJson<ExperimentRecord>(`/experiments/${id}`),
};
