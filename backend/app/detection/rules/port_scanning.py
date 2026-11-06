"""Detection rule for identifying port scanning or network reconnaissance behavior."""

from collections import defaultdict
from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel


class PortScanRule(BaseDetectionRule):
    """Detects rapid or multi-port connection patterns characteristic of port scanning reconnaissance."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-SCAN-001",
            name="Port Scanning / Network Reconnaissance",
            description="Identifies single processes or sources attempting concurrent connections to multiple distinct destination ports.",
            category=DetectionType.PORT_SCAN,
            default_severity=SeverityLevel.HIGH,
            enabled=True,
            config={
                "port_threshold_medium": 4,
                "port_threshold_high": 8,
                "ignore_browser_pids": True,
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
        med_thresh = self.config.get("port_threshold_medium", 4)
        high_thresh = self.config.get("port_threshold_high", 8)

        # Group connections by (pid, process_name, target_host)
        # Note: If target_host is broad, group by (pid, process_name) to detect scanning across destinations
        targets_by_proc: dict[tuple[int, str], set[int]] = defaultdict(set)
        endpoints_by_proc: dict[tuple[int, str], list[str]] = defaultdict(list)
        conns_by_proc: dict[tuple[int, str], list[dict[str, Any]]] = defaultdict(list)

        for conn in connections:
            remote_ip = conn.get("remote_ip")
            remote_port = conn.get("remote_port")
            pid = conn.get("pid") or 0
            proc_name = conn.get("process_name") or "Unknown"

            if not remote_ip or not remote_port:
                continue

            # Skip localhost
            if remote_ip in ("127.0.0.1", "::1", "localhost"):
                continue

            # Browsers make legitimate connections to CDN ports, but rarely to many distinct uncommon ports
            # Let's track ports
            key = (pid, proc_name)
            targets_by_proc[key].add(remote_port)
            endpoints_by_proc[key].append(f"{remote_ip}:{remote_port}")
            conns_by_proc[key].append(conn)

        for (pid, proc_name), ports in targets_by_proc.items():
            port_count = len(ports)
            if port_count >= med_thresh:
                severity = SeverityLevel.HIGH if port_count >= high_thresh else SeverityLevel.MEDIUM
                confidence = min(0.95, 0.70 + (port_count * 0.03))
                sample_ports = sorted(list(ports))[:12]
                sample_conn = conns_by_proc[(pid, proc_name)][0]
                target_ip = sample_conn.get("remote_ip")

                event = self._create_event(
                    title=f"Port Scanning Behavior Detected ({port_count} Unique Ports)",
                    description=(
                        f"Process '{proc_name}' (PID: {pid}) established simultaneous connections targeting "
                        f"{port_count} distinct destination ports. This pattern indicates active network port "
                        f"sweeping or vulnerability scanning."
                    ),
                    severity=severity,
                    confidence=confidence,
                    source_ip=sample_conn.get("local_ip"),
                    source_port=sample_conn.get("local_port"),
                    dest_ip=target_ip,
                    dest_port=sample_ports[0] if sample_ports else None,
                    protocol=sample_conn.get("protocol", "tcp").upper(),
                    process_name=proc_name,
                    pid=pid if pid > 0 else None,
                    evidence={
                        "unique_ports_count": port_count,
                        "probed_ports_sample": sample_ports,
                        "targets_sample": endpoints_by_proc[(pid, proc_name)][:10],
                        "process_name": proc_name,
                        "pid": pid,
                    },
                    recommendations=[
                        f"Determine whether PID {pid} ('{proc_name}') is an authorized network auditing utility.",
                        f"If unexpected, terminate PID {pid} to stop network reconnaissance.",
                        f"Review target host firewall logs for dropped probe attempts.",
                        f"Check host for presence of port scanners (Nmap, Masscan, Angry IP Scanner).",
                    ],
                )
                events.append(event)

        return events
