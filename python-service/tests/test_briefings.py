from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import BriefingReport  # noqa: F401


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def _valid_payload() -> dict:
    return {
        "companyName": "Acme Holdings",
        "ticker": "acm",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Stable cash flow with improving gross margin.",
        "recommendation": "Maintain buy rating with medium risk tolerance.",
        "keyPoints": [
            "Revenue growth accelerated quarter-over-quarter.",
            "Operating leverage improved through automation.",
        ],
        "risks": ["Currency volatility may pressure earnings."],
        "metrics": [
            {"name": "Revenue Growth", "value": "12%"},
            {"name": "Gross Margin", "value": "41.6%"},
        ],
    }


def test_create_and_get_briefing(client: TestClient) -> None:
    create_response = client.post("/briefings", json=_valid_payload())

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["companyName"] == "Acme Holdings"
    assert created["ticker"] == "ACM"
    assert created["sector"] == "Industrial Technology"
    assert created["analystName"] == "Jane Doe"
    assert created["generatedAt"] is None
    assert len(created["keyPoints"]) == 2

    briefing_id = created["id"]
    get_response = client.get(f"/briefings/{briefing_id}")

    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["id"] == briefing_id
    assert fetched["risks"] == ["Currency volatility may pressure earnings."]


def test_create_briefing_validation_rules(client: TestClient) -> None:
    payload = _valid_payload()
    payload["keyPoints"] = ["Only one point"]

    response = client.post("/briefings", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "VALIDATION_FAILED"
    assert "keyPoints" in str(data["details"])


def test_unique_metric_names_validation(client: TestClient) -> None:
    payload = _valid_payload()
    payload["metrics"] = [
        {"name": "Gross Margin", "value": "42%"},
        {"name": "gross margin", "value": "43%"},
    ]

    response = client.post("/briefings", json=payload)
    assert response.status_code == 422


def test_generate_and_render_html(client: TestClient) -> None:
    create_response = client.post("/briefings", json=_valid_payload())
    briefing_id = create_response.json()["id"]

    generate_response = client.post(f"/briefings/{briefing_id}/generate")
    assert generate_response.status_code == 200

    report = generate_response.json()
    assert report["briefingId"] == briefing_id
    assert report["title"] == "Acme Holdings (ACM) Analytical Briefing"
    assert report["sector"] == "Industrial Technology"
    assert report["analystName"] == "Jane Doe"
    assert "generatedAt" in report

    get_response = client.get(f"/briefings/{briefing_id}")
    assert get_response.status_code == 200
    assert get_response.json()["generatedAt"] is not None

    html_response = client.get(f"/briefings/{briefing_id}/html")
    assert html_response.status_code == 200
    assert "text/html" in html_response.headers["content-type"]
    assert "Executive Summary" in html_response.text
    assert "Acme Holdings (ACM) Analytical Briefing" in html_response.text
    assert "Industrial Technology" in html_response.text
    assert "Jane Doe" in html_response.text


def test_briefing_not_found(client: TestClient) -> None:
    response = client.get("/briefings/999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "RESOURCE_NOT_FOUND"
    assert "not found" in data["message"].lower()
