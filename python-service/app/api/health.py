"""
Platform health and diagnostic endpoints.

This module provides basic connectivity checks to ensure the service 
is operational and accessible.
"""

from fastapi import APIRouter

# Router configuration for platform diagnostics.
router = APIRouter(prefix="/health", tags=["diagnostics"])


@router.get(
    "", 
    summary="Health check",
    description="Simple diagnostic endpoint to verify service availability."
)
def get_health() -> dict[str, str]:
    """Entry point for health diagnostics."""
    return {"status": "operational", "version": "1.0.0"}
