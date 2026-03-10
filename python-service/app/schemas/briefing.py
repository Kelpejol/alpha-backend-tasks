"""
Data validation schemas for briefing reports.

This module defines the Pydantic models used for structured data 
validation, serialization, and API contracts for the reporting system.

Pattern: Data Transfer Object (DTO)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel


class BriefingMetricInput(BaseModel):
    """Schema for validating individual financial metric inputs."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    label: str = Field(..., min_length=1, max_length=120, alias="name")
    value: str = Field(..., min_length=1, max_length=200)


class BriefingCreate(BaseModel):
    """
    Schema for validating new briefing report requests.

    Enforces domain rules for entity identification, content length, 
    and mandatory reporting sections.
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    entity_name: str = Field(..., min_length=1, max_length=180, alias="companyName")
    asset_ticker: str = Field(..., min_length=1, max_length=12, alias="ticker")
    industry_sector: str = Field(..., min_length=1, max_length=180, alias="sector")
    author_name: str = Field(..., min_length=1, max_length=180, alias="analystName")
    report_executive_summary: str = Field(..., min_length=1, max_length=5000, alias="summary")
    analyst_recommendation: str = Field(..., min_length=1, max_length=2000, alias="recommendation")
    key_points: list[str] = Field(..., min_length=2)
    risks: list[str] = Field(..., min_length=1)
    metrics: list[BriefingMetricInput] = Field(default_factory=list)

    @field_validator("asset_ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        """Ensure the asset ticker is trimmed and uppercase."""
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("Asset ticker is required")
        return cleaned

    @field_validator("entity_name", "industry_sector", "author_name", "report_executive_summary", "analyst_recommendation")
    @classmethod
    def trim_required_strings(cls, value: str) -> str:
        """Ensure mandatory string fields are not just whitespace."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field value is required and cannot be empty")
        return cleaned

    @field_validator("key_points", "risks")
    @classmethod
    def ensure_non_empty_items(cls, values: list[str]) -> list[str]:
        """Validate that all items in the list contain actual content."""
        cleaned = [item.strip() for item in values if item.strip()]
        if len(cleaned) != len(values):
            raise ValueError("List items must be non-empty strings")
        return cleaned

    @model_validator(mode="after")
    def ensure_unique_metric_names(self) -> "BriefingCreate":
        """Validate that metric labels are unique within a single report."""
        names = [metric.label.strip().lower() for metric in self.metrics]
        if len(names) != len(set(names)):
            raise ValueError("Financial metric labels must be unique per briefing")
        return self


class BriefingMetricRead(BaseModel):
    """Schema for serialized financial metric output."""
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)

    label: str = Field(..., alias="name")
    value: str


class BriefingRead(BaseModel):
    """
    Schema for serialized briefing report output.

    Provides a complete view of the report include all nested collections 
    and lifecycle timestamps.
    """
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    entity_name: str = Field(..., alias="companyName")
    asset_ticker: str = Field(..., alias="ticker")
    industry_sector: str = Field(..., alias="sector")
    author_name: str = Field(..., alias="analystName")
    report_executive_summary: str = Field(..., alias="summary")
    analyst_recommendation: str = Field(..., alias="recommendation")
    key_points: list[str]
    risks: list[str]
    metrics: list[BriefingMetricRead]
    generated_at: Optional[datetime] = Field(default=None, alias="generatedAt")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class GeneratedBriefingReport(BaseModel):
    """
    Schema for the compiled report view model.

    This model is used for data exchange with the HTML rendering engine 
    and external consumers of the compiled brief.
    """
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    briefing_id: int
    title: str
    company_name: str = Field(..., alias="companyName")
    ticker: str
    sector: str
    analyst_name: str = Field(..., alias="analystName")
    executive_summary: str = Field(..., alias="executiveSummary")
    recommendation: str
    key_points: list[str]
    risks: list[str]
    metrics: list[BriefingMetricRead]
    generated_at: str = Field(..., alias="generatedAt")
