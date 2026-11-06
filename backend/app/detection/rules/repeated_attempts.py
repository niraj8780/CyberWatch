"""Detection rule for identifying repeated failed connection attempts or persistent beaconing."""

from collections import defaultdict
from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel


class RepeatedAttemptsRule(BaseDetectionRule):
    """Detects repeated or persistent connection attempts characteristic of beaconing or unreachable C2."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-CONN-001",
            name="Repeated Connection Attempts / Beaconing Probes",
            description="Identifies repeated or stuck SYN_SENT connections to the same remote endpoint, suggesting persistent C2 beaconing or blocked communications.",
            category=DetectionType.REPEATED_ATTEMPTS,
            default_severity=SeverityLevel.LOW,
            enabled=True,
            config={
                "syn_sent_threshold": 3,
                "same_endpoint_threshold": 6,
            },
        )

    def evaluate(
        self,
        connections: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> list[SecurityEventSchema]:
        if not self.enabled:
            return []

        events: list[SecurityEventSchema] = []
        syn_thresh = self.config.get("syn_sent_threshold", 3)
        endpoint_thresh = self.config.get("same_endpoint_threshold", 6)

        # Count SYN_SENT by (pid, process_name, remote_ip, remote_port)
        syn_counts: dict[tuple[int, str, str, int], list[dict[str, Any]]] = defaultdict(list)
        endpoint_counts: dict[tuple[int, str, str, int], list[dict[str, Any]]] = defaultdict(list)

        for conn in connections:
            remote_ip = conn.get("remote_ip")
            remote_port = conn.get("remote_port")
            status = (conn.get("status") or "").upper()
            pid = conn.get("pid") or 0
            proc_name = conn.get("process_name") or "Unknown"

            if not remote_ip or not remote_port:
                continue

            if remote_ip in ("127.0.0.1", "::1", "localhost"):
                continue

            key = (pid, proc_name, remote_ip, remote_port)
            endpoint_counts[key].append(conn)

            if status in ("SYN_SENT", "TIME_WAIT"):
                syn_counts[key].append(conn)

        # Check stuck SYN_SENT attempts
        for (pid, proc_name, remote_ip, remote_port), conn_list in syn_counts.items():
            count = len(conn_list)
            if count >= syn_thresh:
                sample = conn_list[0]
                event = self._create_event(
                    title=f"Persistent SYN_SENT Probing to {remote_ip}:{remote_port}",
                    description=(
                        f"Process '{proc_name}' (PID: {pid}) has {count} connection attempts stuck in "
                        f"SYN_SENT status towards {remote_ip}:{remote_port}. This repeated pattern suggests "
                        f"automated beaconing to an unreachable, sinkholed, or firewalled C2 host."
                    ),
                    severity=SeverityLevel.MEDIUM if count >= 5 else SeverityLevel.LOW,
                    confidence=0.82,
                    source_ip=sample.get("local_ip"),
                    source_port=sample.get("local_port"),
                    dest_ip=remote_ip,
                    dest_port=remote_port,
                    protocol=sample.get("protocol", "tcp").upper(),
                    process_name=proc_name,
                    pid=pid if pid > 0 else None,
                    evidence={
                        "stuck_attempts_count": count,
                        "destination_ip": remote_ip,
                        "destination_port": remote_port,
                        "status": "SYN_SENT",
                        "process_name": proc_name,
                        "pid": pid,
                    },
                    recommendations=[
                        f"Inspect endpoint reputation for {remote_ip} in threat intelligence feeds.",
                        f"Check if PID {pid} is repeating connection attempts at fixed scheduled intervals.",
                        f"Verify if remote service has been sinkholed or blocked by perimeter DNS filtering.",
                        f"Terminate process '{proc_name}' if unauthorized.",
                    ],
                )
                events.append(event)

        return events
