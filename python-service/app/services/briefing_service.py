"""
Core business logic for briefing management.

This service orchestrates the flow of data between API routes, the 
repository layer, and the report formatter. It ensures that 
business rules are applied consistently across all report operations.

Data Flow:
    - Receives validated schemas from the API layer.
    - Delegates persistence to the Repository.
    - Delegates report styling to the Formatter.
"""

from sqlalchemy.orm import Session

from app.exceptions import ResourceNotFoundException
from app.repositories.briefing_repository import (
    create_briefing_record, 
    get_report_by_id, 
    mark_report_as_compiled
)
from app.schemas.briefing import BriefingCreate, BriefingMetricRead, BriefingRead, GeneratedBriefingReport
from app.services.report_formatter import ReportFormatter

# Shared singleton instance of the report formatter.
_formatter = ReportFormatter()


def register_new_briefing(db: Session, payload: BriefingCreate) -> BriefingRead:
    """
    Register a new briefing report in the system.

    Args:
        db (Session): Active database session.
        payload (BriefingCreate): Validated input data.

    Returns:
        BriefingRead: Serialized representation of the created briefing.
    """
    report = create_briefing_record(db, payload)
    return _serialize_report(report)


def retrieve_briefing_by_id(db: Session, report_id: int) -> BriefingRead:
    """
    Fetch a single briefing report by its unique identifier.

    Args:
        db (Session): Active database session.
        report_id (int): Primary key of the report.

    Returns:
        BriefingRead: Serialized report data.

    Raises:
        ResourceNotFoundException: If the report does not exist.
    """
    report = _require_report(db, report_id)
    return _serialize_report(report)


def execute_report_compilation(db: Session, report_id: int) -> GeneratedBriefingReport:
    """
    Compile a briefing into a formatted report and mark it as generated.

    Args:
        db (Session): Active database session.
        report_id (int): Primary key of the report.

    Returns:
        GeneratedBriefingReport: The structured report payload.

    Notes:
        This method triggers the rendering process to ensure that all 
        template dependencies are valid at the time of generation.
    """
    report = _require_report(db, report_id)
    compiled_report = mark_report_as_compiled(db, report)
    
    # Transform model instance into a view-ready payload.
    report_payload = _formatter.build_report_view_model(compiled_report)
    
    # Pre-render to catch template errors early.
    _formatter.render_briefing_html(report_payload)
    
    return GeneratedBriefingReport.model_validate(report_payload)


def render_briefing_as_html(db: Session, report_id: int) -> str:
    """
    Render a briefing report into its HTML representation.

    Args:
        db (Session): Active database session.
        report_id (int): Primary key of the report.

    Returns:
        str: The fully rendered HTML content.
    """
    report = _require_report(db, report_id)
    report_payload = _formatter.build_report_view_model(report)
    return _formatter.render_briefing_html(report_payload)


def _serialize_report(report) -> BriefingRead:
    """Internal helper to transform a model instance into a Read schema."""
    return BriefingRead(
        id=report.id,
        entity_name=report.entity_name,
        asset_ticker=report.asset_ticker,
        industry_sector=report.industry_sector,
        author_name=report.author_name,
        report_executive_summary=report.report_executive_summary,
        analyst_recommendation=report.analyst_recommendation,
        key_points=[h.description for h in report.highlights],
        risks=[t.description for t in report.threats],
        metrics=[
            BriefingMetricRead(label=m.metric_label, value=m.metric_value) 
            for m in report.financial_metrics
        ],
        generated_at=report.compiled_at,
        created_at=report.entry_created_at,
        updated_at=report.entry_updated_at,
    )


def _require_report(db: Session, report_id: int):
    """Internal helper to fetch a report or raise a custom exception."""
    report = get_report_by_id(db, report_id)
    if report is None:
        raise ResourceNotFoundException(
            message=f"Briefing report with ID {report_id} not found.", 
            details={"report_id": report_id}
        )
    return report
