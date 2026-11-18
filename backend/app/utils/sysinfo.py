import platform
import psutil
import sys
import cryptography
from cryptography.hazmat.backends.openssl import backend as openssl_backend
from cryptography.hazmat.primitives.asymmetric import mldsa


def get_system_specs() -> dict:
    ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 2)
    os_name = f"{platform.system()} {platform.release()} ({platform.version()})"
    cpu_model = platform.processor() or "AMD/Intel x86_64"

    mldsa_available = hasattr(mldsa, "MLDSA44PrivateKey")

    return {
        "os": os_name,
        "processor": cpu_model,
        "cpu_cores_physical": psutil.cpu_count(logical=False) or 1,
        "cpu_cores_logical": psutil.cpu_count(logical=True) or 1,
        "ram_total_gb": ram_gb,
        "python_version": sys.version.split()[0],
        "openssl_version": openssl_backend.openssl_version_text(),
        "cryptography_version": cryptography.__version__,
        "mldsa_fips204_available": mldsa_available,
        "mldsa_engine": "Native OpenSSL 4.0 / Cryptography Hazmat (FIPS 204)" if mldsa_available else "Unavailable",
    }
