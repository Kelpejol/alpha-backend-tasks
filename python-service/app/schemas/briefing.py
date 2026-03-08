from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel


class BriefingMetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    value: str = Field(min_length=1, max_length=200)


class BriefingCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    company_name: str = Field(min_length=1, max_length=180)
    ticker: str = Field(min_length=1, max_length=12)
    sector: str = Field(min_length=1, max_length=180)
    analyst_name: str = Field(min_length=1, max_length=180)
    summary: str = Field(min_length=1, max_length=5000)
    recommendation: str = Field(min_length=1, max_length=2000)
    key_points: list[str] = Field(min_length=2)
    risks: list[str] = Field(min_length=1)
    metrics: list[BriefingMetricCreate] = Field(default_factory=list)

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("ticker is required")
        return cleaned

    @field_validator("company_name", "sector", "analyst_name", "summary", "recommendation")
    @classmethod
    def trim_required_strings(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("value is required")
        return cleaned

    @field_validator("key_points", "risks")
    @classmethod
    def ensure_non_empty_items(cls, values: list[str]) -> list[str]:
        cleaned = [item.strip() for item in values if item.strip()]
        if len(cleaned) != len(values):
            raise ValueError("list values must be non-empty")
        return cleaned

    @model_validator(mode="after")
    def ensure_unique_metric_names(self) -> "BriefingCreate":
        names = [metric.name.strip().lower() for metric in self.metrics]
        if len(names) != len(set(names)):
            raise ValueError("metrics names must be unique per briefing")
        return self


class BriefingMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    value: str


class BriefingRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: list[str]
    risks: list[str]
    metrics: list[BriefingMetricRead]
    generated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class GeneratedBriefingReport(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    briefing_id: int
    title: str
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    executive_summary: str
    recommendation: str
    key_points: list[str]
    risks: list[str]
    metrics: list[BriefingMetricRead]
    generated_at: str
