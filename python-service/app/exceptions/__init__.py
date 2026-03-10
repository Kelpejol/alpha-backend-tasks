"""
Custom exception hierarchy for the briefing system.

This module defines a structured set of exceptions to represent 
various failure modes in the application, from domain-level 
rule violations to infrastructure-level resource issues.
"""

from typing import Any, Optional


class AppException(Exception):
    """
    Base exception for all application-specific errors.

    Attributes:
        status_code (int): Recommended HTTP status code for this error.
        message (str): Human-readable error message.
        error_code (str): Machine-readable identifier for the error type.
        details (Optional[dict]): Additional context or metadata.
    """
    status_code = 500
    error_code = "INTERNAL_SERVER_ERROR"

    def __init__(
        self, 
        message: str, 
        status_code: Optional[int] = None, 
        error_code: Optional[str] = None, 
        details: Optional[dict[str, Any]] = None
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code:
            self.status_code = status_code
        if error_code:
            self.error_code = error_code
        self.details = details or {}


class ResourceNotFoundException(AppException):
    """Raised when a requested resource is not found in the persistence layer."""
    status_code = 404
    error_code = "RESOURCE_NOT_FOUND"


class BusinessRuleViolationException(AppException):
    """Raised when an operation violates a domain-level business rule."""
    status_code = 400
    error_code = "BUSINESS_RULE_VIOLATION"


class ValidationException(AppException):
    """Raised when data fails schema or domain validation checks."""
    status_code = 422
    error_code = "VALIDATION_FAILED"


class BriefingReportException(AppException):
    """Base exception for errors specific to briefing report lifecycle."""
    error_code = "BRIEFING_ERROR"


class ReportGenerationException(BriefingReportException):
    """Raised when report compilation or rendering fails."""
    status_code = 500
    error_code = "REPORT_GENERATION_FAILED"
