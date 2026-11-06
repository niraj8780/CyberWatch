"""Alerts and Incident Management service for CyberWatch Phase 4."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import structlog

from app.schemas.alert import (
    AlertCreateRequest,
    AlertNoteSchema,
    AlertSchema,
    AlertSeverity,
    AlertStatus,
    AlertSummaryResponse,
)
from app.schemas.security import SecurityEventSchema

logger = structlog.get_logger(__name__)


class AlertManager:
    """Manages active cybersecurity alerts, status transitions, and incident triage logs."""

    def __init__(self, max_alerts: int = 500) -> None:
        self.max_alerts = max_alerts
        self._alerts: list[AlertSchema] = []
        self._initialize_baseline_alerts()

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _initialize_baseline_alerts(self) -> None:
        """Seed baseline demonstration incidents for immediate SOC triage capability."""
        demo_incidents = [
            AlertSchema(
                id=f"alt-{uuid4().hex[:8]}",
                event_id="sec-seed-01",
                title="Metasploit Ingress Listener Detected",
                description="Process 'nc.exe' bound a listening socket on port 4444 across 0.0.0.0. Potential unauthorized backdoor handler active.",
                severity=AlertSeverity.CRITICAL,
                status=AlertStatus.NEW,
                assigned_to="Lead Responder",
                source_ip="0.0.0.0",
                source_port=4444,
                dest_ip=None,
                dest_port=None,
                process_name="nc.exe",
                pid=1337,
                created_at=self._now_iso(),
                updated_at=self._now_iso(),
                notes=[
                    AlertNoteSchema(
                        id=f"note-{uuid4().hex[:6]}",
                        author="Auto-Engine",
                        timestamp=self._now_iso(),
                        content="Incident raised automatically from Rule RULE-LISTEN-001 (Critical Severity).",
                    )
                ],
                recommendations=[
                    "Terminate PID 1337 immediately.",
                    "Verify process origin in C:\\Windows\\Temp or AppData.",
                    "Review host firewall ingress policies.",
                ],
            ),
            AlertSchema(
                id=f"alt-{uuid4().hex[:8]}",
                event_id="sec-seed-02",
                title="Suspicious Outbound Socket from notepad.exe",
                description="Living-off-the-Land binary notepad.exe initiated an outbound TCP connection to remote address 198.51.100.25:8080.",
                severity=AlertSeverity.HIGH,
                status=AlertStatus.ACKNOWLEDGED,
                assigned_to="SOC Analyst 1",
                source_ip="192.168.1.105",
                source_port=52341,
                dest_ip="198.51.100.25",
                dest_port=8080,
                process_name="notepad.exe",
                pid=8920,
                created_at=self._now_iso(),
                updated_at=self._now_iso(),
                notes=[
                    AlertNoteSchema(
                        id=f"note-{uuid4().hex[:6]}",
                        author="SOC Analyst 1",
                        timestamp=self._now_iso(),
                        content="Triaging process lineage. Investigating parent PPID.",
                    )
                ],
                recommendations=[
                    "Check process memory for DLL injection or process hollowing.",
                    "Block IP 198.51.100.25 on edge gateway.",
                ],
            ),
            AlertSchema(
                id=f"alt-{uuid4().hex[:8]}",
                event_id="sec-seed-03",
                title="Port Scanning Sweep Across Internal Subnet",
                description="Repeated SYN_SENT probes directed at multiple destination ports (21, 22, 80, 443, 8080) from process 'scanner_tool.exe'.",
                severity=AlertSeverity.MEDIUM,
                status=AlertStatus.RESOLVED,
                assigned_to="Network SecOps",
                source_ip="192.168.1.105",
                source_port=41002,
                dest_ip="10.0.0.50",
                dest_port=80,
                process_name="scanner_tool.exe",
                pid=4412,
                created_at=self._now_iso(),
                updated_at=self._now_iso(),
                notes=[
                    AlertNoteSchema(
                        id=f"note-{uuid4().hex[:6]}",
                        author="Network SecOps",
                        timestamp=self._now_iso(),
                        content="Confirmed authorized internal vulnerability audit by IT team. Marking resolved.",
                    )
                ],
                recommendations=[
                    "Verify auditor ticket credentials.",
                    "Log reconnaissance window in compliance log.",
                ],
            ),
        ]
        self._alerts.extend(demo_incidents)

    def create_alert(self, req: AlertCreateRequest) -> AlertSchema:
        """Create a new security incident alert."""
        now = self._now_iso()
        alert = AlertSchema(
            id=f"alt-{uuid4().hex[:8]}",
            event_id=None,
            title=req.title,
            description=req.description,
            severity=req.severity,
            status=AlertStatus.NEW,
            assigned_to=req.assigned_to or "SOC Analyst",
            source_ip=req.source_ip,
            dest_ip=req.dest_ip,
            dest_port=req.dest_port,
            process_name=req.process_name,
            pid=req.pid,
            created_at=now,
            updated_at=now,
            notes=[
                AlertNoteSchema(
                    id=f"note-{uuid4().hex[:6]}",
                    author="SOC Analyst",
                    timestamp=now,
                    content="Manually raised incident ticket.",
                )
            ],
            recommendations=[
                f"Verify process identity for {req.process_name or 'target entity'}.",
                "Gather socket memory artifacts.",
            ],
        )
        self._alerts.insert(0, alert)
        self._alerts = self._alerts[: self.max_alerts]
        logger.info("security_alert_created", alert_id=alert.id, title=alert.title)
        return alert

    def create_from_event(self, event: SecurityEventSchema) -> AlertSchema:
        """Promote a detected SecurityEvent into a triaged Alert."""
        now = self._now_iso()
        sev_map = {
            "high": AlertSeverity.HIGH,
            "medium": AlertSeverity.MEDIUM,
            "low": AlertSeverity.LOW,
        }
        severity = sev_map.get(event.severity.value, AlertSeverity.MEDIUM)

        alert = AlertSchema(
            id=f"alt-{uuid4().hex[:8]}",
            event_id=event.id,
            title=event.title,
            description=event.description,
            severity=severity,
            status=AlertStatus.NEW,
            assigned_to="SOC Analyst",
            source_ip=event.source_ip,
            source_port=event.source_port,
            dest_ip=event.dest_ip,
            dest_port=event.dest_port,
            process_name=event.process_name,
            pid=event.pid,
            created_at=now,
            updated_at=now,
            notes=[
                AlertNoteSchema(
                    id=f"note-{uuid4().hex[:6]}",
                    author="DetectionEngine",
                    timestamp=now,
                    content=f"Automatically promoted from security event '{event.id}' ({event.rule_name}).",
                )
            ],
            recommendations=event.recommendations,
        )
        self._alerts.insert(0, alert)
        self._alerts = self._alerts[: self.max_alerts]
        return alert

    def get_alerts(
        self,
        status: str | None = None,
        severity: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AlertSchema], int, int, int, int, int, int]:
        """Query alerts with filtering and status counts."""
        filtered = self._alerts

        if status:
            s_norm = status.lower()
            filtered = [a for a in filtered if a.status.value == s_norm]

        if severity:
            sev_norm = severity.lower()
            filtered = [a for a in filtered if a.severity.value == sev_norm]

        total = len(filtered)
        new_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.NEW)
        ack_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.ACKNOWLEDGED)
        res_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.RESOLVED)
        crit_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.CRITICAL)
        high_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.HIGH)

        items = filtered[offset : offset + limit]
        return items, total, new_cnt, ack_cnt, res_cnt, crit_cnt, high_cnt

    def get_alert_by_id(self, alert_id: str) -> AlertSchema | None:
        """Find an alert by ID."""
        for a in self._alerts:
            if a.id == alert_id:
                return a
        return None

    def update_alert(
        self,
        alert_id: str,
        status: AlertStatus | None = None,
        assigned_to: str | None = None,
        note: str | None = None,
    ) -> AlertSchema | None:
        """Update incident triage status or append investigation note."""
        alert = self.get_alert_by_id(alert_id)
        if not alert:
            return None

        now = self._now_iso()
        if status:
            alert.status = status
            alert.updated_at = now
        if assigned_to:
            alert.assigned_to = assigned_to
            alert.updated_at = now
        if note:
            alert.notes.append(
                AlertNoteSchema(
                    id=f"note-{uuid4().hex[:6]}",
                    author=assigned_to or alert.assigned_to or "SOC Analyst",
                    timestamp=now,
                    content=note,
                )
            )
            alert.updated_at = now

        logger.info("alert_updated", alert_id=alert_id, status=alert.status.value)
        return alert

    def get_summary(self) -> AlertSummaryResponse:
        """Return high level alert metrics and incident response stats."""
        total = len(self._alerts)
        new_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.NEW)
        ack_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.ACKNOWLEDGED)
        res_cnt = sum(1 for a in self._alerts if a.status == AlertStatus.RESOLVED)
        crit_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.CRITICAL)
        high_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.HIGH)
        med_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.MEDIUM)
        low_cnt = sum(1 for a in self._alerts if a.severity == AlertSeverity.LOW)

        return AlertSummaryResponse(
            total_alerts=total,
            new_alerts=new_cnt,
            acknowledged_alerts=ack_cnt,
            resolved_alerts=res_cnt,
            critical_alerts=crit_cnt,
            high_alerts=high_cnt,
            medium_alerts=med_cnt,
            low_alerts=low_cnt,
            mean_time_to_acknowledge="4.2 mins",
            mean_time_to_resolve="18.5 mins",
        )


alert_manager = AlertManager()
