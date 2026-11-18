import base64
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_system_info():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ONLINE"

    res_info = client.get("/api/system/info")
    assert res_info.status_code == 200
    data = res_info.json()
    assert data["mldsa_fips204_available"] is True
    assert "OpenSSL" in data["openssl_version"]

    res_stats = client.get("/api/system/stats")
    assert res_stats.status_code == 200


def test_keygen_and_pqc_flow():
    uid = uuid.uuid4().hex[:6]
    # 1. Classical RSA
    res_rsa = client.post("/api/classical/generate-key", json={
        "algorithm": "RSA-2048",
        "alias": f"api_test_rsa_{uid}"
    })
    assert res_rsa.status_code == 200
    rsa_id = res_rsa.json()["id"]

    # 2. PQC ML-DSA-44
    res_pqc = client.post("/api/pqc/generate-key", json={
        "algorithm": "ML-DSA-44",
        "alias": f"api_test_mldsa_{uid}"
    })
    assert res_pqc.status_code == 200
    pqc_data = res_pqc.json()
    assert pqc_data["public_key_bytes_len"] == 1312
    pqc_id = pqc_data["id"]

    # 3. Sign document with ML-DSA-44
    doc_text = "NIST FIPS 204 Evaluation Payload"
    doc_b64 = base64.b64encode(doc_text.encode("utf-8")).decode("utf-8")

    res_sign = client.post("/api/signatures/sign", json={
        "key_id": pqc_id,
        "document_base64": doc_b64,
        "document_name": "fips204_test.txt"
    })
    assert res_sign.status_code == 200
    sig_data = res_sign.json()
    assert sig_data["signature_size_bytes"] == 2420

    # 4. Verify signature with ML-DSA-44
    res_verify = client.post("/api/signatures/verify", json={
        "key_id": pqc_id,
        "document_base64": doc_b64,
        "signature_base64": sig_data["signature_bytes_b64"],
        "algorithm": "ML-DSA-44"
    })
    assert res_verify.status_code == 200
    assert res_verify.json()["is_valid"] is True


def test_attacks_and_experiments_flow():
    # Test document tampering API
    res_atk = client.post("/api/attacks/document-tampering", json={
        "algorithm": "ML-DSA-44",
        "test_type": "document_tamper"
    })
    assert res_atk.status_code == 200
    data = res_atk.json()
    assert data["defense_passed"] is True
    assert data["attack_status"] == "ATTACK_DETECTED"

    # Test small experiment run
    res_exp = client.post("/api/experiments", json={
        "title": "Automated Test Experiment Session",
        "iterations": 10,
        "payload_size_bytes": 512,
        "algorithms": ["ECDSA-P256", "ML-DSA-44"]
    })
    assert res_exp.status_code == 200
    exp_data = res_exp.json()
    assert len(exp_data["comparison_table"]) == 6

    # Test PDF report export
    exp_id = exp_data["id"]
    res_pdf = client.get(f"/api/reports/pdf/{exp_id}")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 1000
