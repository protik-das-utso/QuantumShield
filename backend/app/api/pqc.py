import os
import uuid
import base64
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import KEYS_DIR
from app.models import KeyPairModel
from app.schemas import KeyGenerateRequest, KeyPairResponse
from app.crypto.mldsa_pqc import generate_mldsa44_keypair, get_mldsa44_public_key_fingerprint

router = APIRouter(prefix="/api/pqc", tags=["Post-Quantum Cryptography (ML-DSA-44)"])


@router.post("/generate-key", response_model=KeyPairResponse)
def generate_pqc_key(req: KeyGenerateRequest, db: Session = Depends(get_db)):
    if req.algorithm != "ML-DSA-44":
        raise HTTPException(status_code=400, detail="PQC algorithm must be ML-DSA-44 (FIPS 204)")

    # Check alias uniqueness
    existing = db.query(KeyPairModel).filter(KeyPairModel.alias == req.alias).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Key alias '{req.alias}' already exists")

    key_filename = f"{uuid.uuid4().hex}_mldsa44.pem"
    key_filepath = str(KEYS_DIR / key_filename)

    priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_raw_b64, pub_len, priv_len = generate_mldsa44_keypair()
    fingerprint = get_mldsa44_public_key_fingerprint(pub)

    # Save private key securely to disk
    with open(key_filepath, "w", encoding="utf-8") as f:
        f.write(priv_pem)

    try:
        os.chmod(key_filepath, 0o600)
    except Exception:
        pass

    key_record = KeyPairModel(
        alias=req.alias,
        algorithm="ML-DSA-44",
        key_family="pqc",
        public_key_pem=pub_pem,
        public_key_raw_b64=pub_raw_b64,
        private_key_path=key_filepath,
        public_key_bytes_len=pub_len,  # 1312 bytes
        private_key_bytes_len=2560,    # FIPS 204 expanded secret key size (32 bytes raw seed)
        fingerprint_sha256=fingerprint,
        keygen_duration_ns=dur_ns,
        keygen_duration_ms=dur_ms,
        notes=req.notes or "FIPS 204 ML-DSA-44 Key Pair"
    )

    db.add(key_record)
    db.commit()
    db.refresh(key_record)

    return key_record


@router.get("/keys", response_model=List[KeyPairResponse])
def list_pqc_keys(db: Session = Depends(get_db)):
    return db.query(KeyPairModel).filter(KeyPairModel.key_family == "pqc").order_by(KeyPairModel.id.desc()).all()


@router.get("/keys/{key_id}/public")
def export_pqc_public_key(key_id: int, format: str = "pem", db: Session = Depends(get_db)):
    key = db.query(KeyPairModel).filter(KeyPairModel.id == key_id, KeyPairModel.key_family == "pqc").first()
    if not key:
        raise HTTPException(status_code=404, detail="PQC Key not found")

    if format == "raw":
        raw_bytes = base64.b64decode(key.public_key_raw_b64)
        return Response(
            content=raw_bytes,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={key.alias}_public_1312b.raw"}
        )
    else:
        return Response(
            content=key.public_key_pem,
            media_type="application/x-pem-file",
            headers={"Content-Disposition": f"attachment; filename={key.alias}_mldsa44_public.pem"}
        )


@router.get("/info")
def get_pqc_technical_info():
    """
    Returns research-grade technical documentation regarding ML-DSA-44 and FIPS 204.
    """
    return {
        "standard": "NIST FIPS 204 (Module-Lattice-Based Digital Signature Standard)",
        "former_name": "CRYSTALS-Dilithium (Dilithium2)",
        "security_level": "NIST Security Category 2 (Equivalent to SHA-256 / AES-128 collision resistance)",
        "underlying_hardness_problems": [
            "Module Learning With Errors (M-LWE)",
            "Module Short Integer Solution (M-SIS)"
        ],
        "algebraic_structure": "Polynomial ring R_q = Z_q[X] / (X^256 + 1) where q = 8,380,417",
        "standard_sizes": {
            "public_key_bytes": 1312,
            "private_key_expanded_bytes": 2560,
            "private_key_seed_bytes": 32,
            "signature_bytes": 2420
        },
        "classical_comparison": {
            "rsa_2048": {
                "public_key_bytes": 270,
                "private_key_bytes": 1190,
                "signature_bytes": 256,
                "hardness": "Integer Factorization (Vulnerable to Shor's algorithm: O((log N)^3))",
                "signing_speed": "Computationally intensive modular exponentiation",
                "verification_speed": "Fast due to small public exponent (e=65537)"
            },
            "ecdsa_p256": {
                "public_key_bytes": 65,
                "private_key_bytes": 32,
                "signature_bytes": 64,
                "hardness": "Elliptic Curve Discrete Logarithm Problem (ECDLP; Vulnerable to Shor's algorithm)",
                "signing_speed": "Moderate elliptic curve point multiplication",
                "verification_speed": "Moderate point multiplications"
            },
            "ml_dsa_44": {
                "public_key_bytes": 1312,
                "private_key_bytes": 2560,
                "signature_bytes": 2420,
                "hardness": "Lattice shortest vector approximations (Quantum-resistant; No known polynomial quantum attack)",
                "signing_speed": "Extremely fast polynomial matrix-vector arithmetic using NTT",
                "verification_speed": "Extremely fast polynomial multiplications"
            }
        },
        "migration_implications": [
            "Bandwidth & MTU Fragmentation: ML-DSA-44 signatures (2,420 bytes) exceed typical network MTU (1,500 bytes), requiring packet fragmentation in TLS handshakes.",
            "Storage Overhead: PKI certificate stores, CRLs, and embedded hardware will require 5x to 10x larger storage allocations.",
            "Compute Advantage: ML-DSA NTT (Number Theoretic Transform) arithmetic significantly outperforms RSA modular exponentiation in throughput.",
            "Pure Mode vs Pre-Hash Mode: FIPS 204 defines standard Pure Mode (entire message is signed) and HashML-DSA Mode for streaming large payloads.",
            "Hybrid PKI Transitions: Standards bodies recommend dual-key / hybrid certificates (X.509 dual signatures) during transitional phases."
        ]
    }
