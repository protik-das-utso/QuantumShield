import json
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ExperimentModel, BenchmarkSessionModel, AttackSimulationModel
from app.reports.pdf_generator import generate_research_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])


@router.get("/pdf/{experiment_id}")
def download_pdf_report(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment record not found")

    exp_data = {
        "experiment_code": exp.experiment_code,
        "title": exp.title,
        "description": exp.description,
        "iterations": exp.iterations,
        "payload_size_bytes": exp.payload_size_bytes,
        "system_specs": json.loads(exp.system_specs_json),
        "comparison_table": json.loads(exp.comparison_table_json)
    }

    # Fetch attack simulation results
    attacks = db.query(AttackSimulationModel).order_by(AttackSimulationModel.id.desc()).limit(10).all()
    attack_data = [
        {
            "test_id": a.test_id,
            "test_name": a.test_name,
            "algorithm": a.algorithm,
            "expected_result": a.expected_result,
            "actual_result": a.actual_result,
            "defense_passed": a.defense_passed
        }
        for a in attacks
    ]

    pdf_bytes = generate_research_pdf_report(exp_data, [], attack_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=pqc_pki_report_{exp.experiment_code}.pdf"}
    )
