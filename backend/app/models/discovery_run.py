"""Discovery run — one execution of the AI pipeline."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class DiscoveryRun(Base):
    __tablename__ = "discovery_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    reaction_id: Mapped[str | None] = mapped_column(ForeignKey("reactions.id"), nullable=True)

    # Input parameters
    reaction_text: Mapped[str] = mapped_column(Text, default="")
    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    pressure_bar: Mapped[float] = mapped_column(Float, nullable=False)
    cost_weight: Mapped[float] = mapped_column(Float, nullable=False)
    sustainability: Mapped[float] = mapped_column(Float, nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)

    # Pipeline state
    status: Mapped[str] = mapped_column(String(20), default="idle")  # idle|retrieval|generation|prediction|complete
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Results
    pathway_steps: Mapped[dict | None] = mapped_column(JSON)
    pareto_points: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="discovery_runs")
    reaction = relationship("Reaction", back_populates="discovery_runs")
    candidates = relationship("Candidate", back_populates="discovery_run", cascade="all, delete-orphan")
