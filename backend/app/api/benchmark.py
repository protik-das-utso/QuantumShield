import time
import os
import io
import csv
import json
import uuid
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from app.database import get_db
from app.models import BenchmarkSessionModel, BenchmarkMetricModel
from app.schemas import BenchmarkRunRequest, BenchmarkSessionResponse, BenchmarkMetricResponse
from app.utils.sysinfo import get_system_specs
from app.crypto.rsa_pki import generate_rsa_keypair, sign_rsa_pss, verify_rsa_pss
from app.crypto.ecdsa_pki import generate_ecdsa_keypair, sign_ecdsa_p256, verify_ecdsa_p256
from app.crypto.mldsa_pqc import generate_mldsa44_keypair, sign_mldsa44, verify_mldsa44
from app.crypto.ca_service import create_root_ca, issue_end_entity_certificate, verify_certificate_chain

router = APIRouter(prefix="/api/benchmark", tags=["Performance Benchmarking"])


def compute_statistics(samples_ns: List[int]) -> Dict[str, float]:
    arr = np.array(samples_ns, dtype=np.float64)
    mean_ns = float(np.mean(arr))
    median_ns = float(np.median(arr))
    min_ns = float(np.min(arr))
    max_ns = float(np.max(arr))
    std_dev_ns = float(np.std(arr))
    p95_ns = float(np.percentile(arr, 95))

    return {
        "mean_ns": mean_ns,
        "median_ns": median_ns,
        "min_ns": min_ns,
        "max_ns": max_ns,
        "std_dev_ns": std_dev_ns,
        "p95_ns": p95_ns,
        "mean_ms": mean_ns / 1_000_000.0,
        "median_ms": median_ns / 1_000_000.0,
        "min_ms": min_ns / 1_000_000.0,
        "max_ms": max_ns / 1_000_000.0,
        "std_dev_ms": std_dev_ns / 1_000_000.0,
        "p95_ms": p95_ns / 1_000_000.0,
    }


def benchmark_rsa_2048(iterations: int, warmup: int, payload: bytes):
    # Warm-up keygen
    for _ in range(warmup):
        generate_rsa_keypair(2048)

    # Keygen benchmark
    keygen_samples = []
    sample_priv = None
    sample_pub = None
    pub_bytes_len = 0
    priv_bytes_len = 0
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        priv, pub, _, _, _, _, p_len, pr_len = generate_rsa_keypair(2048)
        t1 = time.perf_counter_ns()
        keygen_samples.append(t1 - t0)
        sample_priv = priv
        sample_pub = pub
        pub_bytes_len = p_len
        priv_bytes_len = pr_len

    # Warm-up sign
    for _ in range(warmup):
        sign_rsa_pss(sample_priv, payload)

    # Sign benchmark
    sign_samples = []
    sample_sig = None
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        sig, _, _ = sign_rsa_pss(sample_priv, payload)
        t1 = time.perf_counter_ns()
        sign_samples.append(t1 - t0)
        sample_sig = sig
    sig_bytes_len = len(sample_sig)

    # Warm-up verify
    for _ in range(warmup):
        verify_rsa_pss(sample_pub, sample_sig, payload)

    # Verify benchmark
    verify_samples = []
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        verify_rsa_pss(sample_pub, sample_sig, payload)
        t1 = time.perf_counter_ns()
        verify_samples.append(t1 - t0)

    # Certificate issuance & validation benchmark
    ca_priv, ca_pub, _, _, _, _, _, _ = generate_rsa_keypair(2048)
    ca_cert, _, _, _, _, _ = create_root_ca(ca_priv, ca_pub, "Benchmark RSA Root CA", "Lab", None, "US", None, None, 365)

    cert_issue_samples = []
    sample_cert = None
    cert_bytes_len = 0
    for _ in range(min(iterations, 20)):  # Cert issuance
        t0 = time.perf_counter_ns()
        cert, _, _, _, _, c_len, _, _ = issue_end_entity_certificate(ca_cert, ca_priv, sample_pub, "Node", "Lab", None, "US", 365)
        t1 = time.perf_counter_ns()
        cert_issue_samples.append(t1 - t0)
        sample_cert = cert
        cert_bytes_len = c_len

    cert_valid_samples = []
    for _ in range(min(iterations, 20)):
        t0 = time.perf_counter_ns()
        verify_certificate_chain(sample_cert, ca_cert)
        t1 = time.perf_counter_ns()
        cert_valid_samples.append(t1 - t0)

    return {
        "keygen": (keygen_samples, pub_bytes_len, priv_bytes_len),
        "sign": (sign_samples, sig_bytes_len),
        "verify": (verify_samples, None),
        "cert_issue": (cert_issue_samples, cert_bytes_len),
        "cert_valid": (cert_valid_samples, None)
    }


