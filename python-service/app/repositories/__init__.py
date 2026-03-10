"""
Data access layer for the briefing system.

This package provides the Repository Pattern implementation for 
interacting with the database, isolating ORM logic from the 
higher-level business services.

Repositories:
    - `briefing_repository`: Analytical report persistence.
"""

from app.repositories.briefing_repository import (
    create_briefing_record, 
    get_report_by_id, 
    mark_report_as_compiled
)

__all__ = [
    "create_briefing_record",
    "get_report_by_id",
    "mark_report_as_compiled",
]
