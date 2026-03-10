"""
API endpoints for general platform items.

This module provides internal tracking and demonstration routes for 
simple entities within the platform.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sample_item import PlatformItemCreate, PlatformItemRead
from app.services.sample_item_service import (
    register_platform_item,
    retrieve_all_platform_items,
)

# Router configuration for platform-wide items.
router = APIRouter(prefix="/sample-items", tags=["platform-items"])


@router.post(
    "", 
    response_model=PlatformItemRead, 
    status_code=status.HTTP_201_CREATED,
    summary="Create a platform item",
    description="Registers a generic item into the platform for tracking purposes."
)
def create_item(
    db: Annotated[Session, Depends(get_db)], 
    payload: PlatformItemCreate
) -> PlatformItemRead:
    """Entry point for item registration."""
    return register_platform_item(db, payload)


@router.get(
    "", 
    response_model=list[PlatformItemRead],
    summary="List all platform items",
    description="Retrieves a list of all existing platform-wide tracked items."
)
def list_items(db: Annotated[Session, Depends(get_db)]) -> list[PlatformItemRead]:
    """Entry point for item listing."""
    return retrieve_all_platform_items(db)
