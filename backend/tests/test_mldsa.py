import pytest
from app.crypto.mldsa_pqc import (
    generate_mldsa44_keypair, sign_mldsa44, verify_mldsa44, get_mldsa44_public_key_fingerprint
)


def test_mldsa44_fips204_compliance():
    priv, pub, dur_ns, dur_ms, pub_pem, priv_pem, pub_raw_b64, pub_len, priv_len = generate_mldsa44_keypair()

    assert priv is not None
    assert pub is not None
    # FIPS 204 standardized public key raw size is exactly 1,312 bytes
    assert pub_len == 1312
    # Seed representation is 32 bytes (which expands to 2,560 bytes during internal execution)
    assert priv_len == 32

    fp = get_mldsa44_public_key_fingerprint(pub)
    assert len(fp) == 64

    # Sign data in FIPS 204 Pure Mode
    message = b"Standard ML-DSA-44 post-quantum document payload for NIST FIPS 204 verification"
    sig, s_ns, s_ms = sign_mldsa44(priv, message)

    # Standardized signature length is exactly 2,420 bytes
    assert len(sig) == 2420

    # Verify signature
    is_valid, v_ns, v_ms, msg = verify_mldsa44(pub, sig, message)
    assert is_valid is True

    # Mutated signature byte fails
    corrupted_sig = bytearray(sig)
    corrupted_sig[100] ^= 0xFF
    is_valid_bad_sig, _, _, _ = verify_mldsa44(pub, bytes(corrupted_sig), message)
    assert is_valid_bad_sig is False

    # Mutated message fails
    corrupted_msg = b"Standard ML-DSA-44 post-quantum document payload for NIST FIPS 204 modificatioN"
    is_valid_bad_msg, _, _, _ = verify_mldsa44(pub, sig, corrupted_msg)
    assert is_valid_bad_msg is False
