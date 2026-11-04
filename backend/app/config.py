"""Application configuration module using Pydantic Settings."""

import json
from functools import lru_cache
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """CyberWatch application settings loaded from environment or .env file."""

    APP_NAME: str = "CyberWatch"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database configuration (optional for Phase 1)
    DATABASE_URL: str | None = None

    # Monitoring configuration
    MONITOR_INTERVAL_SECONDS: float = 5.0
    MAX_CONNECTIONS_HISTORY: int = 10000

    # CORS origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value: Any) -> list[str]:
        """Parse CORS origins from a list, JSON string, or comma-separated string."""
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        elif isinstance(value, (list, tuple)):
            return [str(origin).strip() for origin in value]
        return ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance to avoid re-reading environment variables."""
    return Settings()
