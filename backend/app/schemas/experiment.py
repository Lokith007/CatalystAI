"""Pydantic schemas for experiments (feedback loop)."""

from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    candidate_id: str
    actual_activity: float
    actual_selectivity: float
    actual_stability: float
    actual_temp_c: float | None = None
    actual_pressure_bar: float | None = None
    catalyst_loading_mg_l: float | None = None
    reaction_time_h: float | None = None
    notes: str = ""
    operator: str = ""


class ExperimentOut(BaseModel):
    id: str
    candidate_id: str
    actual_activity: float
    actual_selectivity: float
    actual_stability: float
    model_confidence_before: float | None = None
    model_confidence_after: float | None = None
    notes: str
    operator: str
    created_at: str | None = None

    class Config:
        from_attributes = True
