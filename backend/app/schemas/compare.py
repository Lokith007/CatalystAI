"""Pydantic schemas for compare (side-by-side candidate metrics)."""

from pydantic import BaseModel, ConfigDict, Field


class CompareCandidatesRequest(BaseModel):
    candidate_ids: list[str] = Field(min_length=1, max_length=3)


class CompareFlags(BaseModel):
    activity: bool
    selectivity: bool
    stability: bool
    confidence: bool


class CandidateCompareRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    predicted_activity: float
    predicted_selectivity: float
    predicted_stability: float
    confidence: float
    composite: float
    best: CompareFlags


class CompareCandidatesResponse(BaseModel):
    rows: list[CandidateCompareRow]
