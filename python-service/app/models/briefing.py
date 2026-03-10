"""
Database models for the briefing generation system.

This module defines the SQLAlchemy ORM models representing the core entities
of the briefing reports, including the main report record, highlights, 
threat factors, and financial metrics.

Data Flow:
    - Repositories interact with these models to persist/retrieve data.
    - The Formatter transforms these model instances into report payloads.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BriefingReport(Base):
    """
    Main record for an analyst briefing report.

    This model serves as the root entity for a briefing, containing identifying 
    information for the subject entity and high-level analyst insights. 

    Pattern: Root Entity (Aggregate Root)
    """
    __tablename__ = "report_briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    entity_name: Mapped[str] = mapped_column(String(180), nullable=False)
    asset_ticker: Mapped[str] = mapped_column(String(12), nullable=False)
    industry_sector: Mapped[str] = mapped_column(String(180), nullable=False)
    author_name: Mapped[str] = mapped_column(String(180), nullable=False)
    report_executive_summary: Mapped[str] = mapped_column(Text, nullable=False)
    analyst_recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    
    compiled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        comment="Timestamp when the report was officially rendered/generated"
    )
    entry_created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    entry_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    highlights: Mapped[list["BriefingHighlight"]] = relationship(
        back_populates="report", 
        cascade="all, delete-orphan", 
        order_by="BriefingHighlight.display_order"
    )
    threats: Mapped[list["BriefingThreat"]] = relationship(
        back_populates="report", 
        cascade="all, delete-orphan", 
        order_by="BriefingThreat.display_order"
    )
    financial_metrics: Mapped[list["BriefingMetric"]] = relationship(
        back_populates="report", 
        cascade="all, delete-orphan", 
        order_by="BriefingMetric.id"
    )


class BriefingHighlight(Base):
    """
    Specific positive or key point identified in the briefing.

    Pattern: Dependent Attribute Entity
    """
    __tablename__ = "report_briefing_highlights"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("report_briefings.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    report: Mapped[BriefingReport] = relationship(back_populates="highlights")


class BriefingThreat(Base):
    """
    Specific risk factor or concern identified in the briefing.

    Pattern: Dependent Attribute Entity
    """
    __tablename__ = "report_briefing_threats"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("report_briefings.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    report: Mapped[BriefingReport] = relationship(back_populates="threats")


class BriefingMetric(Base):
    """
    Quantitative performance indicator for the subject entity.

    Pattern: Dependent Attribute Entity
    """
    __tablename__ = "report_briefing_metrics"
    __table_args__ = (
        UniqueConstraint("report_id", "metric_label", name="uq_report_metric_label"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("report_briefings.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    metric_label: Mapped[str] = mapped_column(String(120), nullable=False)
    metric_value: Mapped[str] = mapped_column(String(200), nullable=False)

    report: Mapped[BriefingReport] = relationship(back_populates="financial_metrics")

