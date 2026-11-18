from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class KeyPairModel(Base):
    __tablename__ = "key_pairs"

    id = Column(Integer, primary_key=True, index=True)
    alias = Column(String(128), unique=True, index=True, nullable=False)
    algorithm = Column(String(64), nullable=False)  # RSA-2048, ECDSA-P256, ML-DSA-44
    key_family = Column(String(32), nullable=False)  # classical, pqc
    public_key_pem = Column(Text, nullable=True)
    public_key_raw_b64 = Column(Text, nullable=True)
    private_key_path = Column(String(256), nullable=False)  # stored securely on disk
    public_key_bytes_len = Column(Integer, nullable=False)
    private_key_bytes_len = Column(Integer, nullable=False)
    fingerprint_sha256 = Column(String(64), nullable=False)
    keygen_duration_ns = Column(Integer, nullable=False)
    keygen_duration_ms = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    notes = Column(Text, nullable=True)

    certificates = relationship("CertificateModel", back_populates="key_pair", cascade="all, delete-orphan")
    signatures = relationship("SignatureModel", back_populates="key_pair")


class CertificateAuthorityModel(Base):
    __tablename__ = "certificate_authorities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    key_id = Column(Integer, ForeignKey("key_pairs.id"), nullable=False)
    certificate_pem = Column(Text, nullable=False)
    serial_number = Column(String(64), unique=True, nullable=False)
    subject_dn = Column(String(256), nullable=False)
    issuer_dn = Column(String(256), nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    crl_number = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    key_pair = relationship("KeyPairModel")
    issued_certificates = relationship("CertificateModel", back_populates="ca", cascade="all, delete-orphan")


class CertificateModel(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    ca_id = Column(Integer, ForeignKey("certificate_authorities.id"), nullable=False)
    key_id = Column(Integer, ForeignKey("key_pairs.id"), nullable=False)
    serial_number = Column(String(64), unique=True, nullable=False)
    common_name = Column(String(128), nullable=False)
    subject_dn = Column(String(256), nullable=False)
    issuer_dn = Column(String(256), nullable=False)
    certificate_pem = Column(Text, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(String(64), nullable=True)
    cert_size_bytes = Column(Integer, nullable=False)
    issuance_duration_ns = Column(Integer, nullable=False)
    issuance_duration_ms = Column(Float, nullable=False)
    fingerprint_sha256 = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    ca = relationship("CertificateAuthorityModel", back_populates="issued_certificates")
    key_pair = relationship("KeyPairModel", back_populates="certificates")


class SignatureModel(Base):
    __tablename__ = "signatures"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("key_pairs.id"), nullable=True)
    algorithm = Column(String(64), nullable=False)
    document_name = Column(String(256), nullable=False)
    document_size_bytes = Column(Integer, nullable=False)
    document_hash_sha256 = Column(String(64), nullable=False)
    signature_bytes_b64 = Column(Text, nullable=False)
    signature_size_bytes = Column(Integer, nullable=False)
    signing_duration_ns = Column(Integer, nullable=False)
    signing_duration_ms = Column(Float, nullable=False)
    public_key_fingerprint = Column(String(64), nullable=False)
    verification_status = Column(String(32), default="UNVERIFIED")  # VALID, INVALID, UNVERIFIED
    created_at = Column(DateTime, default=utcnow)

    key_pair = relationship("KeyPairModel", back_populates="signatures")


class AttackSimulationModel(Base):
    __tablename__ = "attack_simulations"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(32), nullable=False)  # TEST-1, TEST-2, etc.
    test_name = Column(String(128), nullable=False)
    algorithm = Column(String(64), nullable=False)
    target_description = Column(String(256), nullable=False)
    expected_result = Column(String(64), nullable=False)  # e.g., "VERIFICATION_FAILURE"
    actual_result = Column(String(64), nullable=False)
    defense_passed = Column(Boolean, nullable=False)  # True if defense successfully caught the attack
    attack_status = Column(String(32), nullable=False)  # ATTACK_DETECTED, ATTACK_UNDETECTED, ERROR
    tamper_details = Column(Text, nullable=True)
    execution_duration_ns = Column(Integer, nullable=False)
    execution_duration_ms = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=utcnow)


class BenchmarkSessionModel(Base):
    __tablename__ = "benchmark_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    iterations = Column(Integer, nullable=False)
    warmup_runs = Column(Integer, nullable=False)
    payload_size_bytes = Column(Integer, nullable=False)
    cpu_model = Column(String(128), nullable=False)
    ram_gb = Column(Float, nullable=False)
    os_info = Column(String(128), nullable=False)
    python_version = Column(String(64), nullable=False)
    openssl_version = Column(String(128), nullable=False)
    crypto_library_version = Column(String(64), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    metrics = relationship("BenchmarkMetricModel", back_populates="session", cascade="all, delete-orphan")


class BenchmarkMetricModel(Base):
    __tablename__ = "benchmark_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("benchmark_sessions.id"), nullable=False)
    algorithm = Column(String(64), nullable=False)  # RSA-2048, ECDSA-P256, ML-DSA-44
    operation = Column(String(64), nullable=False)  # keygen, sign, verify, cert_issuance, cert_validation

    mean_ns = Column(Float, nullable=False)
    median_ns = Column(Float, nullable=False)
    min_ns = Column(Float, nullable=False)
    max_ns = Column(Float, nullable=False)
    std_dev_ns = Column(Float, nullable=False)
    p95_ns = Column(Float, nullable=False)

    mean_ms = Column(Float, nullable=False)
    median_ms = Column(Float, nullable=False)
    min_ms = Column(Float, nullable=False)
    max_ms = Column(Float, nullable=False)
    std_dev_ms = Column(Float, nullable=False)
    p95_ms = Column(Float, nullable=False)

    public_key_bytes = Column(Integer, nullable=True)
    private_key_bytes = Column(Integer, nullable=True)
    signature_bytes = Column(Integer, nullable=True)
    certificate_bytes = Column(Integer, nullable=True)

    raw_durations_ns_json = Column(Text, nullable=True)  # JSON array of samples

    session = relationship("BenchmarkSessionModel", back_populates="metrics")


class ExperimentModel(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    algorithms_json = Column(Text, nullable=False)  # JSON array of algos
    iterations = Column(Integer, nullable=False)
    payload_size_bytes = Column(Integer, nullable=False)
    status = Column(String(32), default="COMPLETED")
    system_specs_json = Column(Text, nullable=False)
    comparison_table_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)
