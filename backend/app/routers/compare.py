"""Compare router — side-by-side candidate comparisons."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.candidate import Candidate
from ..schemas.compare import (
    CandidateCompareRow,
    CompareCandidatesRequest,
    CompareCandidatesResponse,
    CompareFlags,
)

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.post("/candidates", response_model=CompareCandidatesResponse)
def compare_candidates(req: CompareCandidatesRequest, db: Session = Depends(get_db)):
    # Fetch candidates preserving request order
    wanted = list(dict.fromkeys(req.candidate_ids))
    if not wanted:
        raise HTTPException(status_code=422, detail="candidate_ids cannot be empty")
    if len(wanted) > 3:
        raise HTTPException(status_code=422, detail="Select up to 3 candidates")

    found = db.query(Candidate).filter(Candidate.id.in_(wanted)).all()
    by_id = {c.id: c for c in found}
    missing = [cid for cid in wanted if cid not in by_id]
    if missing:
        raise HTTPException(status_code=404, detail=f"Candidates not found: {', '.join(missing)}")

    rows = [by_id[cid] for cid in wanted]

    best_activity = max(r.predicted_activity for r in rows)
    best_selectivity = max(r.predicted_selectivity for r in rows)
    best_stability = max(r.predicted_stability for r in rows)
    best_confidence = max(r.confidence for r in rows)

    out_rows: list[CandidateCompareRow] = []
    for r in rows:
        composite = (r.predicted_activity + r.predicted_selectivity + r.predicted_stability) / 3
        out_rows.append(
            CandidateCompareRow(
                id=r.id,
                name=r.name,
                predicted_activity=r.predicted_activity,
                predicted_selectivity=r.predicted_selectivity,
                predicted_stability=r.predicted_stability,
                confidence=r.confidence,
                composite=composite,
                best=CompareFlags(
                    activity=r.predicted_activity == best_activity,
                    selectivity=r.predicted_selectivity == best_selectivity,
                    stability=r.predicted_stability == best_stability,
                    confidence=r.confidence == best_confidence,
                ),
            )
        )

    return CompareCandidatesResponse(rows=out_rows)

