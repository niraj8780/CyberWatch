"""Base class for CyberWatch modular threat detection rules."""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.schemas.security import DetectionRuleSchema, DetectionType, SecurityEventSchema, SeverityLevel


class BaseDetectionRule(ABC):
    """Abstract base class for all security threat detection rules."""

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str,
        category: DetectionType,
        default_severity: SeverityLevel,
        enabled: bool = True,
        config: dict[str, Any] | None = None,
    ) -> None:
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.category = category
        self.default_severity = default_severity
        self.enabled = enabled
        self.config = config or {}

    @abstractmethod
    def evaluate(
        self,
        connections: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> list[SecurityEventSchema]:
        """Evaluate a batch of active connection records against this rule.

        Args:
            connections: List of standardized connection dictionaries.
            context: Additional environmental context (e.g., historical stats, system info).

        Returns:
            List of detected SecurityEventSchema instances.
        """
        pass

    def to_schema(self) -> DetectionRuleSchema:
        """Convert this rule definition to its corresponding Pydantic schema."""
        return DetectionRuleSchema(
            id=self.rule_id,
            name=self.name,
            description=self.description,
            category=self.category.value if hasattr(self.category, "value") else str(self.category),
            severity=self.default_severity,
            enabled=self.enabled,
            config=self.config,
        )

    def _create_event(
        self,
        title: str,
        description: str,
        confidence: float,
        evidence: dict[str, Any],
        recommendations: list[str],
        severity: SeverityLevel | None = None,
        source_ip: str | None = None,
        source_port: int | None = None,
        dest_ip: str | None = None,
        dest_port: int | None = None,
        protocol: str | None = None,
        process_name: str | None = None,
        pid: int | None = None,
    ) -> SecurityEventSchema:
        """Construct a validated SecurityEventSchema object with standard identifiers and timestamp."""
        now_iso = datetime.now(timezone.utc).isoformat()
        event_id = f"sec-{uuid4().hex[:8]}"

        return SecurityEventSchema(
            id=event_id,
            timestamp=now_iso,
            rule_id=self.rule_id,
            rule_name=self.name,
            detection_type=self.category.value if hasattr(self.category, "value") else str(self.category),
            severity=severity or self.default_severity,
            confidence=max(0.0, min(1.0, confidence)),
            title=title,
            description=description,
            source_ip=source_ip,
            source_port=source_port,
            dest_ip=dest_ip,
            dest_port=dest_port,
            protocol=protocol,
            process_name=process_name,
            pid=pid,
            evidence=evidence,
            recommendations=recommendations,
        )
