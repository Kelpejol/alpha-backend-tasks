from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, BriefingRisk
from app.schemas.briefing import BriefingCreate


def create_briefing(db: Session, payload: BriefingCreate) -> Briefing:
    briefing = Briefing(
        company_name=payload.company_name,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analyst_name,
        summary=payload.summary,
        recommendation=payload.recommendation,
    )

    briefing.points = [
        BriefingPoint(position=index, content=content)
        for index, content in enumerate(payload.key_points, start=1)
    ]
    briefing.risks = [
        BriefingRisk(position=index, content=content)
        for index, content in enumerate(payload.risks, start=1)
    ]
    briefing.metrics = [BriefingMetric(name=metric.name.strip(), value=metric.value.strip()) for metric in payload.metrics]

    db.add(briefing)
    db.commit()
    db.refresh(briefing)
    return get_briefing_by_id(db, briefing.id)


def get_briefing_by_id(db: Session, briefing_id: int) -> Optional[Briefing]:
    query = (
        select(Briefing)
        .where(Briefing.id == briefing_id)
        .options(
            selectinload(Briefing.points),
            selectinload(Briefing.risks),
            selectinload(Briefing.metrics),
        )
    )
    return db.scalar(query)


def mark_briefing_generated(db: Session, briefing: Briefing) -> Briefing:
    briefing.generated_at = datetime.now(timezone.utc).replace(microsecond=0)
    db.add(briefing)
    db.commit()
    db.refresh(briefing)
    return get_briefing_by_id(db, briefing.id)
