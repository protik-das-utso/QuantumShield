import os
import base64
import hashlib
from typing import Tuple, Optional
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, ec, mldsa
from app.crypto.rsa_pki import sign_rsa_pss, verify_rsa_pss, get_public_key_fingerprint
from app.crypto.ecdsa_pki import sign_ecdsa_p256, verify_ecdsa_p256, get_ecdsa_public_key_fingerprint
from app.crypto.mldsa_pqc import sign_mldsa44, verify_mldsa44, get_mldsa44_public_key_fingerprint


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_private_key_from_path(key_path: str, algorithm: str):
    """
    Loads a private key from its file path depending on algorithm.
    """
    with open(key_path, "rb") as f:
        key_data = f.read()

    if algorithm == "ML-DSA-44":
        # Check if raw or PEM
        if b"BEGIN PRIVATE KEY" in key_data:
            return serialization.load_pem_private_key(key_data, password=None)
        elif len(key_data) == 32:
            return mldsa.MLDSA44PrivateKey.from_private_bytes(key_data)
        else:
            return serialization.load_der_private_key(key_data, password=None)
    else:
        return serialization.load_pem_private_key(key_data, password=None)


def load_public_key(pub_pem: Optional[str], raw_b64: Optional[str], algorithm: str):
    """
    Loads a public key from PEM string or raw base64.
    """
    if algorithm == "ML-DSA-44":
        if raw_b64:
            raw_bytes = base64.b64decode(raw_b64)
            return mldsa.MLDSA44PublicKey.from_public_bytes(raw_bytes)
        elif pub_pem:
            return serialization.load_pem_public_key(pub_pem.encode("utf-8"))
        else:
            raise ValueError("No public key data provided for ML-DSA-44")
    else:
        if not pub_pem:
            raise ValueError(f"PEM public key required for {algorithm}")
        return serialization.load_pem_public_key(pub_pem.encode("utf-8"))


def sign_data(private_key, algorithm: str, data: bytes) -> Tuple[bytes, int, float]:
    """
    Signs data using the specified algorithm.
    - RSA-2048: RSA-PSS + SHA-256
    - ECDSA-P256: ECDSA + SHA-256
    - ML-DSA-44: FIPS 204 Pure Mode
    """
    if algorithm == "RSA-2048":
        if not isinstance(private_key, rsa.RSAPrivateKey):
            raise TypeError("Expected RSAPrivateKey for RSA-2048")
        return sign_rsa_pss(private_key, data)

    elif algorithm == "ECDSA-P256":
        if not isinstance(private_key, ec.EllipticCurvePrivateKey):
            raise TypeError("Expected EllipticCurvePrivateKey for ECDSA-P256")
        return sign_ecdsa_p256(private_key, data)

    elif algorithm == "ML-DSA-44":
        if not isinstance(private_key, mldsa.MLDSA44PrivateKey):
            raise TypeError("Expected MLDSA44PrivateKey for ML-DSA-44")
        return sign_mldsa44(private_key, data)

    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def verify_data(public_key, algorithm: str, signature: bytes, data: bytes) -> Tuple[bool, int, float, str]:
    """
    Verifies data signature using the specified algorithm.
    """
    if algorithm == "RSA-2048":
        if not isinstance(public_key, rsa.RSAPublicKey):
            return False, 0, 0.0, "Invalid key type for RSA-2048 verification"
        return verify_rsa_pss(public_key, signature, data)

    elif algorithm == "ECDSA-P256":
        if not isinstance(public_key, ec.EllipticCurvePublicKey):
            return False, 0, 0.0, "Invalid key type for ECDSA-P256 verification"
        return verify_ecdsa_p256(public_key, signature, data)

    elif algorithm == "ML-DSA-44":
        if not isinstance(public_key, mldsa.MLDSA44PublicKey):
            return False, 0, 0.0, "Invalid key type for ML-DSA-44 verification"
        return verify_mldsa44(public_key, signature, data)

    else:
        return False, 0, 0.0, f"Unsupported algorithm: {algorithm}"


def get_key_fingerprint(public_key, algorithm: str) -> str:
    if algorithm == "RSA-2048":
        return get_public_key_fingerprint(public_key)
    elif algorithm == "ECDSA-P256":
        return get_ecdsa_public_key_fingerprint(public_key)
    elif algorithm == "ML-DSA-44":
        return get_mldsa44_public_key_fingerprint(public_key)
    else:
        raise ValueError(f"Unknown algorithm {algorithm}")
