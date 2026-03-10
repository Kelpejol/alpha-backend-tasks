"""
Core database base class for SQLAlchemy models.

This module provides the central declarative base for all ORM models
in the system, enabling centralized metadata management and shared 
functionality.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all persistent entity models.

    All models must inherit from this class to be detected by the 
    SQLAlchemy metadata and migration systems.
    """
    pass
