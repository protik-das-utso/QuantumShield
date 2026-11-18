import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import KEYS_DIR
from app.models import KeyPairModel
from app.schemas import KeyGenerateRequest, KeyPairResponse
from app.crypto.rsa_pki import generate_rsa_keypair, get_public_key_fingerprint
from app.crypto.ecdsa_pki import generate_ecdsa_keypair, get_ecdsa_public_key_fingerprint

router = APIRouter(prefix="/api/classical", tags=["Classical PKI"])


@router.post("/generate-key", response_model=KeyPairResponse)
def generate_classical_key(req: KeyGenerateRequest, db: Session = Depends(get_db)):
    # Validate algorithm
    if req.algorithm not in ["RSA-2048", "ECDSA-P256"]:
        raise HTTPException(status_code=400, detail="Algorithm must be RSA-2048 or ECDSA-P256")

    # Check alias uniqueness
    existing = db.query(KeyPairModel).filter(KeyPairModel.alias == req.alias).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Key alias '{req.alias}' already exists")

    key_filename = f"{uuid.uuid4().hex}_{req.algorithm.lower().replace('-', '_')}.pem"
    key_filepath = str(KEYS_DIR / key_filename)

    if req.algorithm == "RSA-2048":
        priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_rsa_keypair(2048)
        fingerprint = get_public_key_fingerprint(pub)
    else:
        priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_ecdsa_keypair()
        fingerprint = get_ecdsa_public_key_fingerprint(pub)

    # Save private key securely to disk
    with open(key_filepath, "w", encoding="utf-8") as f:
        f.write(priv_pem)

    # Restrict permissions on Windows/Linux where applicable
    try:
        os.chmod(key_filepath, 0o600)
    except Exception:
        pass

    key_record = KeyPairModel(
        alias=req.alias,
        algorithm=req.algorithm,
        key_family="classical",
        public_key_pem=pub_pem,
        public_key_raw_b64=None,
        private_key_path=key_filepath,
        public_key_bytes_len=pub_len,
        private_key_bytes_len=priv_len,
        fingerprint_sha256=fingerprint,
        keygen_duration_ns=dur_ns,
        keygen_duration_ms=dur_ms,
        notes=req.notes
    )

    db.add(key_record)
    db.commit()
    db.refresh(key_record)

    return key_record


@router.get("/keys", response_model=List[KeyPairResponse])
def list_classical_keys(db: Session = Depends(get_db)):
    return db.query(KeyPairModel).filter(KeyPairModel.key_family == "classical").order_by(KeyPairModel.id.desc()).all()


@router.get("/keys/{key_id}/public")
def export_public_key(key_id: int, format: str = "pem", db: Session = Depends(get_db)):
    key = db.query(KeyPairModel).filter(KeyPairModel.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")

    if format == "pem":
        return Response(
            content=key.public_key_pem,
            media_type="application/x-pem-file",
            headers={"Content-Disposition": f"attachment; filename={key.alias}_public.pem"}
        )
    else:
        # Export as text
        return {"alias": key.alias, "algorithm": key.algorithm, "public_key_pem": key.public_key_pem}
