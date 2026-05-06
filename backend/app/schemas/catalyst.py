"""Pydantic schemas for catalysts."""

from pydantic import BaseModel


class CatalystOut(BaseModel):
    id: str
    name: str
    entity_type: str
    smiles: str | None = None
    inchi: str | None = None
    molecular_weight: float | None = None
    composition: dict | None = None
    known_activity: float
    known_selectivity: float
    known_stability: float
    notes: str
    references: list | None = None
    source: str
    temperature_min: float | None = None
    temperature_max: float | None = None
    pressure_min: float | None = None
    pressure_max: float | None = None

    class Config:
        from_attributes = True


class CatalystCreate(BaseModel):
    name: str
    entity_type: str  # catalyst | enzyme | pathway
    smiles: str | None = None
    inchi: str | None = None
    molecular_weight: float | None = None
    composition: dict | None = None
    known_activity: float = 0
    known_selectivity: float = 0
    known_stability: float = 0
    notes: str = ""
    references: list | None = None
    source: str = "literature"
    temperature_min: float | None = None
    temperature_max: float | None = None
    pressure_min: float | None = None
    pressure_max: float | None = None
