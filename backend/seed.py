import os
import sys
import base64
import uuid

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import KeyPairModel, CertificateAuthorityModel, CertificateModel, SignatureModel, AttackSimulationModel
from app.api.benchmark import run_benchmark
from app.api.experiments import create_and_run_experiment
from app.api.attacks import (
    simulate_document_tampering, simulate_signature_tampering,
    simulate_wrong_key_attack, simulate_migration_demonstration
)
from app.schemas import BenchmarkRunRequest, CreateExperimentRequest, AttackSimulateRequest
from app.crypto.rsa_pki import generate_rsa_keypair, get_public_key_fingerprint
from app.crypto.mldsa_pqc import generate_mldsa44_keypair, get_mldsa44_public_key_fingerprint
from app.crypto.ca_service import create_root_ca, issue_end_entity_certificate
from app.config import KEYS_DIR

def seed_database():
    print("[*] Initializing tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("[*] Generating baseline classical and post-quantum keys...")
    # 1. Classical RSA
    priv_rsa, pub_rsa, dur_ns_rsa, dur_ms_rsa, pub_pem_rsa, priv_pem_rsa, pub_len_rsa, priv_len_rsa = generate_rsa_keypair(2048)
    rsa_path = str(KEYS_DIR / f"{uuid.uuid4().hex}_rsa.pem")
    with open(rsa_path, "w") as f:
        f.write(priv_pem_rsa)

    key_rsa = KeyPairModel(
        alias="rsa2048_thesis_anchor",
        algorithm="RSA-2048",
        key_family="classical",
        public_key_pem=pub_pem_rsa,
        private_key_path=rsa_path,
        public_key_bytes_len=pub_len_rsa,
        private_key_bytes_len=priv_len_rsa,
        fingerprint_sha256=get_public_key_fingerprint(pub_rsa),
        keygen_duration_ns=dur_ns_rsa,
        keygen_duration_ms=dur_ms_rsa,
        notes="Classical baseline RSA-2048 evaluation key"
    )
    db.add(key_rsa)

    # 2. Post-Quantum ML-DSA-44
    priv_pqc, pub_pqc, dur_ns_pqc, dur_ms_pqc, pub_pem_pqc, priv_pem_pqc, pub_raw_b64, pub_len_pqc, priv_len_pqc = generate_mldsa44_keypair()
    pqc_path = str(KEYS_DIR / f"{uuid.uuid4().hex}_mldsa44.pem")
    with open(pqc_path, "w") as f:
        f.write(priv_pem_pqc)

    key_pqc = KeyPairModel(
        alias="mldsa44_thesis_anchor",
        algorithm="ML-DSA-44",
        key_family="pqc",
        public_key_pem=pub_pem_pqc,
        public_key_raw_b64=pub_raw_b64,
        private_key_path=pqc_path,
        public_key_bytes_len=pub_len_pqc,
        private_key_bytes_len=2560,
        fingerprint_sha256=get_mldsa44_public_key_fingerprint(pub_pqc),
        keygen_duration_ns=dur_ns_pqc,
        keygen_duration_ms=dur_ms_pqc,
        notes="Post-Quantum ML-DSA-44 (FIPS 204) evaluation key"
    )
    db.add(key_pqc)
    db.commit()
    db.refresh(key_rsa)
    db.refresh(key_pqc)

    print("[*] Creating Research Root CA & X.509 Certificate...")
    ca_cert, ca_pem, ca_serial, ca_vf, ca_vt, ca_len = create_root_ca(
        priv_rsa, pub_rsa, "QuantumShield Research Root CA", "QuantumShield Laboratory", "Cryptography Division", "US", "CA", "San Francisco", 3650
    )
    ca_model = CertificateAuthorityModel(
        name="QuantumShield Research Root CA",
        key_id=key_rsa.id,
        certificate_pem=ca_pem,
        serial_number=ca_serial,
        subject_dn=ca_cert.subject.rfc4514_string(),
        issuer_dn=ca_cert.issuer.rfc4514_string(),
        valid_from=ca_vf,
        valid_to=ca_vt,
        crl_number=1,
        is_active=True
    )
    db.add(ca_model)
    db.commit()
    db.refresh(ca_model)

    # Issue cert
    ee_cert, ee_pem, ee_serial, ee_vf, ee_vt, ee_len, ee_dns, ee_dms = issue_end_entity_certificate(
        ca_cert, priv_rsa, pub_rsa, "server.thesis.internal", "Research Entity", "Evaluation Node", "US", 365
    )
    cert_model = CertificateModel(
        ca_id=ca_model.id,
        key_id=key_rsa.id,
        serial_number=ee_serial,
        common_name="server.thesis.internal",
        subject_dn=ee_cert.subject.rfc4514_string(),
        issuer_dn=ee_cert.issuer.rfc4514_string(),
        certificate_pem=ee_pem,
        valid_from=ee_vf,
        valid_to=ee_vt,
        is_revoked=False,
        cert_size_bytes=ee_len,
        issuance_duration_ns=ee_dns,
        issuance_duration_ms=ee_dms,
        fingerprint_sha256="sha256_" + ee_serial
    )
    db.add(cert_model)
    db.commit()

    print("[*] Executing initial benchmark session (N=100 iterations)...")
    run_benchmark(BenchmarkRunRequest(
        algorithms=["RSA-2048", "ECDSA-P256", "ML-DSA-44"],
        iterations=100,
        warmup_runs=5,
        payload_size_bytes=1024,
        notes="Initial Baseline Benchmark Session"
    ), db)

    print("[*] Executing initial thesis research experiment...")
    create_and_run_experiment(CreateExperimentRequest(
        title="Baseline Classical vs ML-DSA-44 Empirical Evaluation",
        description="Comprehensive comparative matrix for thesis defense presentation",
        algorithms=["RSA-2048", "ECDSA-P256", "ML-DSA-44"],
        iterations=100,
        payload_size_bytes=1024
    ), db)

    print("[*] Running initial security attack simulations...")
    simulate_document_tampering(AttackSimulateRequest(test_type="document_tamper", algorithm="ML-DSA-44"), db)
    simulate_signature_tampering(AttackSimulateRequest(test_type="signature_tamper", algorithm="RSA-2048"), db)
    simulate_wrong_key_attack(AttackSimulateRequest(test_type="wrong_key", algorithm="ML-DSA-44"), db)
    simulate_migration_demonstration(AttackSimulateRequest(test_type="migration_demo", algorithm="ML-DSA-44"), db)

    db.close()
    print("[+] Seeding completed successfully! Database is ready with real research records.")

if __name__ == "__main__":
    seed_database()
