"""Shared Pydantic schemas across CyberWatch API modules."""

from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    app: str
    version: str
    uptime_seconds: float
    monitoring_active: bool

    model_config = ConfigDict(from_attributes=True)


class SystemInfoResponse(BaseModel):
    """System information response schema."""

    hostname: str
    platform: str
    cpu_count: int | None
    memory_total_gb: float
    memory_available_gb: float
    memory_percent: float
    boot_time: str
    python_version: str

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list wrapper schema."""

    total: int
    items: list[T]
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
