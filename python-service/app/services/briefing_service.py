from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.briefing_repository import create_briefing, get_briefing_by_id, mark_briefing_generated
from app.schemas.briefing import BriefingCreate, BriefingMetricRead, BriefingRead, GeneratedBriefingReport
from app.services.report_formatter import ReportFormatter

_formatter = ReportFormatter()


def create_briefing_record(db: Session, payload: BriefingCreate) -> BriefingRead:
    briefing = create_briefing(db, payload)
    return _to_briefing_read(briefing)


def get_briefing_record(db: Session, briefing_id: int) -> BriefingRead:
    briefing = _require_briefing(db, briefing_id)
    return _to_briefing_read(briefing)


def generate_briefing_report(db: Session, briefing_id: int) -> GeneratedBriefingReport:
    briefing = _require_briefing(db, briefing_id)
    generated_briefing = mark_briefing_generated(db, briefing)
    report_payload = _formatter.build_briefing_report_payload(generated_briefing)
    # Render once during generation so template errors surface at generate time.
    _formatter.render_briefing_html(report_payload)
    return GeneratedBriefingReport.model_validate(report_payload)


def render_briefing_html(db: Session, briefing_id: int) -> str:
    briefing = _require_briefing(db, briefing_id)
    report_payload = _formatter.build_briefing_report_payload(briefing)
    return _formatter.render_briefing_html(report_payload)


def _to_briefing_read(briefing) -> BriefingRead:
    return BriefingRead(
        id=briefing.id,
        company_name=briefing.company_name,
        ticker=briefing.ticker,
        sector=briefing.sector,
        analyst_name=briefing.analyst_name,
        summary=briefing.summary,
        recommendation=briefing.recommendation,
        key_points=[point.content for point in briefing.points],
        risks=[risk.content for risk in briefing.risks],
        metrics=[BriefingMetricRead(name=metric.name, value=metric.value) for metric in briefing.metrics],
        generated_at=briefing.generated_at,
        created_at=briefing.created_at,
        updated_at=briefing.updated_at,
    )


def _require_briefing(db: Session, briefing_id: int):
    briefing = get_briefing_by_id(db, briefing_id)
    if briefing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return briefing
