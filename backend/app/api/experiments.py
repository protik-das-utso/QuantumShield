import time
import json
import uuid
import os
import io
import csv
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ExperimentModel
from app.schemas import CreateExperimentRequest, ExperimentResponse
from app.utils.sysinfo import get_system_specs
from app.api.benchmark import benchmark_rsa_2048, benchmark_ecdsa_p256, benchmark_mldsa_44, compute_statistics

router = APIRouter(prefix="/api/experiments", tags=["Research Experiments"])


@router.post("", response_model=ExperimentResponse)
def create_and_run_experiment(req: CreateExperimentRequest, db: Session = Depends(get_db)):
    exp_code = req.experiment_code or f"EXP-{uuid.uuid4().hex[:6].upper()}"

    existing = db.query(ExperimentModel).filter(ExperimentModel.experiment_code == exp_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Experiment code '{exp_code}' already exists")

    specs = get_system_specs()
    payload = os.urandom(req.payload_size_bytes)

    # Dictionary to aggregate comparison table
    algo_results = {}

    for algo in req.algorithms:
        if algo == "RSA-2048":
            res = benchmark_rsa_2048(req.iterations, 3, payload)
        elif algo == "ECDSA-P256":
            res = benchmark_ecdsa_p256(req.iterations, 3, payload)
        elif algo == "ML-DSA-44":
            res = benchmark_mldsa_44(req.iterations, 3, payload)
        else:
            continue

        kg_stats = compute_statistics(res["keygen"][0])
        sign_stats = compute_statistics(res["sign"][0])
        v_stats = compute_statistics(res["verify"][0])

        algo_results[algo] = {
            "keygen_mean_ms": kg_stats["mean_ms"],
            "keygen_median_ms": kg_stats["median_ms"],
            "keygen_std_dev_ms": kg_stats["std_dev_ms"],
            "sign_mean_ms": sign_stats["mean_ms"],
            "sign_median_ms": sign_stats["median_ms"],
            "sign_std_dev_ms": sign_stats["std_dev_ms"],
            "verify_mean_ms": v_stats["mean_ms"],
            "verify_median_ms": v_stats["median_ms"],
            "verify_std_dev_ms": v_stats["std_dev_ms"],
            "public_key_bytes": res["keygen"][1],
            "private_key_bytes": res["keygen"][2],
            "signature_bytes": res["sign"][1],
        }

    # Build standardized comparison rows
    comparison_table = [
        {
            "metric": "Key Generation (Mean ms)",
            "rsa_2048": f"{algo_results['RSA-2048']['keygen_mean_ms']:.3f} ms" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['keygen_mean_ms']:.3f} ms" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['keygen_mean_ms']:.3f} ms" if "ML-DSA-44" in algo_results else "N/A",
        },
        {
            "metric": "Signing Time (Mean ms)",
            "rsa_2048": f"{algo_results['RSA-2048']['sign_mean_ms']:.3f} ms" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['sign_mean_ms']:.3f} ms" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['sign_mean_ms']:.3f} ms" if "ML-DSA-44" in algo_results else "N/A",
        },
        {
            "metric": "Verification Time (Mean ms)",
            "rsa_2048": f"{algo_results['RSA-2048']['verify_mean_ms']:.3f} ms" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['verify_mean_ms']:.3f} ms" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['verify_mean_ms']:.3f} ms" if "ML-DSA-44" in algo_results else "N/A",
        },
        {
            "metric": "Public Key Size",
            "rsa_2048": f"{algo_results['RSA-2048']['public_key_bytes']} B" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['public_key_bytes']} B" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['public_key_bytes']} B" if "ML-DSA-44" in algo_results else "N/A",
        },
        {
            "metric": "Private Key Size",
            "rsa_2048": f"{algo_results['RSA-2048']['private_key_bytes']} B" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['private_key_bytes']} B" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['private_key_bytes']} B" if "ML-DSA-44" in algo_results else "N/A",
        },
        {
            "metric": "Signature Size",
            "rsa_2048": f"{algo_results['RSA-2048']['signature_bytes']} B" if "RSA-2048" in algo_results else "N/A",
            "ecdsa_p256": f"{algo_results['ECDSA-P256']['signature_bytes']} B" if "ECDSA-P256" in algo_results else "N/A",
            "mldsa_44": f"{algo_results['ML-DSA-44']['signature_bytes']} B" if "ML-DSA-44" in algo_results else "N/A",
        }
    ]

    record = ExperimentModel(
        experiment_code=exp_code,
        title=req.title,
        description=req.description,
        algorithms_json=json.dumps(req.algorithms),
        iterations=req.iterations,
        payload_size_bytes=req.payload_size_bytes,
        status="COMPLETED",
        system_specs_json=json.dumps(specs),
        comparison_table_json=json.dumps(comparison_table)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ExperimentResponse(
        id=record.id,
        experiment_code=record.experiment_code,
        title=record.title,
        description=record.description,
        algorithms=json.loads(record.algorithms_json),
        iterations=record.iterations,
        payload_size_bytes=record.payload_size_bytes,
        status=record.status,
        system_specs=json.loads(record.system_specs_json),
        comparison_table=json.loads(record.comparison_table_json),
        created_at=record.created_at
    )


@router.get("", response_model=List[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    records = db.query(ExperimentModel).order_by(ExperimentModel.id.desc()).all()
    return [
        ExperimentResponse(
            id=r.id,
            experiment_code=r.experiment_code,
            title=r.title,
            description=r.description,
            algorithms=json.loads(r.algorithms_json),
            iterations=r.iterations,
            payload_size_bytes=r.payload_size_bytes,
            status=r.status,
            system_specs=json.loads(r.system_specs_json),
            comparison_table=json.loads(r.comparison_table_json),
            created_at=r.created_at
        )
        for r in records
    ]


@router.get("/{exp_id}", response_model=ExperimentResponse)
def get_experiment_detail(exp_id: int, db: Session = Depends(get_db)):
    r = db.query(ExperimentModel).filter(ExperimentModel.id == exp_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return ExperimentResponse(
        id=r.id,
        experiment_code=r.experiment_code,
        title=r.title,
        description=r.description,
        algorithms=json.loads(r.algorithms_json),
        iterations=r.iterations,
        payload_size_bytes=r.payload_size_bytes,
        status=r.status,
        system_specs=json.loads(r.system_specs_json),
        comparison_table=json.loads(r.comparison_table_json),
        created_at=r.created_at
    )


@router.get("/{exp_id}/export/csv")
def export_experiment_csv(exp_id: int, db: Session = Depends(get_db)):
    r = db.query(ExperimentModel).filter(ExperimentModel.id == exp_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Experiment not found")

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["# QUANTUMSHIELD EXPERIMENTAL RESEARCH SUMMARY"])
    writer.writerow(["Experiment Code", r.experiment_code])
    writer.writerow(["Title", r.title])
    writer.writerow(["Description", r.description or ""])
    writer.writerow(["Date", r.created_at.isoformat()])
    writer.writerow(["Iterations", r.iterations])
    writer.writerow(["Payload Size (Bytes)", r.payload_size_bytes])
    writer.writerow([])

    table = json.loads(r.comparison_table_json)
    writer.writerow(["Metric", "RSA-2048", "ECDSA P-256", "ML-DSA-44 (FIPS 204)"])
    for row in table:
        writer.writerow([row.get("metric"), row.get("rsa_2048"), row.get("ecdsa_p256"), row.get("mldsa_44")])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=experiment_{r.experiment_code}.csv"}
    )


@router.get("/{exp_id}/export/json")
def export_experiment_json(exp_id: int, db: Session = Depends(get_db)):
    r = db.query(ExperimentModel).filter(ExperimentModel.id == exp_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Experiment not found")

    data = {
        "experiment_code": r.experiment_code,
        "title": r.title,
        "description": r.description,
        "iterations": r.iterations,
        "payload_size_bytes": r.payload_size_bytes,
        "created_at": r.created_at.isoformat(),
        "system_specs": json.loads(r.system_specs_json),
        "comparison_table": json.loads(r.comparison_table_json)
    }

    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=experiment_{r.experiment_code}.json"}
    )
