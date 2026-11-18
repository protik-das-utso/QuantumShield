import os
import uuid
import datetime
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from app.database import get_db
from app.config import CERTS_DIR, CRL_DIR, KEYS_DIR
from app.models import KeyPairModel, CertificateAuthorityModel, CertificateModel
from app.schemas import (
    CreateCARequest, CAResponse,
    IssueCertificateRequest, CertificateResponse,
    RevokeCertificateRequest, CertificateVerifyResponse
)
from app.crypto.rsa_pki import generate_rsa_keypair, get_public_key_fingerprint
from app.crypto.ecdsa_pki import generate_ecdsa_keypair, get_ecdsa_public_key_fingerprint
from app.crypto.ca_service import (
    create_root_ca, issue_end_entity_certificate,
    verify_certificate_chain, generate_crl
)
from app.crypto.sign_service import load_private_key_from_path, load_public_key

router = APIRouter(prefix="/api/classical", tags=["Certificate Authority & Management"])


@router.post("/create-ca", response_model=CAResponse)
def create_ca(req: CreateCARequest, db: Session = Depends(get_db)):
    # Check CA name uniqueness
    existing = db.query(CertificateAuthorityModel).filter(CertificateAuthorityModel.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"CA name '{req.name}' already exists")

    # Generate key for CA
    key_alias = f"ca_key_{uuid.uuid4().hex[:8]}"
    key_filename = f"{uuid.uuid4().hex}_ca_{req.algorithm.lower().replace('-', '_')}.pem"
    key_filepath = str(KEYS_DIR / key_filename)

    if req.algorithm == "RSA-2048":
        priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_rsa_keypair(2048)
        fp = get_public_key_fingerprint(pub)
    elif req.algorithm == "ECDSA-P256":
        priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_ecdsa_keypair()
        fp = get_ecdsa_public_key_fingerprint(pub)
    else:
        raise HTTPException(status_code=400, detail="CA algorithm must be RSA-2048 or ECDSA-P256")

    with open(key_filepath, "w", encoding="utf-8") as f:
        f.write(priv_pem)

    key_record = KeyPairModel(
        alias=key_alias,
        algorithm=req.algorithm,
        key_family="classical",
        public_key_pem=pub_pem,
        public_key_raw_b64=None,
        private_key_path=key_filepath,
        public_key_bytes_len=pub_len,
        private_key_bytes_len=priv_len,
        fingerprint_sha256=fp,
        keygen_duration_ns=dur_ns,
        keygen_duration_ms=dur_ms,
        notes=f"Root CA Key for {req.name}"
    )
    db.add(key_record)
    db.commit()
    db.refresh(key_record)

    # Create root CA certificate
    cert, cert_pem, serial_hex, valid_from, valid_to, cert_len = create_root_ca(
        private_key=priv,
        public_key=pub,
        common_name=req.common_name,
        organization=req.organization,
        organizational_unit=req.organizational_unit,
        country=req.country,
        state=req.state,
        locality=req.locality,
        validity_days=req.validity_days
    )

    ca_record = CertificateAuthorityModel(
        name=req.name,
        key_id=key_record.id,
        certificate_pem=cert_pem,
        serial_number=serial_hex,
        subject_dn=cert.subject.rfc4514_string(),
        issuer_dn=cert.issuer.rfc4514_string(),
        valid_from=valid_from,
        valid_to=valid_to,
        crl_number=1,
        is_active=True
    )
    db.add(ca_record)
    db.commit()
    db.refresh(ca_record)

    return ca_record


@router.get("/cas", response_model=List[CAResponse])
def list_cas(db: Session = Depends(get_db)):
    return db.query(CertificateAuthorityModel).order_by(CertificateAuthorityModel.id.desc()).all()


@router.post("/issue-certificate", response_model=CertificateResponse)
def issue_certificate(req: IssueCertificateRequest, db: Session = Depends(get_db)):
    ca = db.query(CertificateAuthorityModel).filter(CertificateAuthorityModel.id == req.ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Certificate Authority not found")

    ca_key_record = db.query(KeyPairModel).filter(KeyPairModel.id == ca.key_id).first()
    if not ca_key_record:
        raise HTTPException(status_code=500, detail="CA private key record missing")

    subject_key_record = db.query(KeyPairModel).filter(KeyPairModel.id == req.key_id).first()
    if not subject_key_record:
        raise HTTPException(status_code=404, detail="Subject key pair not found")

    if subject_key_record.key_family != "classical":
        raise HTTPException(
            status_code=400,
            detail="Standard X.509 issuance currently supports classical keys (RSA-2048, ECDSA-P256). For ML-DSA-44, refer to the Post-Quantum module."
        )

    # Load CA certificate & CA private key
    ca_cert = x509.load_pem_x509_certificate(ca.certificate_pem.encode("utf-8"))
    ca_priv_key = load_private_key_from_path(ca_key_record.private_key_path, ca_key_record.algorithm)

    # Load subject public key
    subject_pub_key = load_public_key(subject_key_record.public_key_pem, None, subject_key_record.algorithm)

    # Issue certificate
    cert, cert_pem, serial_hex, valid_from, valid_to, cert_len, dur_ns, dur_ms = issue_end_entity_certificate(
        ca_certificate=ca_cert,
        ca_private_key=ca_priv_key,
        subject_public_key=subject_pub_key,
        common_name=req.common_name,
        organization=req.organization,
        organizational_unit=req.organizational_unit,
        country=req.country,
        validity_days=req.validity_days,
        dns_san=req.dns_san
    )

    cert_fingerprint = hashlib.sha256(cert.public_bytes(serialization.Encoding.DER)).hexdigest()

    cert_record = CertificateModel(
        ca_id=ca.id,
        key_id=subject_key_record.id,
        serial_number=serial_hex,
        common_name=req.common_name,
        subject_dn=cert.subject.rfc4514_string(),
        issuer_dn=cert.issuer.rfc4514_string(),
        certificate_pem=cert_pem,
        valid_from=valid_from,
        valid_to=valid_to,
        is_revoked=False,
        cert_size_bytes=cert_len,
        issuance_duration_ns=dur_ns,
        issuance_duration_ms=dur_ms,
        fingerprint_sha256=cert_fingerprint
    )

    db.add(cert_record)
    db.commit()
    db.refresh(cert_record)

    return cert_record


@router.get("/certificates", response_model=List[CertificateResponse])
def list_certificates(db: Session = Depends(get_db)):
    return db.query(CertificateModel).order_by(CertificateModel.id.desc()).all()


@router.get("/certificates/{cert_id}", response_model=CertificateResponse)
def get_certificate(cert_id: int, db: Session = Depends(get_db)):
    cert = db.query(CertificateModel).filter(CertificateModel.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.get("/certificates/{cert_id}/download")
def download_certificate(cert_id: int, format: str = "pem", db: Session = Depends(get_db)):
    cert = db.query(CertificateModel).filter(CertificateModel.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if format == "der":
        x509_obj = x509.load_pem_x509_certificate(cert.certificate_pem.encode("utf-8"))
        der_bytes = x509_obj.public_bytes(serialization.Encoding.DER)
        return Response(
            content=der_bytes,
            media_type="application/x-x509-ca-cert",
            headers={"Content-Disposition": f"attachment; filename=cert_{cert.serial_number}.der"}
        )
    else:
        return Response(
            content=cert.certificate_pem,
            media_type="application/x-pem-file",
            headers={"Content-Disposition": f"attachment; filename=cert_{cert.serial_number}.pem"}
        )


@router.post("/certificates/{cert_id}/verify", response_model=CertificateVerifyResponse)
def verify_certificate_endpoint(cert_id: int, db: Session = Depends(get_db)):
    cert_record = db.query(CertificateModel).filter(CertificateModel.id == cert_id).first()
    if not cert_record:
        raise HTTPException(status_code=404, detail="Certificate not found")

    ca = db.query(CertificateAuthorityModel).filter(CertificateAuthorityModel.id == cert_record.ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Issuing CA not found")

    cert_obj = x509.load_pem_x509_certificate(cert_record.certificate_pem.encode("utf-8"))
    ca_cert_obj = x509.load_pem_x509_certificate(ca.certificate_pem.encode("utf-8"))

    sig_valid, dur_ns, dur_ms, details = verify_certificate_chain(cert_obj, ca_cert_obj)

    is_not_revoked = not cert_record.is_revoked
    details["is_not_revoked"] = is_not_revoked
    if cert_record.is_revoked:
        details["revocation_reason"] = cert_record.revocation_reason
        details["revoked_at"] = cert_record.revoked_at.isoformat() if cert_record.revoked_at else None

    overall = sig_valid and is_not_revoked and details.get("is_time_valid", False)

    return CertificateVerifyResponse(
        certificate_id=cert_record.id,
        serial_number=cert_record.serial_number,
        is_signature_valid=details.get("is_signature_valid", False),
        is_time_valid=details.get("is_time_valid", False),
        is_not_revoked=is_not_revoked,
        overall_valid=overall,
        validation_duration_ms=dur_ms,
        details=details
    )


@router.post("/certificates/{cert_id}/revoke")
def revoke_certificate(cert_id: int, req: RevokeCertificateRequest, db: Session = Depends(get_db)):
    cert = db.query(CertificateModel).filter(CertificateModel.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if cert.is_revoked:
        raise HTTPException(status_code=400, detail="Certificate is already revoked")

    cert.is_revoked = True
    cert.revoked_at = datetime.datetime.now(datetime.timezone.utc)
    cert.revocation_reason = req.reason

    # Increment CRL number on CA
    ca = db.query(CertificateAuthorityModel).filter(CertificateAuthorityModel.id == cert.ca_id).first()
    if ca:
        ca.crl_number += 1

    db.commit()
    db.refresh(cert)

    return {
        "status": "REVOKED",
        "certificate_id": cert.id,
        "serial_number": cert.serial_number,
        "revoked_at": cert.revoked_at.isoformat(),
        "reason": cert.revocation_reason
    }


@router.get("/cas/{ca_id}/crl")
def get_ca_crl(ca_id: int, db: Session = Depends(get_db)):
    ca = db.query(CertificateAuthorityModel).filter(CertificateAuthorityModel.id == ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="CA not found")

    ca_key = db.query(KeyPairModel).filter(KeyPairModel.id == ca.key_id).first()
    if not ca_key:
        raise HTTPException(status_code=500, detail="CA key not found")

    ca_cert = x509.load_pem_x509_certificate(ca.certificate_pem.encode("utf-8"))
    ca_priv_key = load_private_key_from_path(ca_key.private_key_path, ca_key.algorithm)

    # Query all revoked certificates under this CA
    revoked_records = db.query(CertificateModel).filter(
        CertificateModel.ca_id == ca_id,
        CertificateModel.is_revoked == True
    ).all()

    revoked_list = [
        (int(r.serial_number, 16), r.revoked_at or datetime.datetime.now(datetime.timezone.utc), r.revocation_reason or "keyCompromise")
        for r in revoked_records
    ]

    crl_pem = generate_crl(ca_cert, ca_priv_key, revoked_list, ca.crl_number)

    return Response(
        content=crl_pem,
        media_type="application/x-pkcs7-crl",
        headers={"Content-Disposition": f"attachment; filename={ca.name}_revocation_list.crl"}
    )
