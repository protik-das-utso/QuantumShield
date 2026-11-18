from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.sysinfo import get_system_specs
from app.models import (
    KeyPairModel, CertificateAuthorityModel, CertificateModel,
    SignatureModel, AttackSimulationModel, BenchmarkSessionModel, ExperimentModel
)
from app.schemas import SystemInfoResponse

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/info", response_model=SystemInfoResponse)
def get_info():
    specs = get_system_specs()
    return SystemInfoResponse(**specs)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_keys = db.query(KeyPairModel).count()
    classical_keys = db.query(KeyPairModel).filter(KeyPairModel.key_family == "classical").count()
    pqc_keys = db.query(KeyPairModel).filter(KeyPairModel.key_family == "pqc").count()
    total_cas = db.query(CertificateAuthorityModel).count()
    total_certs = db.query(CertificateModel).count()
    revoked_certs = db.query(CertificateModel).filter(CertificateModel.is_revoked == True).count()
    total_signatures = db.query(SignatureModel).count()
    total_attacks = db.query(AttackSimulationModel).count()
    attacks_detected = db.query(AttackSimulationModel).filter(AttackSimulationModel.defense_passed == True).count()
    total_benchmarks = db.query(BenchmarkSessionModel).count()
    total_experiments = db.query(ExperimentModel).count()

    return {
        "total_keys": total_keys,
        "classical_keys": classical_keys,
        "pqc_keys": pqc_keys,
        "total_cas": total_cas,
        "total_certs": total_certs,
        "revoked_certs": revoked_certs,
        "total_signatures": total_signatures,
        "total_attacks": total_attacks,
        "attacks_detected": attacks_detected,
        "total_benchmarks": total_benchmarks,
        "total_experiments": total_experiments
    }
