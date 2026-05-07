"""Discovery router — run pipeline, check status, get results."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.discovery_run import DiscoveryRun
from ..models.candidate import Candidate
from ..models.catalyst import Catalyst
from ..schemas.discovery import DiscoveryRunRequest, DiscoveryRunOut, CandidateOut, DiscoveryResultOut
from ..schemas.catalyst import CatalystOut
from ..services.discovery_engine import run_discovery_pipeline

router = APIRouter(prefix="/api/discovery", tags=["discovery"])


@router.post("/run", status_code=201)
def start_discovery(req: DiscoveryRunRequest, db: Session = Depends(get_db)):
    run = DiscoveryRun(
        project_id=req.project_id,
        reaction_id=req.reaction_id,
        reaction_text=req.reaction_text,
        temperature_c=req.temperature_c,
        pressure_bar=req.pressure_bar,
        cost_weight=req.cost_weight,
        sustainability=req.sustainability_score,
        mode=req.mode,
        status="idle",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Run synchronously (good enough for 5 users)
    run_discovery_pipeline(run, db)
    db.refresh(run)

    return {"run_id": run.id, "status": run.status}


@router.get("/run/{run_id}/status")
def get_run_status(run_id: str, db: Session = Depends(get_db)):
    run = db.query(DiscoveryRun).filter(DiscoveryRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run_id": run.id, "status": run.status}


@router.get("/run/{run_id}/result", response_model=DiscoveryResultOut)
def get_run_result(run_id: str, db: Session = Depends(get_db)):
    run = db.query(DiscoveryRun).filter(DiscoveryRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status != "complete":
        raise HTTPException(status_code=409, detail="Run not yet complete")

    candidates = db.query(Candidate).filter(Candidate.discovery_run_id == run_id).all()
    known = db.query(Catalyst).all()

    return DiscoveryResultOut(
        run=run,
        known=[CatalystOut.model_validate(k) for k in known],
        candidates=[CandidateOut.model_validate(c) for c in candidates],
    )


@router.get("/runs", response_model=list[DiscoveryRunOut])
def list_runs(project_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(DiscoveryRun)
    if project_id:
        query = query.filter(DiscoveryRun.project_id == project_id)
    return query.order_by(DiscoveryRun.created_at.desc()).all()
