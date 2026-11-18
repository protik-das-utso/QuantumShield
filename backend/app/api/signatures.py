import os
import uuid
import base64
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import SIGNATURES_DIR, UPLOADS_DIR
from app.models import KeyPairModel, SignatureModel
from app.schemas import (
    SignDocumentRequest, SignatureResponse,
    VerifySignatureRequest, VerifySignatureResponse
)
from app.crypto.sign_service import (
    load_private_key_from_path, load_public_key,
    sign_data, verify_data, get_key_fingerprint, compute_sha256
)

router = APIRouter(prefix="/api/signatures", tags=["Digital Signatures"])


@router.post("/sign", response_model=SignatureResponse)
def sign_document_json(req: SignDocumentRequest, db: Session = Depends(get_db)):
    key = db.query(KeyPairModel).filter(KeyPairModel.id == req.key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key pair not found")

    try:
        doc_bytes = base64.b64decode(req.document_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 document content")

    doc_hash = compute_sha256(doc_bytes)

    # Load private key
    private_key = load_private_key_from_path(key.private_key_path, key.algorithm)

    # Perform real cryptographic signing
    sig_bytes, dur_ns, dur_ms = sign_data(private_key, key.algorithm, doc_bytes)

    # Save detached signature
    sig_filename = f"{uuid.uuid4().hex}_{key.algorithm.lower().replace('-', '_')}.sig"
    sig_filepath = str(SIGNATURES_DIR / sig_filename)
    with open(sig_filepath, "wb") as f:
        f.write(sig_bytes)

    sig_b64 = base64.b64encode(sig_bytes).decode("utf-8")

    sig_record = SignatureModel(
        key_id=key.id,
        algorithm=key.algorithm,
        document_name=req.document_name,
        document_size_bytes=len(doc_bytes),
        document_hash_sha256=doc_hash,
        signature_bytes_b64=sig_b64,
        signature_size_bytes=len(sig_bytes),
        signing_duration_ns=dur_ns,
        signing_duration_ms=dur_ms,
        public_key_fingerprint=key.fingerprint_sha256,
        verification_status="VALID"
    )

    db.add(sig_record)
    db.commit()
    db.refresh(sig_record)

    return sig_record


@router.post("/sign-file", response_model=SignatureResponse)
async def sign_uploaded_file(
    key_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    key = db.query(KeyPairModel).filter(KeyPairModel.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key pair not found")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    doc_hash = compute_sha256(file_bytes)

    # Save uploaded document to storage/uploads/
    clean_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    upload_path = UPLOADS_DIR / clean_filename
    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    private_key = load_private_key_from_path(key.private_key_path, key.algorithm)
    sig_bytes, dur_ns, dur_ms = sign_data(private_key, key.algorithm, file_bytes)

    sig_filename = f"{uuid.uuid4().hex}_{key.algorithm.lower().replace('-', '_')}.sig"
    sig_filepath = str(SIGNATURES_DIR / sig_filename)
    with open(sig_filepath, "wb") as f:
        f.write(sig_bytes)

    sig_b64 = base64.b64encode(sig_bytes).decode("utf-8")

    sig_record = SignatureModel(
        key_id=key.id,
        algorithm=key.algorithm,
        document_name=file.filename or "unknown",
        document_size_bytes=len(file_bytes),
        document_hash_sha256=doc_hash,
        signature_bytes_b64=sig_b64,
        signature_size_bytes=len(sig_bytes),
        signing_duration_ns=dur_ns,
        signing_duration_ms=dur_ms,
        public_key_fingerprint=key.fingerprint_sha256,
        verification_status="VALID"
    )

    db.add(sig_record)
    db.commit()
    db.refresh(sig_record)

    return sig_record


@router.post("/verify", response_model=VerifySignatureResponse)
def verify_document_signature(req: VerifySignatureRequest, db: Session = Depends(get_db)):
    try:
        doc_bytes = base64.b64decode(req.document_base64)
        sig_bytes = base64.b64decode(req.signature_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 input for document or signature")

    doc_hash = compute_sha256(doc_bytes)

    # Load public key
    public_key = None
    if req.key_id:
        key_record = db.query(KeyPairModel).filter(KeyPairModel.id == req.key_id).first()
        if not key_record:
            raise HTTPException(status_code=404, detail="Key pair not found")
        public_key = load_public_key(key_record.public_key_pem, key_record.public_key_raw_b64, key_record.algorithm)
        algo = key_record.algorithm
    elif req.public_key_pem:
        algo = req.algorithm
        public_key = load_public_key(req.public_key_pem, None, algo)
    else:
        raise HTTPException(status_code=400, detail="Either key_id or public_key_pem must be provided")

    is_valid, dur_ns, dur_ms, message = verify_data(public_key, algo, sig_bytes, doc_bytes)

    return VerifySignatureResponse(
        is_valid=is_valid,
        algorithm=algo,
        verification_duration_ms=dur_ms,
        document_hash_sha256=doc_hash,
        signature_size_bytes=len(sig_bytes),
        message=message
    )


@router.get("", response_model=List[SignatureResponse])
def list_signatures(db: Session = Depends(get_db)):
    return db.query(SignatureModel).order_by(SignatureModel.id.desc()).all()


@router.get("/{sig_id}", response_model=SignatureResponse)
def get_signature_detail(sig_id: int, db: Session = Depends(get_db)):
    sig = db.query(SignatureModel).filter(SignatureModel.id == sig_id).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signature record not found")
    return sig


@router.get("/{sig_id}/download")
def download_signature_file(sig_id: int, db: Session = Depends(get_db)):
    sig = db.query(SignatureModel).filter(SignatureModel.id == sig_id).first()
    if not sig:
        raise HTTPException(status_code=404, detail="Signature record not found")

    sig_bytes = base64.b64decode(sig.signature_bytes_b64)
    return Response(
        content=sig_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={sig.document_name}.sig"}
    )
