import time
import datetime
from typing import Tuple, List, Optional
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, padding


def create_root_ca(
    private_key,
    public_key,
    common_name: str,
    organization: str,
    organizational_unit: Optional[str],
    country: str,
    state: Optional[str],
    locality: Optional[str],
    validity_days: int = 3650
) -> Tuple[x509.Certificate, str, str, datetime.datetime, datetime.datetime, int]:
    """
    Creates a self-signed Root CA certificate with X.509 v3 extensions.
    """
    name_attributes = [
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
        x509.NameAttribute(NameOID.COUNTRY_NAME, country),
    ]
    if organizational_unit:
        name_attributes.append(x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, organizational_unit))
    if state:
        name_attributes.append(x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, state))
    if locality:
        name_attributes.append(x509.NameAttribute(NameOID.LOCALITY_NAME, locality))

    subject = issuer = x509.Name(name_attributes)
    serial_number = x509.random_serial_number()

    now = datetime.datetime.now(datetime.timezone.utc)
    valid_from = now - datetime.timedelta(minutes=5)
    valid_to = now + datetime.timedelta(days=validity_days)

    builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(public_key)
        .serial_number(serial_number)
        .not_valid_before(valid_from)
        .not_valid_after(valid_to)
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=None),
            critical=True
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False
            ),
            critical=True
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(public_key),
            critical=False
        )
    )

    # Authority Key Identifier for self-signed root cert
    ski = x509.SubjectKeyIdentifier.from_public_key(public_key)
    builder = builder.add_extension(
        x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(ski),
        critical=False
    )

    certificate = builder.sign(
        private_key=private_key,
        algorithm=hashes.SHA256()
    )

    cert_pem = certificate.public_bytes(serialization.Encoding.PEM).decode("utf-8")
    return certificate, cert_pem, hex(serial_number), valid_from, valid_to, len(certificate.public_bytes(serialization.Encoding.DER))


def issue_end_entity_certificate(
    ca_certificate: x509.Certificate,
    ca_private_key,
    subject_public_key,
    common_name: str,
    organization: Optional[str] = "End User Entity",
    organizational_unit: Optional[str] = "Research Node",
    country: Optional[str] = "US",
    validity_days: int = 365,
    dns_san: Optional[List[str]] = None
) -> Tuple[x509.Certificate, str, str, datetime.datetime, datetime.datetime, int, int, float]:
    """
    Issues an X.509 end-entity certificate signed by the Root CA.
    Returns:
        (cert, cert_pem, serial_hex, valid_from, valid_to, cert_size_bytes, duration_ns, duration_ms)
    """
    t0 = time.perf_counter_ns()

    name_attributes = [
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ]
    if organization:
        name_attributes.append(x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization))
    if organizational_unit:
        name_attributes.append(x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, organizational_unit))
    if country:
        name_attributes.append(x509.NameAttribute(NameOID.COUNTRY_NAME, country))

    subject = x509.Name(name_attributes)
    issuer = ca_certificate.subject
    serial_number = x509.random_serial_number()

    now = datetime.datetime.now(datetime.timezone.utc)
    valid_from = now - datetime.timedelta(minutes=5)
    valid_to = now + datetime.timedelta(days=validity_days)

    is_rsa = isinstance(subject_public_key, rsa.RSAPublicKey)

    builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(subject_public_key)
        .serial_number(serial_number)
        .not_valid_before(valid_from)
        .not_valid_after(valid_to)
        .add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=True,
                key_encipherment=is_rsa,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False
            ),
            critical=True
        )
        .add_extension(
            x509.ExtendedKeyUsage([
                ExtendedKeyUsageOID.SERVER_AUTH,
                ExtendedKeyUsageOID.CLIENT_AUTH,
                ExtendedKeyUsageOID.CODE_SIGNING
            ]),
            critical=False
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(subject_public_key),
            critical=False
        )
    )

    # Authority Key Identifier from CA certificate
    ca_ski_ext = None
    try:
        ca_ski_ext = ca_certificate.extensions.get_extension_for_oid(x509.ExtensionOID.SUBJECT_KEY_IDENTIFIER)
        builder = builder.add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(ca_ski_ext.value),
            critical=False
        )
    except Exception:
        pass

    if dns_san:
        san_entries = [x509.DNSName(name) for name in dns_san]
        builder = builder.add_extension(
            x509.SubjectAlternativeName(san_entries),
            critical=False
        )

    certificate = builder.sign(
        private_key=ca_private_key,
        algorithm=hashes.SHA256()
    )

    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0

    cert_pem = certificate.public_bytes(serialization.Encoding.PEM).decode("utf-8")
    cert_der = certificate.public_bytes(serialization.Encoding.DER)

    return (
        certificate,
        cert_pem,
        hex(serial_number),
        valid_from,
        valid_to,
        len(cert_der),
        duration_ns,
        duration_ms
    )