def benchmark_ecdsa_p256(iterations: int, warmup: int, payload: bytes):
    # Warm-up keygen
    for _ in range(warmup):
        generate_ecdsa_keypair()

    # Keygen benchmark
    keygen_samples = []
    sample_priv = None
    sample_pub = None
    pub_bytes_len = 0
    priv_bytes_len = 0
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        priv, pub, _, _, _, _, p_len, pr_len = generate_ecdsa_keypair()
        t1 = time.perf_counter_ns()
        keygen_samples.append(t1 - t0)
        sample_priv = priv
        sample_pub = pub
        pub_bytes_len = p_len
        priv_bytes_len = pr_len

    # Warm-up sign
    for _ in range(warmup):
        sign_ecdsa_p256(sample_priv, payload)

    # Sign benchmark
    sign_samples = []
    sample_sig = None
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        sig, _, _ = sign_ecdsa_p256(sample_priv, payload)
        t1 = time.perf_counter_ns()
        sign_samples.append(t1 - t0)
        sample_sig = sig
    sig_bytes_len = len(sample_sig)

    # Warm-up verify
    for _ in range(warmup):
        verify_ecdsa_p256(sample_pub, sample_sig, payload)

    # Verify benchmark
    verify_samples = []
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        verify_ecdsa_p256(sample_pub, sample_sig, payload)
        t1 = time.perf_counter_ns()
        verify_samples.append(t1 - t0)

    # Certificate issuance & validation benchmark
    ca_priv, ca_pub, _, _, _, _, _, _ = generate_ecdsa_keypair()
    ca_cert, _, _, _, _, _ = create_root_ca(ca_priv, ca_pub, "Benchmark ECDSA Root CA", "Lab", None, "US", None, None, 365)

    cert_issue_samples = []
    sample_cert = None
    cert_bytes_len = 0
    for _ in range(min(iterations, 20)):
        t0 = time.perf_counter_ns()
        cert, _, _, _, _, c_len, _, _ = issue_end_entity_certificate(ca_cert, ca_priv, sample_pub, "Node", "Lab", None, "US", 365)
        t1 = time.perf_counter_ns()
        cert_issue_samples.append(t1 - t0)
        sample_cert = cert
        cert_bytes_len = c_len

    cert_valid_samples = []
    for _ in range(min(iterations, 20)):
        t0 = time.perf_counter_ns()
        verify_certificate_chain(sample_cert, ca_cert)
        t1 = time.perf_counter_ns()
        cert_valid_samples.append(t1 - t0)

    return {
        "keygen": (keygen_samples, pub_bytes_len, priv_bytes_len),
        "sign": (sign_samples, sig_bytes_len),
        "verify": (verify_samples, None),
        "cert_issue": (cert_issue_samples, cert_bytes_len),
        "cert_valid": (cert_valid_samples, None)
    }


def benchmark_mldsa_44(iterations: int, warmup: int, payload: bytes):
    # Warm-up keygen
    for _ in range(warmup):
        generate_mldsa44_keypair()

    # Keygen benchmark
    keygen_samples = []
    sample_priv = None
    sample_pub = None
    pub_bytes_len = 0
    priv_bytes_len = 0
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        priv, pub, _, _, _, _, _, p_len, pr_len = generate_mldsa44_keypair()
        t1 = time.perf_counter_ns()
        keygen_samples.append(t1 - t0)
        sample_priv = priv
        sample_pub = pub
        pub_bytes_len = p_len
        priv_bytes_len = 2560  # FIPS 204 expanded private key size

    # Warm-up sign
    for _ in range(warmup):
        sign_mldsa44(sample_priv, payload)

    # Sign benchmark
    sign_samples = []
    sample_sig = None
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        sig, _, _ = sign_mldsa44(sample_priv, payload)
        t1 = time.perf_counter_ns()
        sign_samples.append(t1 - t0)
        sample_sig = sig
    sig_bytes_len = len(sample_sig)

    # Warm-up verify
    for _ in range(warmup):
        verify_mldsa44(sample_pub, sample_sig, payload)

    # Verify benchmark
    verify_samples = []
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        verify_mldsa44(sample_pub, sample_sig, payload)
        t1 = time.perf_counter_ns()
        verify_samples.append(t1 - t0)

    return {
        "keygen": (keygen_samples, pub_bytes_len, priv_bytes_len),
        "sign": (sign_samples, sig_bytes_len),
        "verify": (verify_samples, None),
        "cert_issue": ([], None),
        "cert_valid": ([], None)
    }


