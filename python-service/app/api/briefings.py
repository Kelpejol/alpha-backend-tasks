"""
API endpoints for managing analyst briefing reports.

This module exposes the REST interface for creating, retrieving, 
and generating briefing reports. All routes delegate business logic 
to the `briefing_service`.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingRead, GeneratedBriefingReport
from app.services.briefing_service import (
    register_new_briefing,
    retrieve_briefing_by_id,
    execute_report_compilation,
    render_briefing_as_html,
)

# Router configuration for briefing-related endpoints.
router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post(
    "", 
    response_model=BriefingRead, 
    status_code=status.HTTP_201_CREATED,
    summary="Create a new briefing",
    description="Registers a new briefing report with initial data and metadata."
)
def create_briefing(
    db: Annotated[Session, Depends(get_db)],
    payload: BriefingCreate = Body(...),
) -> BriefingRead:
    """Entry point for briefing registration."""
    # Automated Pydantic validation handles the payload; global handler manages errors.
    return register_new_briefing(db, payload)


@router.get(
    "/{briefing_id}", 
    response_model=BriefingRead,
    summary="Retrieve a briefing by ID",
    description="Fetches the structured data for a single briefing record."
)
def get_briefing(
    briefing_id: int, 
    db: Annotated[Session, Depends(get_db)]
) -> BriefingRead:
    """Entry point for report retrieval."""
    return retrieve_briefing_by_id(db, briefing_id)


@router.post(
    "/{briefing_id}/generate", 
    response_model=GeneratedBriefingReport,
    summary="Compile a briefing report",
    description="Transforms briefing data into a ready-to-render view model."
)
def generate_report(
    briefing_id: int, 
    db: Annotated[Session, Depends(get_db)]
) -> GeneratedBriefingReport:
    """Entry point for report compilation."""
    return execute_report_compilation(db, briefing_id)


@router.get(
    "/{briefing_id}/html", 
    response_class=HTMLResponse,
    summary="Fetch rendered HTML report",
    description="Returns the professionally rendered HTML version of the briefing."
)
def get_report_html(
    briefing_id: int, 
    db: Annotated[Session, Depends(get_db)]
) -> HTMLResponse:
    """Entry point for HTML rendering."""
    html = render_briefing_as_html(db, briefing_id)
    return HTMLResponse(content=html)
