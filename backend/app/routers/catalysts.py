"""Catalysts router — CRUD for known entities."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.catalyst import Catalyst
from ..schemas.catalyst import CatalystOut, CatalystCreate

router = APIRouter(prefix="/api/catalysts", tags=["catalysts"])


@router.get("/", response_model=list[CatalystOut])
def list_catalysts(reaction_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Catalyst)
    if reaction_id:
        query = query.filter(Catalyst.compatible_reactions.any(id=reaction_id))
    return query.all()


@router.get("/{catalyst_id}", response_model=CatalystOut)
def get_catalyst(catalyst_id: str, db: Session = Depends(get_db)):
    cat = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catalyst not found")
    return cat


@router.post("/", response_model=CatalystOut, status_code=201)
def create_catalyst(req: CatalystCreate, db: Session = Depends(get_db)):
    cat = Catalyst(**req.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
