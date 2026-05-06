"""Reaction templates and catalyst-reaction compatibility."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, JSON, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

# Association table for many-to-many catalyst ↔ reaction
CatalystReactionCompat = Table(
    "catalyst_reaction_compat",
    Base.metadata,
    Column("catalyst_id", String(36), ForeignKey("catalysts.id", ondelete="CASCADE"), primary_key=True),
    Column("reaction_id", String(36), ForeignKey("reactions.id", ondelete="CASCADE"), primary_key=True),
)


class Reaction(Base):
    __tablename__ = "reactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="")
    input_species: Mapped[dict | None] = mapped_column(JSON)   # ["C₂H₅OH"]
    output_species: Mapped[dict | None] = mapped_column(JSON)  # ["C₈-C₁₆ alkanes"]

    # Default conditions
    default_temp_c: Mapped[float] = mapped_column(Float, default=250)
    default_pressure_bar: Mapped[float] = mapped_column(Float, default=25)
    default_cost_weight: Mapped[float] = mapped_column(Float, default=50)
    default_sustainability: Mapped[float] = mapped_column(Float, default=75)

    # Pathway template (JSON array of steps)
    pathway_template: Mapped[dict | None] = mapped_column(JSON)

    tags: Mapped[dict | None] = mapped_column(JSON)  # ["green-chemistry", "jet-fuel"]
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    compatible_catalysts = relationship(
        "Catalyst",
        secondary="catalyst_reaction_compat",
        back_populates="compatible_reactions",
    )
    discovery_runs = relationship("DiscoveryRun", back_populates="reaction")
