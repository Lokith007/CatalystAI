"""Pydantic schemas for experiments (feedback loop)."""

from pydantic import BaseModel, ConfigDict, Field


class ExperimentCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    candidate_id: str
    # Frontend sends `actual_yield`; backend stores it as `actual_activity`.
    actual_activity: float = Field(validation_alias="actual_yield")
    actual_selectivity: float
    actual_stability: float
    actual_temp_c: float | None = None
    actual_pressure_bar: float | None = None
    catalyst_loading_mg_l: float | None = None
    reaction_time_h: float | None = None
    notes: str = ""
    operator: str = ""


class ExperimentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
