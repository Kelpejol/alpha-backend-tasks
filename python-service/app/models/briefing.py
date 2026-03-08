from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    ticker: Mapped[str] = mapped_column(String(12), nullable=False)
    sector: Mapped[str] = mapped_column(String(180), nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(180), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    points: Mapped[list["BriefingPoint"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan", order_by="BriefingPoint.position"
    )
    risks: Mapped[list["BriefingRisk"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan", order_by="BriefingRisk.position"
    )
    metrics: Mapped[list["BriefingMetric"]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan", order_by="BriefingMetric.id"
    )


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    briefing: Mapped[Briefing] = relationship(back_populates="points")


class BriefingRisk(Base):
    __tablename__ = "briefing_risks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    briefing: Mapped[Briefing] = relationship(back_populates="risks")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"
    __table_args__ = (UniqueConstraint("briefing_id", "name", name="uq_briefing_metric_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(String(200), nullable=False)

    briefing: Mapped[Briefing] = relationship(back_populates="metrics")
