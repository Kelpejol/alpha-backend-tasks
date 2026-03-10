"""
Database models for basic platform entities.

This module houses simple or legacy models used for administrative tracking
or demonstration purposes within the system.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlatformItem(Base):
    """
    Generic item used for internal demonstration and status tracking.

    Pattern: Simple Entity
    """
    __tablename__ = "platform_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    item_label: Mapped[str] = mapped_column(String(255), nullable=False)
    item_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    record_created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
