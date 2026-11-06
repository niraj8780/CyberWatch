"""Detection rule for identifying connections to unusual or dangerous network ports."""

from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel


# Map of commonly abused or signature malicious ports with description and risk rating
SUSPICIOUS_PORTS: dict[int, tuple[str, SeverityLevel, float]] = {
    4444: ("Metasploit Default C2 / Reverse Shell Listener", SeverityLevel.HIGH, 0.95),
    1337: ("Hacker / Backdoor Elite Port", SeverityLevel.HIGH, 0.90),
    31337: ("Back Orifice Remote Administration Trojan", SeverityLevel.HIGH, 0.95),
    12345: ("NetBus Trojan Remote Access Port", SeverityLevel.HIGH, 0.90),
    6667: ("IRC Channel (frequently abused for Botnet C2)", SeverityLevel.HIGH, 0.85),
    6666: ("IRC / PoisonIvy Alternate Trojan Port", SeverityLevel.MEDIUM, 0.80),
    5555: ("Exposed ADB / Android Debug Bridge Port", SeverityLevel.MEDIUM, 0.75),
    4445: ("Malware Secondary Shell Port", SeverityLevel.HIGH, 0.85),
    23: ("Telnet Insecure Plaintext Remote Shell", SeverityLevel.MEDIUM, 0.80),
    21: ("FTP Plaintext Authentication Outbound", SeverityLevel.LOW, 0.65),
    9999: ("Urgent Shell / Custom Backdoor Listener", SeverityLevel.MEDIUM, 0.75),
}


class UnusualPortsRule(BaseDetectionRule):
    """Flags network connections directed towards known dangerous, trojan, or anomalous ports."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-NET-001",
            name="Unusual / Dangerous Destination Port",
            description="Detects active connections targeting known malware command-and-control, trojan, or risky unencrypted ports.",
            category=DetectionType.UNUSUAL_PORT,
            default_severity=SeverityLevel.HIGH,
            enabled=True,
            config={
                "monitored_ports": list(SUSPICIOUS_PORTS.keys()),
                "ignore_loopback": True,
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
        ignore_loopback = self.config.get("ignore_loopback", True)

        for conn in connections:
            remote_ip = conn.get("remote_ip")
            remote_port = conn.get("remote_port")

            if not remote_ip or not remote_port:
                continue

            # Ignore loopback traffic if configured
            if ignore_loopback and remote_ip in ("127.0.0.1", "::1", "localhost"):
                continue

            # Check if remote port matches known suspicious list
            if remote_port in SUSPICIOUS_PORTS:
                desc, severity, confidence = SUSPICIOUS_PORTS[remote_port]
                proc_name = conn.get("process_name") or "Unknown"
                pid = conn.get("pid")
                local_ip = conn.get("local_ip")
                local_port = conn.get("local_port")
                protocol = conn.get("protocol", "tcp").upper()

                event = self._create_event(
                    title=f"Connection to Risky Port {remote_port} ({desc.split('(')[0].strip()})",
                    description=(
                        f"Process '{proc_name}' (PID: {pid}) established an outbound {protocol} "
                        f"connection to {remote_ip}:{remote_port}. Port {remote_port} is associated "
                        f"with {desc}."
                    ),
                    severity=severity,
                    confidence=confidence,
                    source_ip=local_ip,
                    source_port=local_port,
                    dest_ip=remote_ip,
                    dest_port=remote_port,
                    protocol=protocol,
                    process_name=proc_name,
                    pid=pid,
                    evidence={
                        "target_port": remote_port,
                        "threat_signature": desc,
                        "connection_status": conn.get("status"),
                        "remote_ip": remote_ip,
                        "process_name": proc_name,
                        "pid": pid,
                    },
                    recommendations=[
                        f"Inspect process '{proc_name}' (PID: {pid}) executable location and digital signature.",
                        f"Verify if remote host {remote_ip} is an approved external destination.",
                        f"If unauthorized, terminate PID {pid} and capture memory artifacts for analysis.",
                        f"Block outbound traffic to port {remote_port} at perimeter firewall.",
                    ],
                )
                events.append(event)

        return events
