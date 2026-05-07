"""Experiments router — log bench results and view history."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.experiment import Experiment
from ..models.candidate import Candidate
from ..schemas.experiment import ExperimentCreate, ExperimentOut

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("/", response_model=list[ExperimentOut])
def list_experiments(candidate_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Experiment)
    if candidate_id:
        query = query.filter(Experiment.candidate_id == candidate_id)
    return query.order_by(Experiment.created_at.desc()).all()


@router.post("/", response_model=ExperimentOut, status_code=201)
def create_experiment(req: ExperimentCreate, db: Session = Depends(get_db)):
    # Verify candidate exists
    candidate = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Compute a simple confidence delta (simulated model update)
    error_magnitude = (
        abs(req.actual_activity - candidate.predicted_activity)
        + abs(req.actual_selectivity - candidate.predicted_selectivity)
        + abs(req.actual_stability - candidate.predicted_stability)
    ) / 3
    confidence_delta = max(1, int(10 - error_magnitude / 5))
    confidence_before = 72  # baseline
    prev = db.query(Experiment).order_by(Experiment.created_at.desc()).first()
    if prev and prev.model_confidence_after:
        confidence_before = prev.model_confidence_after

    exp = Experiment(
        candidate_id=req.candidate_id,
        actual_activity=req.actual_activity,
        actual_selectivity=req.actual_selectivity,
        actual_stability=req.actual_stability,
        actual_temp_c=req.actual_temp_c,
        actual_pressure_bar=req.actual_pressure_bar,
        catalyst_loading_mg_l=req.catalyst_loading_mg_l,
        reaction_time_h=req.reaction_time_h,
        notes=req.notes,
        operator=req.operator,
        model_confidence_before=confidence_before,
        model_confidence_after=min(99, confidence_before + confidence_delta),
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp
