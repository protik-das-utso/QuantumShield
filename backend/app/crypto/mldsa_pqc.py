import time
import base64
import hashlib
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric import mldsa
from cryptography.hazmat.primitives import serialization


def generate_mldsa44_keypair() -> Tuple[
    mldsa.MLDSA44PrivateKey,
    mldsa.MLDSA44PublicKey,
    int,
    float,
    str,
    str,
    str,
    int,
    int
]:
    """
    Generates an ML-DSA-44 key pair according to NIST FIPS 204.
    Returns:
        (private_key, public_key, duration_ns, duration_ms, pub_pem, priv_pem, pub_raw_b64, pub_raw_len, priv_raw_len)
    """
    t0 = time.perf_counter_ns()
    private_key = mldsa.MLDSA44PrivateKey.generate()
    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0

    public_key = private_key.public_key()

    # Raw bytes according to FIPS 204
    pub_raw = public_key.public_bytes_raw()
    priv_raw = private_key.private_bytes_raw()

    # Standard SubjectPublicKeyInfo PEM/DER
    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode("utf-8")

    pub_raw_b64 = base64.b64encode(pub_raw).decode("utf-8")

    return (
        private_key,
        public_key,
        duration_ns,
        duration_ms,
        pub_pem,
        priv_pem,
        pub_raw_b64,
        len(pub_raw),  # Exactly 1312 bytes
        len(priv_raw)   # 32 bytes seed (expands to 2560 bytes during signature generation)
    )


def sign_mldsa44(private_key: mldsa.MLDSA44PrivateKey, data: bytes) -> Tuple[bytes, int, float]:
    """
    Signs data using ML-DSA-44 (FIPS 204 Pure Mode).
    Returns:
        (signature_bytes, duration_ns, duration_ms)
    """
    t0 = time.perf_counter_ns()
    signature = private_key.sign(data)
    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0
    return signature, duration_ns, duration_ms


def verify_mldsa44(public_key: mldsa.MLDSA44PublicKey, signature: bytes, data: bytes) -> Tuple[bool, int, float, str]:
    """
    Verifies an ML-DSA-44 signature according to NIST FIPS 204.
    Returns:
        (is_valid, duration_ns, duration_ms, message)
    """
    t0 = time.perf_counter_ns()
    try:
        public_key.verify(signature, data)
        t1 = time.perf_counter_ns()
        return True, t1 - t0, (t1 - t0) / 1_000_000.0, "ML-DSA-44 signature verified successfully (FIPS 204)."
    except Exception as e:
        t1 = time.perf_counter_ns()
        return False, t1 - t0, (t1 - t0) / 1_000_000.0, f"Verification failed: {str(e)}"


def get_mldsa44_public_key_fingerprint(public_key: mldsa.MLDSA44PublicKey) -> str:
    raw = public_key.public_bytes_raw()
    return hashlib.sha256(raw).hexdigest()
