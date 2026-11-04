"""SQLAlchemy ORM models for security events, alerts, and detection rules."""

from typing import Any, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database.base import Base, TimestampMixin

# Use portable JSON type compatible with SQLite and PostgreSQL
JsonType = JSON().with_variant(JSONB, "postgresql")


class SecurityEvent(Base, TimestampMixin):
    """Detected suspicious or anomalous network/system event."""

    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)  # low, medium, high, critical
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    dest_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    source_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dest_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str | None] = mapped_column(String(10), nullable=True)
    process_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pid: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[dict[str, Any] | None] = mapped_column(JsonType, nullable=True)
    recommendations: Mapped[Any | None] = mapped_column(JsonType, nullable=True)

    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class Alert(Base, TimestampMixin):
    """High-priority incident notification generated from a SecurityEvent."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False
    )
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="new", nullable=False
    )  # new, acknowledged, resolved
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    event: Mapped["SecurityEvent"] = relationship(back_populates="alerts")


class DetectionRule(Base, TimestampMixin):
    """Detection rule definition and parameters for Phase 2+ threat analysis."""

    __tablename__ = "detection_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )
    rule_config: Mapped[dict[str, Any] | None] = mapped_column(
        JsonType, nullable=True
    )
