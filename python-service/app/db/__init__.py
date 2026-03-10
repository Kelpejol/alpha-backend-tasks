"""
Database infrastructure package.

This package provides the core SQLAlchemy and migration management 
logic for the application, including the declarative base, 
session management, and the SQL-based migration runner.
"""

from app.db.base import Base
from app.db.session import get_db

__all__ = [
    "Base",
    "get_db",
]
