"""Knowledge graph nodes and edges."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class KGNode(Base):
    __tablename__ = "kg_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    node_type: Mapped[str] = mapped_column(String(20), nullable=False)  # catalyst|reaction|pathway
    properties: Mapped[dict | None] = mapped_column(JSON, default=dict)
    pos_x: Mapped[float] = mapped_column(Float, default=50)
    pos_y: Mapped[float] = mapped_column(Float, default=50)

    # Optional FK links to real entities
    catalyst_id: Mapped[str | None] = mapped_column(ForeignKey("catalysts.id"), nullable=True)
    reaction_id: Mapped[str | None] = mapped_column(ForeignKey("reactions.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class KGEdge(Base):
    __tablename__ = "kg_edges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id: Mapped[str] = mapped_column(ForeignKey("kg_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id: Mapped[str] = mapped_column(ForeignKey("kg_nodes.id", ondelete="CASCADE"), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)  # catalyzes, produces_via, etc.
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    evidence: Mapped[dict | None] = mapped_column(JSON)  # list of DOIs
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
