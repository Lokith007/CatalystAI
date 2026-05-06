"""Pydantic schemas for knowledge graph."""

from pydantic import BaseModel


class KGNodeOut(BaseModel):
    id: str
    label: str
    node_type: str
    properties: dict | None = None
    pos_x: float
    pos_y: float

    class Config:
        from_attributes = True


class KGNodeCreate(BaseModel):
    label: str
    node_type: str  # catalyst | reaction | pathway
    properties: dict | None = None
    pos_x: float = 50
    pos_y: float = 50
    catalyst_id: str | None = None
    reaction_id: str | None = None


class KGEdgeOut(BaseModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: str
    weight: float

    class Config:
        from_attributes = True


class KGEdgeCreate(BaseModel):
    source_id: str
    target_id: str
    relationship_type: str
    weight: float = 1.0


class KnowledgeGraphOut(BaseModel):
    nodes: list[KGNodeOut]
    edges: list[KGEdgeOut]
