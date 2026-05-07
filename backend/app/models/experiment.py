"""Experiment feedback — bench results closing the learning loop."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Bench conditions
    actual_temp_c: Mapped[float | None] = mapped_column(Float)
    actual_pressure_bar: Mapped[float | None] = mapped_column(Float)
    catalyst_loading_mg_l: Mapped[float | None] = mapped_column(Float)
    reaction_time_h: Mapped[float | None] = mapped_column(Float)

    # Measured results
    actual_activity: Mapped[float] = mapped_column(Float, nullable=False)
    actual_selectivity: Mapped[float] = mapped_column(Float, nullable=False)
    actual_stability: Mapped[float] = mapped_column(Float, nullable=False)

    # Confidence tracking
    model_confidence_before: Mapped[float | None] = mapped_column(Float)
    model_confidence_after: Mapped[float | None] = mapped_column(Float)

    notes: Mapped[str] = mapped_column(Text, default="")
    operator: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", back_populates="experiments")
    user = relationship("User", back_populates="experiments")