def verify_certificate_chain(
    cert: x509.Certificate,
    issuer_cert: x509.Certificate
) -> Tuple[bool, int, float, dict]:
    """
    Validates an X.509 certificate against its issuer CA.
    Checks:
    1. Signature validity
    2. Date / validity period
    3. Subject and Issuer DN matching
    """
    t0 = time.perf_counter_ns()
    issuer_public_key = issuer_cert.public_key()
    details = {}

    # Check dates
    now = datetime.datetime.now(datetime.timezone.utc)
    is_time_valid = (cert.not_valid_before_utc <= now <= cert.not_valid_after_utc)
    details["is_time_valid"] = is_time_valid
    details["not_valid_before"] = cert.not_valid_before_utc.isoformat()
    details["not_valid_after"] = cert.not_valid_after_utc.isoformat()

    # Check Issuer DN
    issuer_match = (cert.issuer == issuer_cert.subject)
    details["issuer_dn_match"] = issuer_match

    # Verify cryptographic signature
    is_sig_valid = False
    try:
        if isinstance(issuer_public_key, rsa.RSAPublicKey):
            issuer_public_key.verify(
                cert.signature,
                cert.tbs_certificate_bytes,
                padding.PKCS1v15(),
                cert.signature_hash_algorithm
            )
            is_sig_valid = True
        elif isinstance(issuer_public_key, ec.EllipticCurvePublicKey):
            issuer_public_key.verify(
                cert.signature,
                cert.tbs_certificate_bytes,
                ec.ECDSA(cert.signature_hash_algorithm)
            )
            is_sig_valid = True
    except Exception as e:
        details["signature_error"] = str(e)
        is_sig_valid = False

    details["is_signature_valid"] = is_sig_valid

    t1 = time.perf_counter_ns()
    duration_ns = t1 - t0
    duration_ms = duration_ns / 1_000_000.0

    overall = is_time_valid and issuer_match and is_sig_valid
    return overall, duration_ns, duration_ms, details


def generate_crl(
    ca_certificate: x509.Certificate,
    ca_private_key,
    revoked_certificates: List[Tuple[int, datetime.datetime, str]],
    crl_number: int = 1
) -> str:
    """
    Builds and signs a real X.509 CRL for revoked certificates.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    builder = (
        x509.CertificateRevocationListBuilder()
        .issuer_name(ca_certificate.subject)
        .last_update(now)
        .next_update(now + datetime.timedelta(days=7))
    )

    reason_mapping = {
        "keyCompromise": x509.ReasonFlags.key_compromise,
        "caCompromise": x509.ReasonFlags.ca_compromise,
        "affiliationChanged": x509.ReasonFlags.affiliation_changed,
        "superseded": x509.ReasonFlags.superseded,
        "cessationOfOperation": x509.ReasonFlags.cessation_of_operation,
        "certificateHold": x509.ReasonFlags.certificate_hold,
    }

    for serial, rev_date, reason_str in revoked_certificates:
        reason_flag = reason_mapping.get(reason_str, x509.ReasonFlags.unspecified)
        rev_builder = (
            x509.RevokedCertificateBuilder()
            .serial_number(serial)
            .revocation_date(rev_date)
            .add_extension(
                x509.CRLReason(reason_flag),
                critical=False
            )
        )
        builder = builder.add_revoked_certificate(rev_builder.build())

    # Add CRL Number
    builder = builder.add_extension(
        x509.CRLNumber(crl_number),
        critical=False
    )

    crl = builder.sign(
        private_key=ca_private_key,
        algorithm=hashes.SHA256()
    )

    return crl.public_bytes(serialization.Encoding.PEM).decode("utf-8")
