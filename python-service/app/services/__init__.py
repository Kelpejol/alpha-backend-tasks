"""
Business logic and orchestration layer.

This package contains the service modules which implement the core 
functional requirements of the system, coordinating data between 
the API, repository, and formatting layers.

Services:
    - `briefing_service`: Lifecycle management for analyst briefings.
    - `report_formatter`: Professional styling and HTML rendering.
    - `sample_item_service`: Platform organizational items.
"""

from app.services.briefing_service import (
    register_new_briefing,
    retrieve_briefing_by_id,
    execute_report_compilation,
    render_briefing_as_html,
)
from app.services.report_formatter import ReportFormatter
from app.services.sample_item_service import (
    register_platform_item,
    retrieve_all_platform_items,
)

__all__ = [
    "register_new_briefing",
    "retrieve_briefing_by_id",
    "execute_report_compilation",
    "render_briefing_as_html",
    "ReportFormatter",
    "register_platform_item",
    "retrieve_all_platform_items",
]
