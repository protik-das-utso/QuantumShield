import pytest
from app.crypto.mldsa_pqc import generate_mldsa44_keypair, sign_mldsa44, verify_mldsa44
from app.crypto.rsa_pki import generate_rsa_keypair, sign_rsa_pss, verify_rsa_pss


def test_attack_document_tampering_detected():
    priv, pub, _, _, _, _, _, _, _ = generate_mldsa44_keypair()
    original_data = b"TRANSFER 1,000,000 ETH TO WALLET 0xDEADBEEF"
    sig, _, _ = sign_mldsa44(priv, original_data)

    # Attacker modifies 1 character
    tampered_data = b"TRANSFER 1,000,000 ETH TO WALLET 0xCAFEBABE"

    is_valid, _, _, _ = verify_mldsa44(pub, sig, tampered_data)
    assert is_valid is False  # Attack detected!


def test_attack_signature_tampering_detected():
    priv, pub, _, _, _, _, _, _ = generate_rsa_keypair(2048)
    data = b"VALID TRANSACTION 1002"
    sig, _, _ = sign_rsa_pss(priv, data)

    # Mutate signature byte
    mutated_sig = bytearray(sig)
    mutated_sig[10] ^= 0x55

    is_valid, _, _, _ = verify_rsa_pss(pub, bytes(mutated_sig), data)
    assert is_valid is False  # Attack detected!


def test_attack_wrong_public_key_detected():
    priv_a, pub_a, _, _, _, _, _, _, _ = generate_mldsa44_keypair()
    priv_b, pub_b, _, _, _, _, _, _, _ = generate_mldsa44_keypair()

    data = b"IMPORTANT DIRECTIVE"
    sig_a, _, _ = sign_mldsa44(priv_a, data)

    # Verify with Key B
    is_valid, _, _, _ = verify_mldsa44(pub_b, sig_a, data)
    assert is_valid is False  # Attack detected!
