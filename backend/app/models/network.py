"""SQLAlchemy ORM models for network connections and monitoring sessions."""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class MonitoringSession(Base, TimestampMixin):
    """Represents a period of active monitoring observations."""

    __tablename__ = "monitoring_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_connections_observed: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default="active", nullable=False
    )

    connections: Mapped[list["NetworkConnectionRecord"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class NetworkConnectionRecord(Base, TimestampMixin):
    """Persisted snapshot record of an observed network connection."""

    __tablename__ = "network_connection_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    local_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    local_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    remote_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    remote_port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str] = mapped_column(String(10), nullable=False)
    ip_version: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    pid: Mapped[int | None] = mapped_column(Integer, nullable=True)
    process_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("monitoring_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    session: Mapped[Optional["MonitoringSession"]] = relationship(
        back_populates="connections"
    )
