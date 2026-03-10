"""
Intelligence Briefing API Layer.

This package houses the FastAPI routers for all analytical, platform, 
and diagnostic endpoints. It ensures that the REST interface is 
decoupled from the underlying business logic.

Routers:
    - `briefings`: Report creation and lifecycle management.
    - `sample_items`: Generic platform item tracking.
    - `health`: Service diagnostics and health checks.
"""

from app.api.briefings import router as briefings_router
from app.api.health import router as health_router
from app.api.sample_items import router as sample_items_router

__all__ = [
    "briefings_router",
    "sample_items_router",
    "health_router",
]
