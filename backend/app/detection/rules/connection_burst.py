"""Detection rule for identifying abnormal connection bursts or sudden spikes in outbound sockets."""

from collections import defaultdict
from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel

# Standard web browsers normally maintain many open connections to CDNs/domains
KNOWN_HIGH_CONCURRENCY_PROCESSES = {
    "chrome.exe",
    "firefox.exe",
    "msedge.exe",
    "brave.exe",
    "opera.exe",
    "code.exe",
    "slack.exe",
    "discord.exe",
    "teams.exe",
}


class ConnectionBurstRule(BaseDetectionRule):
    """Detects abnormal bursts of outbound network connections originating from a single process."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-BURST-001",
            name="Unusual Connection Frequency / Outbound Burst",
            description="Identifies abnormal spikes in concurrent outbound sockets that may indicate worm propagation, data exfiltration, or botnet DDoS activity.",
            category=DetectionType.BURST_ACTIVITY,
            default_severity=SeverityLevel.MEDIUM,
            enabled=True,
            config={
                "standard_process_threshold": 15,
                "browser_process_threshold": 60,
                "high_severity_multiplier": 2.5,
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
        std_thresh = self.config.get("standard_process_threshold", 15)
        browser_thresh = self.config.get("browser_process_threshold", 60)
        high_mult = self.config.get("high_severity_multiplier", 2.5)

        conns_by_proc: dict[tuple[int, str], list[dict[str, Any]]] = defaultdict(list)

        for conn in connections:
            remote_ip = conn.get("remote_ip")
            if not remote_ip:
                continue

            # Ignore loopback
            if remote_ip in ("127.0.0.1", "::1", "localhost"):
                continue

            pid = conn.get("pid") or 0
            proc_name = conn.get("process_name") or "Unknown"
            conns_by_proc[(pid, proc_name)].append(conn)

        for (pid, proc_name), proc_conns in conns_by_proc.items():
            conn_count = len(proc_conns)
            norm_name = proc_name.lower()
            threshold = browser_thresh if norm_name in KNOWN_HIGH_CONCURRENCY_PROCESSES else std_thresh

            if conn_count >= threshold:
                is_high = conn_count >= (threshold * high_mult)
                severity = SeverityLevel.HIGH if is_high else SeverityLevel.MEDIUM
                confidence = min(0.92, 0.70 + (conn_count / threshold) * 0.1)

                sample_endpoints = [
                    f"{c.get('remote_ip')}:{c.get('remote_port')}"
                    for c in proc_conns[:8]
                    if c.get("remote_ip")
                ]
                sample_conn = proc_conns[0]

                event = self._create_event(
                    title=f"High Connection Burst: {conn_count} Outbound Sockets by {proc_name}",
                    description=(
                        f"Process '{proc_name}' (PID: {pid}) has established {conn_count} active outbound "
                        f"connections, exceeding the normal baseline threshold of {threshold}. "
                        f"This volume may indicate rapid telemetry beaconing, data exfiltration, or DDoS participation."
                    ),
                    severity=severity,
                    confidence=confidence,
                    source_ip=sample_conn.get("local_ip"),
                    source_port=sample_conn.get("local_port"),
                    dest_ip=sample_conn.get("remote_ip"),
                    dest_port=sample_conn.get("remote_port"),
                    protocol=sample_conn.get("protocol", "tcp").upper(),
                    process_name=proc_name,
                    pid=pid if pid > 0 else None,
                    evidence={
                        "total_concurrent_connections": conn_count,
                        "configured_threshold": threshold,
                        "process_name": proc_name,
                        "pid": pid,
                        "destination_sample": sample_endpoints,
                    },
                    recommendations=[
                        f"Audit bandwidth consumption for process '{proc_name}' (PID: {pid}).",
                        f"Examine whether '{proc_name}' is performing unauthorized bulk transfers or web scraping.",
                        f"Check if machine is infected with malware participating in distributed denial-of-service.",
                        f"Suspend PID {pid} if activity is unapproved.",
                    ],
                )
                events.append(event)

        return events
