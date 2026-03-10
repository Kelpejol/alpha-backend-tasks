"""
Business logic for general platform item management.

This service handles the lifecycle of generic items used for internal
tracking and demonstration.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sample_item import PlatformItem
from app.schemas.sample_item import PlatformItemCreate


def register_platform_item(db: Session, payload: PlatformItemCreate) -> PlatformItem:
    """
    Create a new platform item from the provided payload.

    Args:
        db (Session): Active database session.
        payload (PlatformItemCreate): Validated input data.

    Returns:
        PlatformItem: The persisted item instance.
    """
    item = PlatformItem(
        item_label=payload.label.strip(), 
        item_description=payload.description
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def retrieve_all_platform_items(db: Session) -> list[PlatformItem]:
    """
    Retrieve a list of all platform items, ordered by creation date.

    Args:
        db (Session): Active database session.

    Returns:
        list[PlatformItem]: A list of existing items.
    """
    query = select(PlatformItem).order_by(
        PlatformItem.record_created_at.desc(), 
        PlatformItem.id.desc()
    )
    return list(db.scalars(query).all())
