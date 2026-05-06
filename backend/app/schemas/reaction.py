"""Pydantic schemas for reactions."""

from pydantic import BaseModel


class ReactionOut(BaseModel):
    id: str
    name: str
    category: str
    input_species: list | None = None
    output_species: list | None = None
    default_temp_c: float
    default_pressure_bar: float
    default_cost_weight: float
    default_sustainability: float
    pathway_template: list | None = None
    tags: list | None = None
    difficulty: str

    class Config:
        from_attributes = True


class ReactionCreate(BaseModel):
    name: str
    category: str = ""
    input_species: list | None = None
    output_species: list | None = None
    default_temp_c: float = 250
    default_pressure_bar: float = 25
    default_cost_weight: float = 50
    default_sustainability: float = 75
    pathway_template: list | None = None
    tags: list | None = None
    difficulty: str = "medium"
