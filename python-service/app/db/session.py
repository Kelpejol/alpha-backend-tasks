"""
Database session management for the application.

This module provides the core session handling logic, including 
engine initialization and the dependency injection generator for 
FastAPI's dependency system.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

# Initialize the SQLAlchemy engine with settings from the environment.
settings = get_settings()
engine = create_engine(settings.database_url, echo=False)

# Session factory for creating new database sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session.

    Yields:
        Session: A SQLAlchemy database session object.

    Notes:
        The session is automatically closed after the request is 
        processed via the try-finally block.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
