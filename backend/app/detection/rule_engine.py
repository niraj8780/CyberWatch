"""Central Rule Engine for evaluating network connections and orchestrating threat detections."""

from collections import Counter
from datetime import datetime, timezone
import time
from typing import Any

import structlog

from app.detection.rules.base import BaseDetectionRule
from app.detection.rules.connection_burst import ConnectionBurstRule
from app.detection.rules.port_scanning import PortScanRule
from app.detection.rules.repeated_attempts import RepeatedAttemptsRule
from app.detection.rules.suspicious_processes import SuspiciousProcessRule
from app.detection.rules.unexpected_listeners import UnexpectedListenersRule
from app.detection.rules.unusual_ports import UnusualPortsRule
from app.schemas.security import (
    DetectionRuleSchema,
    SecurityEventSchema,
    SecuritySummaryResponse,
    SeverityLevel,
)

logger = structlog.get_logger(__name__)


class RuleEngine:
    """Orchestrates security rule evaluation, event deduplication, and threat analytics."""

    def __init__(self, max_events: int = 500, dedup_cooldown_seconds: float = 60.0) -> None:
        self.max_events = max_events
        self.dedup_cooldown_seconds = dedup_cooldown_seconds

        self._rules: dict[str, BaseDetectionRule] = {}
        self._events: list[SecurityEventSchema] = []
        self._dedup_cache: dict[str, float] = {}
        self._last_scan_time: datetime | None = None

        # Register default baseline detection rules
        self._register_default_rules()

    def _register_default_rules(self) -> None:
        """Register default threat detection rules covering Module C specifications."""
        default_rules = [
            UnusualPortsRule(),
            SuspiciousProcessRule(),
            PortScanRule(),
            ConnectionBurstRule(),
            UnexpectedListenersRule(),
            RepeatedAttemptsRule(),
        ]
        for rule in default_rules:
            self._rules[rule.rule_id] = rule

    def register_rule(self, rule: BaseDetectionRule) -> None:
        """Add or overwrite a detection rule in the engine."""
        self._rules[rule.rule_id] = rule
        logger.info("registered_detection_rule", rule_id=rule.rule_id, name=rule.name)

    def get_rules(self) -> list[DetectionRuleSchema]:
        """Return all registered detection rules as schemas."""
        return [rule.to_schema() for rule in self._rules.values()]

    def get_rule(self, rule_id: str) -> BaseDetectionRule | None:
        """Find a rule by its rule_id."""
        return self._rules.get(rule_id)

    def toggle_rule(self, rule_id: str, enabled: bool) -> DetectionRuleSchema | None:
        """Enable or disable a specific detection rule."""
        rule = self._rules.get(rule_id)
        if not rule:
            return None
        rule.enabled = enabled
        logger.info("detection_rule_toggled", rule_id=rule_id, enabled=enabled)
        return rule.to_schema()

    def _event_fingerprint(self, event: SecurityEventSchema) -> str:
        """Generate a unique deduplication key for an event."""
        rule = event.rule_id
        proc = (event.process_name or "").lower()
        pid = event.pid or 0
        dip = event.dest_ip or "*"
        dport = event.dest_port or 0
        return f"{rule}:{proc}:{pid}:{dip}:{dport}"

    async def run_scan(
        self,
        connections: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> list[SecurityEventSchema]:
        """Evaluate connections against all enabled rules, deduplicating repetitive alerts.

        Args:
            connections: Active connection records from psutil.
            context: Additional environmental context.

        Returns:
            List of newly detected and recorded SecurityEventSchema objects.
        """
        now_mono = time.monotonic()
        new_events: list[SecurityEventSchema] = []

        # Prune stale dedup entries older than 3x cooldown
        stale_keys = [
            k
            for k, ts in self._dedup_cache.items()
            if now_mono - ts > (self.dedup_cooldown_seconds * 3)
        ]
        for k in stale_keys:
            del self._dedup_cache[k]

        for rule_id, rule in self._rules.items():
            if not rule.enabled:
                continue

            try:
                detected = rule.evaluate(connections, context)
                for evt in detected:
                    fp = self._event_fingerprint(evt)
                    last_seen = self._dedup_cache.get(fp)

                    # If unseen or cooldown expired, record as fresh event
                    if last_seen is None or (now_mono - last_seen) >= self.dedup_cooldown_seconds:
                        self._dedup_cache[fp] = now_mono
                        new_events.append(evt)
            except Exception as rule_exc:
                logger.error(
                    "detection_rule_evaluation_failed",
                    rule_id=rule_id,
                    error=str(rule_exc),
                )

        if new_events:
            # Prepend new events (newest first) and maintain ring buffer capacity
            self._events = (new_events + self._events)[: self.max_events]

            # Automatically promote high-severity threat events to actionable Alerts
            try:
                from app.alerts.manager import alert_manager
                for evt in new_events:
                    if evt.severity.value == "high":
                        alert_manager.create_from_event(evt)
            except Exception as alert_err:
                logger.debug("auto_alert_promotion_failed", error=str(alert_err))

        self._last_scan_time = datetime.now(timezone.utc)
        return new_events

    async def get_events(
        self,
        severity: str | None = None,
        rule_id: str | None = None,
        process_name: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SecurityEventSchema], int, int, int, int]:
        """Query security events with filtering and severity breakdown counts."""
        filtered = self._events

        if severity:
            sev_norm = severity.lower()
            filtered = [e for e in filtered if e.severity.value == sev_norm]

        if rule_id:
            filtered = [e for e in filtered if e.rule_id == rule_id]

        if process_name:
            p_norm = process_name.lower()
            filtered = [
                e for e in filtered if e.process_name and p_norm in e.process_name.lower()
            ]

        total = len(filtered)
        high_count = sum(1 for e in self._events if e.severity == SeverityLevel.HIGH)
        med_count = sum(1 for e in self._events if e.severity == SeverityLevel.MEDIUM)
        low_count = sum(1 for e in self._events if e.severity == SeverityLevel.LOW)

        items = filtered[offset : offset + limit]
        return items, total, high_count, med_count, low_count

    async def get_event_by_id(self, event_id: str) -> SecurityEventSchema | None:
        """Retrieve a specific security event by ID."""
        for evt in self._events:
            if evt.id == event_id:
                return evt
        return None

    async def get_summary(self) -> SecuritySummaryResponse:
        """Compile an aggregated summary of active security posture and detections."""
        total_events = len(self._events)
        high_count = sum(1 for e in self._events if e.severity == SeverityLevel.HIGH)
        med_count = sum(1 for e in self._events if e.severity == SeverityLevel.MEDIUM)
        low_count = sum(1 for e in self._events if e.severity == SeverityLevel.LOW)

        active_rules = sum(1 for r in self._rules.values() if r.enabled)
        total_rules = len(self._rules)

        # Determine overall threat level
        if high_count >= 5:
            threat_level = "CRITICAL"
        elif high_count > 0 or med_count >= 5:
            threat_level = "HIGH"
        elif med_count > 0:
            threat_level = "ELEVATED"
        else:
            threat_level = "LOW"

        # Top flagged processes
        proc_counts = Counter(
            e.process_name for e in self._events if e.process_name and e.process_name != "Unknown"
        )
        top_processes = [
            {"process_name": name, "count": count}
            for name, count in proc_counts.most_common(5)
        ]

        # Top flagged destination ports
        port_counts = Counter(
            e.dest_port for e in self._events if e.dest_port is not None
        )
        top_ports = [
            {"port": port, "count": count}
            for port, count in port_counts.most_common(5)
        ]

        last_scan_iso = (
            self._last_scan_time.isoformat() if self._last_scan_time else None
        )

        return SecuritySummaryResponse(
            total_events=total_events,
            high_severity_count=high_count,
            medium_severity_count=med_count,
            low_severity_count=low_count,
            active_rules_count=active_rules,
            total_rules_count=total_rules,
            last_scan_time=last_scan_iso,
            threat_level=threat_level,
            top_flagged_processes=top_processes,
            top_flagged_ports=top_ports,
        )

    async def clear_events(self) -> int:
        """Clear the in-memory event buffer and reset dedup cache."""
        cleared_count = len(self._events)
        self._events.clear()
        self._dedup_cache.clear()
        return cleared_count


# Module-level singleton engine instance
rule_engine = RuleEngine()
