# QuantumShield: Classical and Post-Quantum Public Key Infrastructure Evaluation Platform

**Undergraduate / Final-Year Thesis Research Project**  
*Evaluating the Migration from Classical Public Key Infrastructure (RSA & ECDSA) to Post-Quantum Cryptography (NIST FIPS 204 ML-DSA-44)*

---

## 1. Executive Summary & Research Objectives

The imminent arrival of fault-tolerant Cryptographically Relevant Quantum Computers (CRQCs) threatens the mathematical foundations of modern public-key infrastructure (PKI). Classical asymmetric algorithms—such as RSA (Integer Factorization) and ECDSA (Discrete Logarithms)—are theoretically breakable in polynomial time $\mathcal{O}((\log N)^3)$ via **Shor's Algorithm**.

To defend digital communications, the National Institute of Standards and Technology (NIST) standardized post-quantum cryptographic primitives, headlined by **ML-DSA (FIPS 204)**, a module-lattice digital signature scheme based on the **Module Learning With Errors (M-LWE)** and **Module Short Integer Solution (M-SIS)** problems.

**QuantumShield** is a research-grade evaluation platform designed to empirically measure, benchmark, and analyze the architectural trade-offs of migrating classical PKI systems to post-quantum signatures.

> **Important Research Disclaimer:**  
> This platform evaluates cryptographic migration and operational overhead. It does **not** claim to execute a quantum cryptanalysis attack against RSA-2048 on classical hardware. All cryptographic keys, certificates, digital signatures, and benchmarks are calculated live using verified cryptographic libraries without simulated or fabricated outputs.

---

## 2. Platform Architecture & Technology Stack

The application employs a decoupled, research-grade microservice architecture:

```
+-------------------------------------------------------------------------------+
|                             CLIENT / BROWSER                                  |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts        |
|  (Dark Navy Theme, Interactive Visualizations, Modal Inspectors, Live Stats)  |
+-------------------------------------------------------------------------------+
                                      ▲
                                      │ HTTP REST API (Port 8000 / Proxy 5173)
                                      ▼
+-------------------------------------------------------------------------------+
|                             FASTAPI BACKEND                                   |
|  Python 3.12 + FastAPI + Uvicorn + Pydantic v2 + SQLite + SQLAlchemy ORM     |
|  High-Precision Benchmarking (time.perf_counter_ns) + ReportLab PDF Engine    |
+-------------------------------------------------------------------------------+
           │                                                │
           ▼                                                ▼
+---------------------------------------+    +----------------------------------+
|      CLASSICAL PKI SUBSYSTEM          |    |     POST-QUANTUM SUBSYSTEM       |
|  * Python Cryptography Hazmat 50.0    |    |  * Native OpenSSL 4.0 FIPS 204   |
|  * RSA-2048 (RSA-PSS + SHA-256)       |    |  * ML-DSA-44 (Pure Mode)         |
|  * ECDSA NIST P-256 (SHA-256)         |    |  * Public Key: 1,312 Bytes       |
|  * X.509 v3 Root CA & End-Entity Certs|    |  * Secret Key: 2,560 Bytes (Exp) |
|  * Signed RFC 5280 CRL Generation     |    |  * Signature: 2,420 Bytes        |
+---------------------------------------+    +----------------------------------+
```

### Technology Matrix:
* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite.
* **Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic, SQLAlchemy, NumPy, Pandas, ReportLab.
* **Cryptography:** Python `cryptography` library (v50.0.2), OpenSSL 4.0.3, NIST FIPS 204 Hazmat.
* **Data Storage:** SQLite (`pqc_pki.db`), filesystem key and signature vaults (`storage/`).

---

## 3. Core Modules & Features

The platform provides 12 dedicated functional views accessible via the sidebar:

1. **Dashboard:** Live research statistics, signing volume, attack mitigation counts, and real-time comparison bar charts.
2. **Classical PKI:** Key generation for RSA-2048 and ECDSA P-256 with microsecond timing, fingerprinting, and PEM exports.
3. **Certificate Authority (CA):** Self-signed X.509 v3 Root CA creation, KeyUsage and CRLSign extensions, and real signed CRL downloads.
4. **Certificate Manager:** End-entity certificate issuance (SANs, KeyUsage), chain validation, real-time trust checking, and RFC 5280 revocation.
5. **Digital Signature:** Upload documents (PDF, DOCX, TXT, binary) or raw payloads, calculate SHA-256 digests, and sign via RSA-PSS, ECDSA, or ML-DSA-44 Pure Mode.
6. **Post-Quantum Cryptography:** Dedicated ML-DSA-44 module according to NIST FIPS 204. Raw 1,312-byte public key and 2,420-byte signature validation.
7. **Attack Simulation Laboratory:** Controlled security testing against bit-tampered documents, mutated signatures, key substitution attacks, random entropy forgery, and revoked certificates.
8. **Performance Benchmarking:** Reproducible test harness (configurable iterations $N \ge 100$, warmups, `time.perf_counter_ns()`, mean, median, min, max, std dev, P95).
9. **Research Experiments:** Dedicated workspace to run labeled experiments, record hardware specs, and produce standard comparative thesis tables.
10. **Analytics & Comparison:** Visualizes trade-off multipliers, arithmetic speedup factors, and network MTU fragmentation impact.
11. **Reports & Export:** Instant PDF research report generation using ReportLab, alongside CSV and JSON data exports.
12. **Settings & Diagnostics:** Real-time hardware specs (CPU cores, RAM, OS), cryptographic engine validation, and terminal command reference.

