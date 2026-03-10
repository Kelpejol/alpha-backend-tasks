"""
Analytical Intelligence Briefing Service.

This package contains the core application logic for the Intelligence 
Briefing Generator, including the API layer, domain models, business 
services, and presentation formatting.

Architecture:
    - `api/`: REST endpoints and request handlers.
    - `models/`: SQLAlchemy ORM entity definitions.
    - `schemas/`: Pydantic data validation and serialization.
    - `services/`: Business logic orchestration.
    - `repositories/`: Data access and persistence.
    - `exceptions/`: Domain-specific error hierarchy.
    - `templates/`: Jinja2 report templates.
"""

__version__ = "1.0.0"
