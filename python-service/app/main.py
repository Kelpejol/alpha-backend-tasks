"""
Main application entry point for the Intelligence Briefing Generator.

This module initializes the FastAPI application, includes all 
API routers, and defines the root diagnostic endpoint.
It also registers global exception handlers for structured error reporting.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.briefings import router as briefings_router
from app.api.health import router as health_router
from app.api.sample_items import router as sample_items_router
from app.exceptions import AppException

# Core application instance with professional metadata.
app = FastAPI(
    title="Analytical Intelligence Briefing Service", 
    version="1.0.0",
    description="A production-grade engine for generating professional analyst briefings."
)

# Registration of API modules.
app.include_router(health_router)
app.include_router(briefings_router)
app.include_router(sample_items_router)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Global handler for structured application exceptions.

    Formats the response into a consistent, actionable JSON payload.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
            "path": request.url.path,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Global handler for Pydantic validation errors.

    Translates cryptic internal validation errors into human-readable 
    structured responses.
    """
    errors = []
    for error in exc.errors():
        # Clean up field location for readability
        loc = ".".join([str(p) for p in error.get("loc", []) if p != "body"])
        errors.append({
            "field": loc or "root",
            "issue": error.get("msg"),
            "type": error.get("type"),
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_FAILED",
            "message": "The provided data fails the required domain rules.",
            "details": {"validation_errors": errors},
            "path": request.url.path,
        },
    )


@app.get("/", tags=["diagnostics"], summary="Service identification")
def read_root() -> dict[str, str]:
    """Entry point for identifying the service and its current status."""
    return {
        "service": "Analytical Intelligence Briefing Generator", 
        "status": "ready"
    }
