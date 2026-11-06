"""Pydantic schemas for the Phase 4 Alerts & Incident Management module."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class AlertStatus(str, Enum):
    """Lifecycle status of a security incident alert."""

    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertSeverity(str, Enum):
    """Incident priority level."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertNoteSchema(BaseModel):
    """Note or triage comment added by a security analyst."""

    id: str
    author: str
    timestamp: str
    content: str

    model_config = ConfigDict(from_attributes=True)


class AlertSchema(BaseModel):
    """Full incident alert schema."""

    id: str = Field(..., description="Unique alert identifier (e.g. alt-1a2b3c4d)")
    event_id: str | None = Field(default=None, description="Linked SecurityEvent ID")
    title: str = Field(..., description="Concise summary title of incident")
    description: str = Field(..., description="Incident narrative and context")
    severity: AlertSeverity = Field(..., description="Incident severity level")
    status: AlertStatus = Field(default=AlertStatus.NEW, description="Triage status")
    assigned_to: str | None = Field(default="SOC Analyst", description="Assigned responder")
    source_ip: str | None = Field(default=None, description="Local/Source IP")
    source_port: int | None = Field(default=None, description="Local/Source port")
    dest_ip: str | None = Field(default=None, description="Remote/Target IP")
    dest_port: int | None = Field(default=None, description="Remote/Target port")
    process_name: str | None = Field(default=None, description="Offending binary")
    pid: int | None = Field(default=None, description="Process ID")
    created_at: str = Field(..., description="Alert generation timestamp")
    updated_at: str = Field(..., description="Last status update timestamp")
    notes: list[AlertNoteSchema] = Field(default_factory=list, description="Investigation notes")
    recommendations: list[str] = Field(default_factory=list, description="Containment checklist")

    model_config = ConfigDict(from_attributes=True)


class AlertCreateRequest(BaseModel):
    """Request payload to manually raise an incident alert."""

    title: str
    description: str
    severity: AlertSeverity = AlertSeverity.MEDIUM
    source_ip: str | None = None
    dest_ip: str | None = None
    dest_port: int | None = None
    process_name: str | None = None
    pid: int | None = None
    assigned_to: str | None = "SOC Analyst"


class AlertUpdateRequest(BaseModel):
    """Request payload to change alert status or append triage notes."""

    status: AlertStatus | None = None
    assigned_to: str | None = None
    note: str | None = None


class AlertListResponse(BaseModel):
    """Paginated list response for security incident alerts."""

    total: int
    items: list[AlertSchema]
    new_count: int
    acknowledged_count: int
    resolved_count: int
    critical_count: int
    high_count: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)


class AlertSummaryResponse(BaseModel):
    """Statistical summary of incident response metrics."""

    total_alerts: int
    new_alerts: int
    acknowledged_alerts: int
    resolved_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    mean_time_to_acknowledge: str
    mean_time_to_resolve: str

    model_config = ConfigDict(from_attributes=True)
