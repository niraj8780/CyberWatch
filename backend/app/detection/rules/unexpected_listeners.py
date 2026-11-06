"""Detection rule for identifying unexpected or risky listening services."""

from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel

DANGEROUS_LISTENER_PORTS: dict[int, tuple[str, SeverityLevel, float]] = {
    4444: ("Metasploit Reverse Handler / Backdoor Listener", SeverityLevel.HIGH, 0.95),
    1337: ("Elite / Unregistered Backdoor Listener", SeverityLevel.HIGH, 0.90),
    31337: ("Back Orifice Listener", SeverityLevel.HIGH, 0.95),
    12345: ("NetBus Trojan Ingress Socket", SeverityLevel.HIGH, 0.95),
    23: ("Insecure Telnet Daemon Exposed", SeverityLevel.HIGH, 0.85),
    5555: ("Exposed ADB Port Listening Inbound", SeverityLevel.MEDIUM, 0.80),
    6667: ("IRC Botnet Control Listener", SeverityLevel.HIGH, 0.85),
    8888: ("Unauthenticated Proxy / Debug Listener", SeverityLevel.MEDIUM, 0.75),
}

# Standard local dev ports that are normal to listen on during development
COMMON_DEV_PORTS = {8000, 5173, 3000, 5000, 8080}


class UnexpectedListenersRule(BaseDetectionRule):
    """Flags unexpected or risky network services listening on open or wildcard interfaces."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-LISTEN-001",
            name="Unexpected Listening Service / Ingress Exposure",
            description="Detects processes binding listening sockets to wildcard interfaces (0.0.0.0 or ::) on dangerous or sensitive unencrypted ports.",
            category=DetectionType.UNEXPECTED_LISTENER,
            default_severity=SeverityLevel.HIGH,
            enabled=True,
            config={
                "flag_dangerous_ports": True,
                "flag_wildcard_high_ports": False,
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

        for conn in connections:
            status = (conn.get("status") or "").upper()
            if status != "LISTEN":
                continue

            local_ip = conn.get("local_ip") or "*"
            local_port = conn.get("local_port")
            pid = conn.get("pid")
            proc_name = conn.get("process_name") or "Unknown"

            if not local_port:
                continue

            # Check if port is in high-risk listener ports
            if local_port in DANGEROUS_LISTENER_PORTS:
                desc, severity, confidence = DANGEROUS_LISTENER_PORTS[local_port]
                protocol = conn.get("protocol", "tcp").upper()

                event = self._create_event(
                    title=f"Risky Listening Service on Port {local_port} ({proc_name})",
                    description=(
                        f"Process '{proc_name}' (PID: {pid}) opened a {protocol} listening socket on "
                        f"{local_ip}:{local_port}. Port {local_port} is known for {desc}."
                    ),
                    severity=severity,
                    confidence=confidence,
                    source_ip=local_ip,
                    source_port=local_port,
                    protocol=protocol,
                    process_name=proc_name,
                    pid=pid,
                    evidence={
                        "listening_port": local_port,
                        "bind_address": local_ip,
                        "risk_profile": desc,
                        "process_name": proc_name,
                        "pid": pid,
                    },
                    recommendations=[
                        f"Verify if process '{proc_name}' (PID: {pid}) was legitimately deployed.",
                        f"If service does not require external access, bind to 127.0.0.1 instead of {local_ip}.",
                        f"Ensure host firewall denies ingress access to port {local_port}.",
                        f"Terminate process '{proc_name}' immediately if unrecognized.",
                    ],
                )
                events.append(event)

        return events
