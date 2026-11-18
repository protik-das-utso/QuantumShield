import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
KEYS_DIR = STORAGE_DIR / "keys"
CERTS_DIR = STORAGE_DIR / "certs"
SIGNATURES_DIR = STORAGE_DIR / "signatures"
UPLOADS_DIR = STORAGE_DIR / "uploads"
CRL_DIR = STORAGE_DIR / "crl"

for directory in [STORAGE_DIR, KEYS_DIR, CERTS_DIR, SIGNATURES_DIR, UPLOADS_DIR, CRL_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = BASE_DIR / "pqc_pki.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_FILE_EXTENSIONS = {".pdf", ".txt", ".docx", ".bin", ".dat", ".png", ".jpg", ".json", ".csv"}
