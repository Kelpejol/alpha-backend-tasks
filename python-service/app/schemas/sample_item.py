"""
Data schemas for platform organizational items.

This module defines the Pydantic models used for validating input 
and structuring output for general platform items.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class PlatformItemCreate(BaseModel):
    """Schema for creating a new platform item."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    label: str = Field(..., min_length=1, max_length=120, alias="name")
    description: Optional[str] = Field(default=None, max_length=500)


class PlatformItemRead(BaseModel):
    """Schema for reading platform item data."""
    model_config = ConfigDict(
        from_attributes=True, 
        alias_generator=to_camel, 
        populate_by_name=True
    )

    id: int
    item_label: str = Field(..., alias="name")
    item_description: Optional[str] = Field(default=None, alias="description")
    record_created_at: datetime = Field(..., alias="createdAt")
