"""AI-generated candidate from a discovery run."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    discovery_run_id: Mapped[str] = mapped_column(ForeignKey("discovery_runs.id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")

    # Molecular data
    smiles: Mapped[str | None] = mapped_column(Text)
    inchi: Mapped[str | None] = mapped_column(Text)
    molecular_weight: Mapped[float | None] = mapped_column(Float)
    composition: Mapped[dict | None] = mapped_column(JSON)

    # ML predictions
    predicted_activity: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_selectivity: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_stability: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty: Mapped[str] = mapped_column(String(10), default="medium")  # low|medium|high
    badge: Mapped[str] = mapped_column(String(20), default="Experimental")  # High|Medium|Experimental
    active_learning_hint: Mapped[str | None] = mapped_column(Text)

    # Model provenance
    generative_model: Mapped[str] = mapped_column(String(100), default="mock-v1")
    computed_properties: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    discovery_run = relationship("DiscoveryRun", back_populates="candidates")
    experiments = relationship("Experiment", back_populates="candidate", cascade="all, delete-orphan")