---

## 4. Standardized Cryptographic Sizes & Specifications

| Property / Parameter | RSA-2048 | ECDSA P-256 | ML-DSA-44 (NIST FIPS 204) |
|---|---|---|---|
| **Security Hardness** | Integer Factorization | Elliptic Curve Discrete Log (ECDLP) | Module-LWE and Module-SIS |
| **Quantum Resistance** | **No** (Shor's Algorithm) | **No** (Shor's Algorithm) | **Yes** (Lattice Shortest Vector) |
| **Public Key Size** | ~270 Bytes | **65 Bytes** | 1,312 Bytes |
| **Private Key Size** | ~1,190 Bytes | **32 Bytes** | 2,560 Bytes (32B seed representation) |
| **Signature Size** | 256 Bytes | **64 Bytes** | 2,420 Bytes |
| **Signing Speed** | Slow ($\mathcal{O}(n^3)$ exponentiation) | Moderate | **Fastest** ($\mathcal{O}(n \log n)$ NTT arithmetic) |
| **Verification Speed** | Fast ($e=65537$) | Moderate | **Fastest** (NTT polynomial multiplication) |
| **MTU Fit (1,500B Ethernet)** | Yes (Single packet) | Yes (Single packet) | **Requires Fragmentation** (3 Packets) |

---

## 5. Installation & Execution Guide

### Prerequisites
* Windows 11 or Ubuntu 22.04+ (WSL2 supported)
* Python 3.12+
* Node.js LTS (v20+ or v26+)

### Windows 11 Setup

1. **Clone the repository:**
   ```powershell
   git clone <repo-url> pqc-pki
   cd pqc-pki
   ```

2. **Backend Setup:**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```powershell
   cd ..\frontend
   npm install
   npm run build
   ```

4. **One-Click Startup:**
   Double-click `start.bat` in the root folder, or execute:
   ```powershell
   .\start.bat
   ```
   * Backend runs at: `http://localhost:8000`
   * Interactive API docs (Swagger): `http://localhost:8000/docs`
   * Frontend Web UI: `http://localhost:5173`

---

### WSL2 / Linux Ubuntu Setup

1. **Navigate to the workspace:**
   ```bash
   cd pqc-pki
   ```

2. **Run the start script:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

---

## 6. Running the Automated Test Suite

To verify 100% of cryptographic primitives, X.509 issuance, ML-DSA-44 compliance, and attack detection:

```powershell
$env:PYTHONPATH = "backend"
backend\venv\Scripts\pytest.exe backend\tests -v
```

All 10 test suites evaluate real cryptographic mathematical operations:
* `test_crypto.py`: RSA-2048 and ECDSA P-256 key generation, PSS padding, SHA-256 signing, and verification.
* `test_mldsa.py`: ML-DSA-44 key pair generation, 1,312B public key verification, and 2,420B signature validation.
* `test_pki.py`: Root CA certificate generation, X.509 end-entity certificate issuance, certificate chain validation, and CRL building.
* `test_attacks.py`: Bit-tampering detection, signature corruption rejection, and public key substitution detection.
* `test_api.py`: FastAPI endpoints integration test.

---

## 7. Thesis Defense Discussion Points & Limitations

1. **The Size-vs-Compute Paradox:**  
   ML-DSA-44 offers superior arithmetic throughput to RSA-2048 because polynomial Number Theoretic Transform (NTT) operations require significantly fewer CPU cycles than modular exponentiation of large integers. However, its 2,420-byte signature footprint introduces network-level transmission challenges.
2. **Network MTU Fragmentation:**  
   Standard Ethernet networks enforce a 1,500-byte MTU. Because an ML-DSA-44 public key (1,312B) and signature (2,420B) together exceed 3.7 KB, TLS handshakes require multi-packet fragmentation, increasing latency across lossy or wireless links.
3. **PKI Migration Roadmaps:**  
   Because existing enterprise PKI infrastructure relies on legacy X.509 single-algorithm OIDs, the initial transition phase requires **Composite / Hybrid Certificates** (such as RFC drafts by IETF LAMPS) that encapsulate dual signatures (ECDSA + ML-DSA-44) to maintain backward compatibility while achieving quantum resistance.