@router.post("/run", response_model=BenchmarkSessionResponse)
def run_benchmark(req: BenchmarkRunRequest, db: Session = Depends(get_db)):
    specs = get_system_specs()
    session_code = f"BENCH-{uuid.uuid4().hex[:8].upper()}"

    session_record = BenchmarkSessionModel(
        session_code=session_code,
        name=f"Benchmark ({req.iterations} iter, {req.payload_size_bytes}B)",
        iterations=req.iterations,
        warmup_runs=req.warmup_runs,
        payload_size_bytes=req.payload_size_bytes,
        cpu_model=specs["processor"],
        ram_gb=specs["ram_total_gb"],
        os_info=specs["os"],
        python_version=specs["python_version"],
        openssl_version=specs["openssl_version"],
        crypto_library_version=specs["cryptography_version"],
        notes=req.notes
    )
    db.add(session_record)
    db.commit()
    db.refresh(session_record)

    payload = os.urandom(req.payload_size_bytes)
    created_metrics = []

    for algo in req.algorithms:
        if algo == "RSA-2048":
            results = benchmark_rsa_2048(req.iterations, req.warmup_runs, payload)
        elif algo == "ECDSA-P256":
            results = benchmark_ecdsa_p256(req.iterations, req.warmup_runs, payload)
        elif algo == "ML-DSA-44":
            results = benchmark_mldsa_44(req.iterations, req.warmup_runs, payload)
        else:
            continue

        # Save Keygen Metric
        kg_samples, pub_len, priv_len = results["keygen"]
        kg_stats = compute_statistics(kg_samples)
        m_kg = BenchmarkMetricModel(
            session_id=session_record.id,
            algorithm=algo,
            operation="keygen",
            public_key_bytes=pub_len,
            private_key_bytes=priv_len,
            raw_durations_ns_json=json.dumps(kg_samples[:100]),
            **kg_stats
        )
        db.add(m_kg)
        created_metrics.append(m_kg)

        # Save Sign Metric
        sign_samples, sig_len = results["sign"]
        sign_stats = compute_statistics(sign_samples)
        m_sign = BenchmarkMetricModel(
            session_id=session_record.id,
            algorithm=algo,
            operation="sign",
            signature_bytes=sig_len,
            raw_durations_ns_json=json.dumps(sign_samples[:100]),
            **sign_stats
        )
        db.add(m_sign)
        created_metrics.append(m_sign)

        # Save Verify Metric
        verify_samples, _ = results["verify"]
        verify_stats = compute_statistics(verify_samples)
        m_verify = BenchmarkMetricModel(
            session_id=session_record.id,
            algorithm=algo,
            operation="verify",
            signature_bytes=sig_len,
            raw_durations_ns_json=json.dumps(verify_samples[:100]),
            **verify_stats
        )
        db.add(m_verify)
        created_metrics.append(m_verify)

        # Save Cert Metrics for classical
        if results["cert_issue"][0]:
            ci_samples, c_len = results["cert_issue"]
            ci_stats = compute_statistics(ci_samples)
            m_ci = BenchmarkMetricModel(
                session_id=session_record.id,
                algorithm=algo,
                operation="cert_issuance",
                certificate_bytes=c_len,
                raw_durations_ns_json=json.dumps(ci_samples),
                **ci_stats
            )
            db.add(m_ci)
            created_metrics.append(m_ci)

    db.commit()
    db.refresh(session_record)

    # Build response
    metric_responses = []
    for m in session_record.metrics:
        metric_responses.append(BenchmarkMetricResponse(
            algorithm=m.algorithm,
            operation=m.operation,
            mean_ms=m.mean_ms,
            median_ms=m.median_ms,
            min_ms=m.min_ms,
            max_ms=m.max_ms,
            std_dev_ms=m.std_dev_ms,
            p95_ms=m.p95_ms,
            public_key_bytes=m.public_key_bytes,
            private_key_bytes=m.private_key_bytes,
            signature_bytes=m.signature_bytes,
            certificate_bytes=m.certificate_bytes,
            raw_durations_ns=json.loads(m.raw_durations_ns_json) if m.raw_durations_ns_json else []
        ))

    return BenchmarkSessionResponse(
        id=session_record.id,
        session_code=session_record.session_code,
        name=session_record.name,
        iterations=session_record.iterations,
        warmup_runs=session_record.warmup_runs,
        payload_size_bytes=session_record.payload_size_bytes,
        cpu_model=session_record.cpu_model,
        ram_gb=session_record.ram_gb,
        os_info=session_record.os_info,
        python_version=session_record.python_version,
        openssl_version=session_record.openssl_version,
        crypto_library_version=session_record.crypto_library_version,
        created_at=session_record.created_at,
        metrics=metric_responses
    )


