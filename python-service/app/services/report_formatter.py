"""
Presentation formatting for briefing reports.

This module provides the logic for transforming database entities into 
human-readable report payloads and rendering them into HTML using 
server-side templates.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

# Path to the templates directory relative to this file.
_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """
    Orchestrates the transformation of raw data into analytical reports.

    Pattern: Presenter / Formatter
    """

    def __init__(self) -> None:
        """Initialize the Jinja2 template environment."""
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def build_report_view_model(self, report: Any) -> dict[str, Any]:
        """
        Transform a BriefingReport ORM instance into a presentation-ready dictionary.

        Args:
            report (BriefingReport): The database model instance.

        Returns:
            dict[str, Any]: A flat dictionary containing formatted strings for the view.
        """
        # Determine the compilation timestamp.
        compiled_at = (
            report.compiled_at.isoformat()
            if report.compiled_at is not None
            else self.generate_current_timestamp()
        )

        return {
            "briefingId": report.id,
            "title": f"{report.entity_name} ({report.asset_ticker}) Analytical Briefing",
            "companyName": report.entity_name,
            "ticker": report.asset_ticker,
            "sector": report.industry_sector,
            "analystName": report.author_name,
            "executiveSummary": report.report_executive_summary,
            "recommendation": report.analyst_recommendation,
            "keyPoints": [h.description for h in report.highlights],
            "risks": [t.description for t in report.threats],
            "metrics": [
                {"name": m.metric_label, "value": m.metric_value} 
                for m in report.financial_metrics
            ],
            "generatedAt": compiled_at,
        }

    def render_briefing_html(self, report_payload: dict[str, Any]) -> str:
        """
        Render a view model into the final HTML output.

        Args:
            report_payload (dict[str, Any]): The formatted view model.

        Returns:
            str: Fully rendered HTML string.
        """
        template = self._env.get_template("briefing_report.html")
        return template.render(
            title=report_payload["title"],
            generated_at=report_payload["generatedAt"],
            report=report_payload,
        )

    @staticmethod
    def generate_current_timestamp() -> str:
        """Generate a standardized ISO 8601 timestamp in UTC."""
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
