"""
Application configuration and environment management.

This module defines the global settings for the application using 
Pydantic's `BaseSettings`. It handles environment variable loading, 
default values, and configuration validation.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Global application settings.

    Attributes:
        database_url (str): The connection string for the PostgreSQL database.
        env (Literal["development", "production", "test"]): Current execution environment.
        port (int): The port on which the web server should listen.
    """
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    database_url: str = "postgresql+psycopg://assessment_user:assessment_pass@localhost:5432/assessment_db"
    env: Literal["development", "production", "test"] = "development"
    port: int = 8000


@lru_cache
def get_settings() -> Settings:
    """
    Retrieve the global settings singleton.

    Uses `lru_cache` to ensure that settings are only loaded once 
    and then reused throughout the application lifecycle.

    Returns:
        Settings: The application settings instance.
    """
    return Settings()
