import datetime
import pytest
from app.crypto.rsa_pki import generate_rsa_keypair
from app.crypto.ca_service import (
    create_root_ca, issue_end_entity_certificate, verify_certificate_chain, generate_crl
)


def test_root_ca_and_cert_issuance_and_crl():
    ca_priv, ca_pub, _, _, _, _, _, _ = generate_rsa_keypair(2048)
    sub_priv, sub_pub, _, _, _, _, _, _ = generate_rsa_keypair(2048)

    # 1. Create Root CA
    ca_cert, ca_pem, ca_serial, ca_vf, ca_vt, ca_len = create_root_ca(
        private_key=ca_priv,
        public_key=ca_pub,
        common_name="QuantumShield Research Test CA",
        organization="Test Org",
        organizational_unit="PKI Lab",
        country="US",
        state="CA",
        locality="SF",
        validity_days=365
    )
    assert ca_cert is not None
    assert "BEGIN CERTIFICATE" in ca_pem

    # 2. Issue End Entity Cert
    cert, cert_pem, serial_hex, vf, vt, clen, dur_ns, dur_ms = issue_end_entity_certificate(
        ca_certificate=ca_cert,
        ca_private_key=ca_priv,
        subject_public_key=sub_pub,
        common_name="client.research.local",
        organization="Test Org",
        organizational_unit="Node A",
        country="US",
        validity_days=90,
        dns_san=["client.research.local", "node-a.local"]
    )
    assert cert is not None
    assert "BEGIN CERTIFICATE" in cert_pem
    assert clen > 500

    # 3. Verify Chain
    overall, v_ns, v_ms, details = verify_certificate_chain(cert, ca_cert)
    assert overall is True
    assert details["is_signature_valid"] is True
    assert details["is_time_valid"] is True
    assert details["issuer_dn_match"] is True

    # 4. Generate CRL
    revoked_list = [
        (int(serial_hex, 16), datetime.datetime.now(datetime.timezone.utc), "keyCompromise")
    ]
    crl_pem = generate_crl(ca_cert, ca_priv, revoked_list, crl_number=1)
    assert "BEGIN X509 CRL" in crl_pem
