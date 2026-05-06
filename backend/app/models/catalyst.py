"""Catalyst / enzyme / pathway — known entities from literature or experiments."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Catalyst(Base):
    __tablename__ = "catalysts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)  # catalyst | enzyme | pathway

    # Chemistry identifiers
    smiles: Mapped[str | None] = mapped_column(Text)
    inchi: Mapped[str | None] = mapped_column(Text)
    molecular_weight: Mapped[float | None] = mapped_column(Float)
    composition: Mapped[dict | None] = mapped_column(JSON)  # {"Cu": 1, "Zn": 1}

    # Measured performance
    known_activity: Mapped[float] = mapped_column(Float, default=0)
    known_selectivity: Mapped[float] = mapped_column(Float, default=0)
    known_stability: Mapped[float] = mapped_column(Float, default=0)
    activity_unit: Mapped[str] = mapped_column(String(50), default="%")
    selectivity_unit: Mapped[str] = mapped_column(String(50), default="%")
    stability_unit: Mapped[str] = mapped_column(String(50), default="hours")

    # Operating conditions
    temperature_min: Mapped[float | None] = mapped_column(Float)
    temperature_max: Mapped[float | None] = mapped_column(Float)
    pressure_min: Mapped[float | None] = mapped_column(Float)
    pressure_max: Mapped[float | None] = mapped_column(Float)

    notes: Mapped[str] = mapped_column(Text, default="")
    references: Mapped[dict | None] = mapped_column(JSON)  # stored as list of DOI strings
    source: Mapped[str] = mapped_column(String(20), default="literature")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # M2M relationship handled via association table
    compatible_reactions = relationship(
        "Reaction",
        secondary="catalyst_reaction_compat",
        back_populates="compatible_catalysts",
    )
