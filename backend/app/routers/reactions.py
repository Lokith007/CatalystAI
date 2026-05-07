"""Reactions router — CRUD for reaction templates."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.reaction import Reaction
from ..schemas.reaction import ReactionOut, ReactionCreate

router = APIRouter(prefix="/api/reactions", tags=["reactions"])


@router.get("/", response_model=list[ReactionOut])
def list_reactions(db: Session = Depends(get_db)):
    return db.query(Reaction).all()


@router.get("/{reaction_id}", response_model=ReactionOut)
def get_reaction(reaction_id: str, db: Session = Depends(get_db)):
    rxn = db.query(Reaction).filter(Reaction.id == reaction_id).first()
    if not rxn:
        raise HTTPException(status_code=404, detail="Reaction not found")
    return rxn


@router.post("/", response_model=ReactionOut, status_code=201)
def create_reaction(req: ReactionCreate, db: Session = Depends(get_db)):
    rxn = Reaction(**req.model_dump())
    db.add(rxn)
    db.commit()
    db.refresh(rxn)
    return rxn
