from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingRead, GeneratedBriefingReport
from app.services.briefing_service import (
    create_briefing_record,
    generate_briefing_report,
    get_briefing_record,
    render_briefing_html,
)

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create_briefing(
    db: Annotated[Session, Depends(get_db)],
    payload: dict[str, Any] = Body(...),
) -> BriefingRead:
    try:
        validated = BriefingCreate.model_validate(payload)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    return create_briefing_record(db, validated)


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> BriefingRead:
    return get_briefing_record(db, briefing_id)


@router.post("/{briefing_id}/generate", response_model=GeneratedBriefingReport)
def generate_report(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> GeneratedBriefingReport:
    return generate_briefing_report(db, briefing_id)


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_report_html(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> HTMLResponse:
    html = render_briefing_html(db, briefing_id)
    return HTMLResponse(content=html)
