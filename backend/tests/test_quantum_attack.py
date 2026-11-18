import pytest
from app.crypto.quantum_attack import (
    generate_toy_rsa_key, shors_order_finding_simulation,
    execute_toy_rsa_quantum_attack, estimate_full_scale_quantum_attack
)


def test_toy_rsa_key_generation():
    key = generate_toy_rsa_key(bits=16)
    assert "p" in key and "q" in key and "n" in key
    assert key["p"] * key["q"] == key["n"]
    assert math_gcd(key["e"], key["phi"]) == 1


def test_shors_order_finding_and_forgery():
    result = execute_toy_rsa_quantum_attack(bits=16)
    assert result["target_algorithm"] == "RSA-16"
    assert result["status"] == "CRACKED"
    assert result["defense_passed"] is False  # RSA is cracked by quantum attack!
    assert result["recovered_prime_p"] is not None
    assert result["recovered_prime_q"] is not None
    assert result["signature_forged"] is True


def test_full_scale_quantum_resource_models():
    # RSA-2048: Cracked on CRQC
    res_rsa = estimate_full_scale_quantum_attack("RSA-2048")
    assert res_rsa["status"] == "THEORETICALLY_CRACKED"
    assert res_rsa["logical_qubits_required"] == 4098
    assert res_rsa["defense_passed"] is False

    # ECDSA P-256: Cracked on CRQC in ~9 minutes
    res_ec = estimate_full_scale_quantum_attack("ECDSA-P256")
    assert res_ec["status"] == "THEORETICALLY_CRACKED"
    assert res_ec["logical_qubits_required"] == 2330
    assert res_ec["defense_passed"] is False

    # ML-DSA-44: Quantum Resistant!
    res_pqc = estimate_full_scale_quantum_attack("ML-DSA-44")
    assert res_pqc["status"] == "QUANTUM_RESISTANT"
    assert res_pqc["defense_passed"] is True
    assert "Immune" in res_pqc["estimated_quantum_runtime"]


def math_gcd(a, b):
    import math
    return math.gcd(a, b)
