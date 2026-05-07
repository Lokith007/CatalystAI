"""Pydantic schemas for discovery runs, candidates, and the pipeline."""

from pydantic import BaseModel


class DiscoveryRunRequest(BaseModel):
    project_id: str
    reaction_id: str | None = None
    reaction_text: str = ""
    temperature_c: float
    pressure_bar: float
    cost_weight: float
    sustainability_score: float
    mode: str  # catalysis | synbio


class DiscoveryRunOut(BaseModel):
    id: str
    status: str
    reaction_text: str
    temperature_c: float
    pressure_bar: float
    cost_weight: float
    sustainability: float
    mode: str
    pathway_steps: list | None = None
    pareto_points: list | None = None

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    id: str
    name: str
    description: str
    smiles: str | None = None
    predicted_activity: float
    predicted_selectivity: float
    predicted_stability: float
    confidence: float
    uncertainty: str
    badge: str
    active_learning_hint: str | None = None
    generative_model: str
    computed_properties: dict | None = None

    class Config:
        from_attributes = True


class DiscoveryResultOut(BaseModel):
    run: DiscoveryRunOut
    known: list  # CatalystOut items
    candidates: list[CandidateOut]
