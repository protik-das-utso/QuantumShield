import time
import hashlib
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization


def generate_ecdsa_keypair() -> Tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePublicKey, int, float, str, str, int, int]:
    """
    Generates an ECDSA key pair using NIST P-256 (SECP256R1).
    Returns:
        (private_key, public_key, duration_ns, duration_ms, pub_pem, priv_pem, pub_bytes_len, priv_bytes_len)
    """
    t0 = time.perf_counter_ns()
    private_key = ec.generate_private_key(ec.SECP256R1())
    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0

    public_key = private_key.public_key()

    pub_pem_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    priv_pem_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    pub_der_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    priv_der_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    return (
        private_key,
        public_key,
        duration_ns,
        duration_ms,
        pub_pem_bytes.decode("utf-8"),
        priv_pem_bytes.decode("utf-8"),
        len(pub_der_bytes),
        len(priv_der_bytes)
    )


def sign_ecdsa_p256(private_key: ec.EllipticCurvePrivateKey, data: bytes) -> Tuple[bytes, int, float]:
    """
    Signs data using ECDSA P-256 with SHA-256.
    Returns (signature_bytes, duration_ns, duration_ms)
    """
    t0 = time.perf_counter_ns()
    signature = private_key.sign(
        data,
        ec.ECDSA(hashes.SHA256())
    )
    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0
    return signature, duration_ns, duration_ms


def verify_ecdsa_p256(public_key: ec.EllipticCurvePublicKey, signature: bytes, data: bytes) -> Tuple[bool, int, float, str]:
    """
    Verifies an ECDSA P-256 signature.
    Returns (is_valid, duration_ns, duration_ms, message)
    """
    t0 = time.perf_counter_ns()
    try:
        public_key.verify(
            signature,
            data,
            ec.ECDSA(hashes.SHA256())
        )
        t1 = time.perf_counter_ns()
        return True, t1 - t0, (t1 - t0) / 1_000_000.0, "ECDSA signature verified successfully."
    except Exception as e:
        t1 = time.perf_counter_ns()
        return False, t1 - t0, (t1 - t0) / 1_000_000.0, f"Verification failed: {str(e)}"


def get_ecdsa_public_key_fingerprint(public_key: ec.EllipticCurvePublicKey) -> str:
    der = public_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return hashlib.sha256(der).hexdigest()
