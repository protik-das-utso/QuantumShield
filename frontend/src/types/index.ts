export interface SystemInfo {
  os: string;
  processor: string;
  cpu_cores_physical: number;
  cpu_cores_logical: number;
  ram_total_gb: number;
  python_version: string;
  openssl_version: string;
  cryptography_version: string;
  mldsa_fips204_available: boolean;
  mldsa_engine: string;
}

export interface SystemStats {
  total_keys: number;
  classical_keys: number;
  pqc_keys: number;
  total_cas: number;
  total_certs: number;
  revoked_certs: number;
  total_signatures: number;
  total_attacks: number;
  attacks_detected: number;
  total_benchmarks: number;
  total_experiments: number;
}

export interface KeyPair {
  id: number;
  alias: string;
  algorithm: 'RSA-2048' | 'ECDSA-P256' | 'ML-DSA-44';
  key_family: 'classical' | 'pqc';
  public_key_pem?: string;
  public_key_raw_b64?: string;
  public_key_bytes_len: number;
  private_key_bytes_len: number;
  fingerprint_sha256: string;
  keygen_duration_ms: number;
  created_at: string;
  notes?: string;
}

export interface CertificateAuthority {
  id: number;
  name: string;
  key_id: number;
  certificate_pem: string;
  serial_number: string;
  subject_dn: string;
  issuer_dn: string;
  valid_from: string;
  valid_to: string;
  crl_number: number;
  is_active: boolean;
  created_at: string;
}

export interface Certificate {
  id: number;
  ca_id: number;
  key_id: number;
  serial_number: string;
  common_name: string;
  subject_dn: string;
  issuer_dn: string;
  certificate_pem: string;
  valid_from: string;
  valid_to: string;
  is_revoked: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  cert_size_bytes: number;
  issuance_duration_ms: number;
  fingerprint_sha256: string;
  created_at: string;
}

export interface CertificateVerifyResult {
  certificate_id: number;
  serial_number: string;
  is_signature_valid: boolean;
  is_time_valid: boolean;
  is_not_revoked: boolean;
  overall_valid: boolean;
  validation_duration_ms: number;
  details: Record<string, any>;
}

export interface SignatureRecord {
  id: number;
  key_id?: number;
  algorithm: string;
  document_name: string;
  document_size_bytes: number;
  document_hash_sha256: string;
  signature_bytes_b64: string;
  signature_size_bytes: number;
  signing_duration_ms: number;
  public_key_fingerprint: string;
  verification_status: string;
  created_at: string;
}

export interface VerifySignatureResult {
  is_valid: boolean;
  algorithm: string;
  verification_duration_ms: number;
  document_hash_sha256: string;
  signature_size_bytes: number;
  message: string;
}

export interface AttackSimulationRecord {
  id: number;
  test_id: string;
  test_name: string;
  algorithm: string;
  target_description: string;
  expected_result: string;
  actual_result: string;
  defense_passed: boolean;
  attack_status: string;
  tamper_details?: string;
  execution_duration_ms: number;
  timestamp: string;
}

export interface QuantumAttackResult {
  target_algorithm: string;
  attack_name: string;
  status: string;
  defense_passed: boolean;
  execution_duration_ms: number;
  quantum_iterations?: number;
  modulus_n?: string;
  public_exponent_e?: number;
  recovered_prime_p?: number;
  recovered_prime_q?: number;
  recovered_phi?: number;
  recovered_private_key_d?: number;
  signature_forged?: boolean;
  forged_signature_sample?: string;
  security_level_quantum?: string;
  mathematical_complexity?: string;
  logical_qubits_required?: number;
  physical_qubits_required?: number;
  toffoli_gates?: number;
  estimated_quantum_runtime?: string;
  theoretical_notes: string;
}

export interface BenchmarkMetric {
  algorithm: string;
  operation: string;
  mean_ms: number;
  median_ms: number;
  min_ms: number;
  max_ms: number;
  std_dev_ms: number;
  p95_ms: number;
  public_key_bytes?: number;
  private_key_bytes?: number;
  signature_bytes?: number;
  certificate_bytes?: number;
  raw_durations_ns?: number[];
}

export interface BenchmarkSession {
  id: number;
  session_code: string;
  name: string;
  iterations: number;
  warmup_runs: number;
  payload_size_bytes: number;
  cpu_model: string;
  ram_gb: number;
  os_info: string;
  python_version: string;
  openssl_version: string;
  crypto_library_version: string;
  created_at: string;
  metrics: BenchmarkMetric[];
}

export interface ComparisonTableRow {
  metric: string;
  rsa_2048: string;
  ecdsa_p256: string;
  mldsa_44: string;
}

export interface ExperimentRecord {
  id: number;
  experiment_code: string;
  title: string;
  description?: string;
  algorithms: string[];
  iterations: number;
  payload_size_bytes: number;
  status: string;
  system_specs: Record<string, any>;
  comparison_table: ComparisonTableRow[];
  created_at: string;
}

export interface PqcTechnicalInfo {
  standard: string;
  former_name: string;
  security_level: string;
  underlying_hardness_problems: string[];
  algebraic_structure: string;
  standard_sizes: {
    public_key_bytes: number;
    private_key_expanded_bytes: number;
    private_key_seed_bytes: number;
    signature_bytes: number;
  };
  classical_comparison: Record<string, any>;
  migration_implications: string[];
}
