from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Formats briefing records into report payloads and HTML output."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def build_briefing_report_payload(self, briefing: Any) -> dict[str, Any]:
        generated_at = (
            briefing.generated_at.isoformat()
            if briefing.generated_at is not None
            else self.generated_timestamp()
        )
        return {
            "briefingId": briefing.id,
            "title": f"{briefing.company_name} ({briefing.ticker}) Briefing",
            "companyName": briefing.company_name,
            "ticker": briefing.ticker,
            "sector": briefing.sector,
            "analystName": briefing.analyst_name,
            "executiveSummary": briefing.summary,
            "recommendation": briefing.recommendation,
            "keyPoints": [point.content for point in briefing.points],
            "risks": [risk.content for risk in briefing.risks],
            "metrics": [{"name": metric.name, "value": metric.value} for metric in briefing.metrics],
            "generatedAt": generated_at,
        }

    def render_briefing_html(self, report_payload: dict[str, Any]) -> str:
        template = self._env.get_template("briefing_report.html")
        return template.render(
            title=report_payload["title"],
            generated_at=report_payload["generatedAt"],
            report=report_payload,
        )

    @staticmethod
    def generated_timestamp() -> str:
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