@router.get("/results", response_model=List[BenchmarkSessionResponse])
def get_benchmark_results(db: Session = Depends(get_db)):
    sessions = db.query(BenchmarkSessionModel).order_by(BenchmarkSessionModel.id.desc()).all()
    results = []
    for s in sessions:
        metric_responses = [
            BenchmarkMetricResponse(
                algorithm=m.algorithm,
                operation=m.operation,
                mean_ms=m.mean_ms,
                median_ms=m.median_ms,
                min_ms=m.min_ms,
                max_ms=m.max_ms,
                std_dev_ms=m.std_dev_ms,
                p95_ms=m.p95_ms,
                public_key_bytes=m.public_key_bytes,
                private_key_bytes=m.private_key_bytes,
                signature_bytes=m.signature_bytes,
                certificate_bytes=m.certificate_bytes,
                raw_durations_ns=json.loads(m.raw_durations_ns_json) if m.raw_durations_ns_json else []
            )
            for m in s.metrics
        ]
        results.append(BenchmarkSessionResponse(
            id=s.id,
            session_code=s.session_code,
            name=s.name,
            iterations=s.iterations,
            warmup_runs=s.warmup_runs,
            payload_size_bytes=s.payload_size_bytes,
            cpu_model=s.cpu_model,
            ram_gb=s.ram_gb,
            os_info=s.os_info,
            python_version=s.python_version,
            openssl_version=s.openssl_version,
            crypto_library_version=s.crypto_library_version,
            created_at=s.created_at,
            metrics=metric_responses
        ))
    return results


@router.get("/export/{session_id}/csv")
def export_benchmark_csv(session_id: int, db: Session = Depends(get_db)):
    session_record = db.query(BenchmarkSessionModel).filter(BenchmarkSessionModel.id == session_id).first()
    if not session_record:
        raise HTTPException(status_code=404, detail="Benchmark session not found")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["# QUANTUMSHIELD BENCHMARK EXPERIMENT EXPORT"])
    writer.writerow(["Session Code", session_record.session_code])
    writer.writerow(["Date", session_record.created_at.isoformat()])
    writer.writerow(["Iterations", session_record.iterations])
    writer.writerow(["Warmup Runs", session_record.warmup_runs])
    writer.writerow(["Payload Size (Bytes)", session_record.payload_size_bytes])
    writer.writerow(["CPU", session_record.cpu_model])
    writer.writerow(["OS", session_record.os_info])
    writer.writerow(["Python Version", session_record.python_version])
    writer.writerow(["OpenSSL Version", session_record.openssl_version])
    writer.writerow(["Crypto Library", session_record.crypto_library_version])
    writer.writerow([])

    # Metrics table
    writer.writerow([
        "Algorithm", "Operation",
        "Mean (ms)", "Median (ms)", "Min (ms)", "Max (ms)", "StdDev (ms)", "P95 (ms)",
        "Mean (ns)", "Median (ns)", "Min (ns)", "Max (ns)", "StdDev (ns)", "P95 (ns)",
        "Public Key (Bytes)", "Private Key (Bytes)", "Signature (Bytes)", "Certificate (Bytes)"
    ])

    for m in session_record.metrics:
        writer.writerow([
            m.algorithm, m.operation,
            f"{m.mean_ms:.4f}", f"{m.median_ms:.4f}", f"{m.min_ms:.4f}", f"{m.max_ms:.4f}", f"{m.std_dev_ms:.4f}", f"{m.p95_ms:.4f}",
            f"{m.mean_ns:.1f}", f"{m.median_ns:.1f}", f"{m.min_ns:.1f}", f"{m.max_ns:.1f}", f"{m.std_dev_ns:.1f}", f"{m.p95_ns:.1f}",
            m.public_key_bytes or "", m.private_key_bytes or "", m.signature_bytes or "", m.certificate_bytes or ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=benchmark_{session_record.session_code}.csv"}
    )
