import pytest
from app.crypto.rsa_pki import generate_rsa_keypair, sign_rsa_pss, verify_rsa_pss, get_public_key_fingerprint
from app.crypto.ecdsa_pki import generate_ecdsa_keypair, sign_ecdsa_p256, verify_ecdsa_p256, get_ecdsa_public_key_fingerprint


def test_rsa_keygen_sign_verify():
    priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_rsa_keypair(2048)
    assert priv is not None
    assert pub is not None
    assert pub_len > 250
    assert priv_len > 1000
    assert "BEGIN PUBLIC KEY" in pub_pem
    assert "BEGIN PRIVATE KEY" in priv_pem

    fp = get_public_key_fingerprint(pub)
    assert len(fp) == 64

    data = b"Evaluating RSA-2048 PSS signatures in PQC-PKI Platform"
    sig, s_ns, s_ms = sign_rsa_pss(priv, data)
    assert len(sig) == 256  # 2048 bits = 256 bytes

    is_valid, v_ns, v_ms, msg = verify_rsa_pss(pub, sig, data)
    assert is_valid is True

    # Tampered data should fail
    tampered_data = b"Evaluating RSA-2048 PSS signatures in PQC-PKI PlatforM"
    is_valid_tampered, _, _, _ = verify_rsa_pss(pub, sig, tampered_data)
    assert is_valid_tampered is False


def test_ecdsa_keygen_sign_verify():
    priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_len, priv_len = generate_ecdsa_keypair()
    assert priv is not None
    assert pub is not None
    assert "BEGIN PUBLIC KEY" in pub_pem

    fp = get_ecdsa_public_key_fingerprint(pub)
    assert len(fp) == 64

    data = b"Evaluating ECDSA NIST P-256 in PQC-PKI Platform"
    sig, s_ns, s_ms = sign_ecdsa_p256(priv, data)
    assert 64 <= len(sig) <= 72  # ASN.1 DER encoded ECDSA signature is ~70-72 bytes

    is_valid, v_ns, v_ms, msg = verify_ecdsa_p256(pub, sig, data)
    assert is_valid is True

    # Wrong data fails
    is_valid_tampered, _, _, _ = verify_ecdsa_p256(pub, sig, b"Wrong data")
    assert is_valid_tampered is False
