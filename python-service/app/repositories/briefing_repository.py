"""
Data access layer for briefing-related operations.

This module provides the implementation of the Repository Pattern for 
BriefingReport and its associated entities, isolating SQL/ORM logic 
from the service layer.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.briefing import BriefingHighlight, BriefingMetric, BriefingReport, BriefingThreat
from app.schemas.briefing import BriefingCreate


def create_briefing_record(db: Session, payload: BriefingCreate) -> BriefingReport:
    """
    Persist a new briefing report and its associated sub-entities.

    Args:
        db (Session): Active database session.
        payload (BriefingCreate): Validated Pydantic schema containing initial data.

    Returns:
        BriefingReport: The newly created and refreshed ORM instance.

    Notes:
        This method performs atomic insertion of multiple related entities.
    """
    report = BriefingReport(
        entity_name=payload.entity_name,
        asset_ticker=payload.asset_ticker,
        industry_sector=payload.industry_sector,
        author_name=payload.author_name,
        report_executive_summary=payload.report_executive_summary,
        analyst_recommendation=payload.analyst_recommendation,
    )

    # Map key points to highlight entities
    report.highlights = [
        BriefingHighlight(display_order=index, description=content)
        for index, content in enumerate(payload.key_points, start=1)
    ]
    
    # Map risks to threat entities
    report.threats = [
        BriefingThreat(display_order=index, description=content)
        for index, content in enumerate(payload.risks, start=1)
    ]
    
    # Map metrics to metric entities
    report.financial_metrics = [
        BriefingMetric(metric_label=m.label.strip(), metric_value=m.value.strip()) 
        for m in payload.metrics
    ]

    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Reload with associations to avoid lazy-loading issues.
    return get_report_by_id(db, report.id)


def get_report_by_id(db: Session, report_id: int) -> Optional[BriefingReport]:
    """
    Retrieve a single briefing report with all nested collections loaded.

    Args:
        db (Session): Active database session.
        report_id (int): Primary key of the report to retrieve.

    Returns:
        Optional[BriefingReport]: The report instance or None if not found.

    Strategy:
        Uses Eager Loading (selectinload) for related collections to prevent 
        N+1 query problems in the serialization layer.
    """
    query = (
        select(BriefingReport)
        .where(BriefingReport.id == report_id)
        .options(
            selectinload(BriefingReport.highlights),
            selectinload(BriefingReport.threats),
            selectinload(BriefingReport.financial_metrics),
        )
    )
    return db.scalar(query)


def mark_report_as_compiled(db: Session, report: BriefingReport) -> BriefingReport:
    """
    Update the compilation timestamp for a report.

    Args:
        db (Session): Active database session.
        report (BriefingReport): The ORM instance to mark as compiled.

    Returns:
        BriefingReport: The updated and refreshed instance.
    """
    report.compiled_at = datetime.now(timezone.utc).replace(microsecond=0)
    db.add(report)
    db.commit()
    db.refresh(report)
    return get_report_by_id(db, report.id)
