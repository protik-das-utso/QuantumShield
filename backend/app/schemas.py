from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# Key Pair Schemas
class KeyGenerateRequest(BaseModel):
    algorithm: str = Field(..., description="RSA-2048, ECDSA-P256, or ML-DSA-44")
    alias: str = Field(..., min_length=2, max_length=128)
    notes: Optional[str] = None


class KeyPairResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alias: str
    algorithm: str
    key_family: str
    public_key_pem: Optional[str] = None
    public_key_raw_b64: Optional[str] = None
    public_key_bytes_len: int
    private_key_bytes_len: int
    fingerprint_sha256: str
    keygen_duration_ms: float
    created_at: datetime
    notes: Optional[str] = None


# Certificate Authority Schemas
class CreateCARequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    algorithm: str = Field("RSA-2048", description="RSA-2048 or ECDSA-P256")
    common_name: str = Field("QuantumShield Research Root CA", min_length=2)
    organization: str = Field("QuantumShield Research Laboratory")
    organizational_unit: Optional[str] = "Cryptography Division"
    country: str = Field("US", min_length=2, max_length=2)
    state: Optional[str] = "California"
    locality: Optional[str] = "San Francisco"
    validity_days: int = Field(3650, ge=1, le=7300)


class CAResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    key_id: int
    certificate_pem: str
    serial_number: str
    subject_dn: str
    issuer_dn: str
    valid_from: datetime
    valid_to: datetime
    crl_number: int
    is_active: bool
    created_at: datetime


# Certificate Issuance & Management
class IssueCertificateRequest(BaseModel):
    ca_id: int
    key_id: int
    common_name: str
    organization: Optional[str] = "End User Entity"
    organizational_unit: Optional[str] = "Research Node"
    country: Optional[str] = "US"
    validity_days: int = Field(365, ge=1, le=1825)
    dns_san: Optional[List[str]] = None


class RevokeCertificateRequest(BaseModel):
    certificate_id: int
    reason: str = Field("keyCompromise", description="RFC 5280 revocation reason")


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ca_id: int
    key_id: int
    serial_number: str
    common_name: str
    subject_dn: str
    issuer_dn: str
    certificate_pem: str
    valid_from: datetime
    valid_to: datetime
    is_revoked: bool
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    cert_size_bytes: int
    issuance_duration_ms: float
    fingerprint_sha256: str
    created_at: datetime


class CertificateVerifyResponse(BaseModel):
    certificate_id: int
    serial_number: str
    is_signature_valid: bool
    is_time_valid: bool
    is_not_revoked: bool
    overall_valid: bool
    validation_duration_ms: float
    details: Dict[str, Any]


# Digital Signature Schemas
class SignDocumentRequest(BaseModel):
    key_id: int
    document_base64: str
    document_name: str


class SignatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key_id: Optional[int]
    algorithm: str
    document_name: str
    document_size_bytes: int
    document_hash_sha256: str
    signature_bytes_b64: str
    signature_size_bytes: int
    signing_duration_ms: float
    public_key_fingerprint: str
    verification_status: str
    created_at: datetime


class VerifySignatureRequest(BaseModel):
    document_base64: str
    signature_base64: str
    key_id: Optional[int] = None
    public_key_pem: Optional[str] = None
    algorithm: str


class VerifySignatureResponse(BaseModel):
    is_valid: bool
    algorithm: str
    verification_duration_ms: float
    document_hash_sha256: str
    signature_size_bytes: int
    message: str


# Attack Simulation Schemas
class AttackSimulateRequest(BaseModel):
    test_type: str = Field(..., description="document_tamper, signature_tamper, wrong_key, invalid_sig, cert_validation, migration_demo")
    algorithm: str = Field("RSA-2048", description="RSA-2048, ECDSA-P256, or ML-DSA-44")
    key_id: Optional[int] = None
    document_base64: Optional[str] = None
    document_name: Optional[str] = "test_document.txt"
    tamper_mode: Optional[str] = "flip_byte"
    cert_id: Optional[int] = None


class AttackSimulationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_id: str
    test_name: str
    algorithm: str
    target_description: str
    expected_result: str
    actual_result: str
    defense_passed: bool
    attack_status: str
    tamper_details: Optional[str]
    execution_duration_ms: float
    timestamp: datetime


class QuantumAttackRequest(BaseModel):
    target_type: str = Field("toy_rsa", description="toy_rsa, rsa_2048, ecdsa_p256, or mldsa_44")
    bits: int = Field(16, ge=8, le=32, description="Modulus bit length for live simulated factorization")


class QuantumAttackResponse(BaseModel):
    target_algorithm: str
    attack_name: str
    status: str
    defense_passed: bool
    execution_duration_ms: float
    quantum_iterations: Optional[int] = None
    modulus_n: Optional[str] = None
    public_exponent_e: Optional[int] = None
    recovered_prime_p: Optional[int] = None
    recovered_prime_q: Optional[int] = None
    recovered_phi: Optional[int] = None
    recovered_private_key_d: Optional[int] = None
    signature_forged: Optional[bool] = None
    forged_signature_sample: Optional[str] = None
    security_level_quantum: Optional[str] = None
    mathematical_complexity: Optional[str] = None
    logical_qubits_required: Optional[int] = None
    physical_qubits_required: Optional[int] = None
    toffoli_gates: Optional[float] = None
    estimated_quantum_runtime: Optional[str] = None
    theoretical_notes: str


# Performance Benchmark Schemas
class BenchmarkRunRequest(BaseModel):
    algorithms: List[str] = Field(default=["RSA-2048", "ECDSA-P256", "ML-DSA-44"])
    iterations: int = Field(default=100, ge=10, le=5000)
    warmup_runs: int = Field(default=5, ge=1, le=50)
    payload_size_bytes: int = Field(default=1024, ge=32, le=10485760)
    notes: Optional[str] = None


class BenchmarkMetricResponse(BaseModel):
    algorithm: str
    operation: str
    mean_ms: float
    median_ms: float
    min_ms: float
    max_ms: float
    std_dev_ms: float
    p95_ms: float
    public_key_bytes: Optional[int] = None
    private_key_bytes: Optional[int] = None
    signature_bytes: Optional[int] = None
    certificate_bytes: Optional[int] = None
    raw_durations_ns: Optional[List[int]] = None


class BenchmarkSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_code: str
    name: str
    iterations: int
    warmup_runs: int
    payload_size_bytes: int
    cpu_model: str
    ram_gb: float
    os_info: str
    python_version: str
    openssl_version: str
    crypto_library_version: str
    created_at: datetime
    metrics: List[BenchmarkMetricResponse]


# Experiment Workspace Schemas
class CreateExperimentRequest(BaseModel):
    experiment_code: Optional[str] = None
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    algorithms: List[str] = Field(default=["RSA-2048", "ECDSA-P256", "ML-DSA-44"])
    iterations: int = Field(default=100, ge=10, le=5000)
    payload_size_bytes: int = Field(default=1024, ge=32, le=10485760)


class ExperimentResponse(BaseModel):
    id: int
    experiment_code: str
    title: str
    description: Optional[str]
    algorithms: List[str]
    iterations: int
    payload_size_bytes: int
    status: str
    system_specs: Dict[str, Any]
    comparison_table: List[Dict[str, Any]]
    created_at: datetime


# System Info Schema
class SystemInfoResponse(BaseModel):
    os: str
    processor: str
    cpu_cores_physical: int
    cpu_cores_logical: int
    ram_total_gb: float
    python_version: str
    openssl_version: str
    cryptography_version: str
    mldsa_fips204_available: bool
    mldsa_engine: str
