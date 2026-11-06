"""Detection rule for identifying suspicious processes establishing external network connections."""

import re
from typing import Any

from app.detection.rules.base import BaseDetectionRule
from app.schemas.security import DetectionType, SecurityEventSchema, SeverityLevel

# System binaries that rarely or never should establish outbound internet sockets
ANOMALOUS_NETWORK_BINARIES: dict[str, tuple[SeverityLevel, float, str]] = {
    "notepad.exe": (
        SeverityLevel.HIGH,
        0.95,
        "Text editor binary (notepad.exe) should never initiate external network connections; potential process injection or hollowed binary.",
    ),
    "calc.exe": (
        SeverityLevel.HIGH,
        0.95,
        "Calculator utility (calc.exe) has no legitimate networking capability; potential shellcode execution or DLL hijacking.",
    ),
    "mspaint.exe": (
        SeverityLevel.HIGH,
        0.90,
        "Paint graphic utility establishing external socket; indicator of payload injection.",
    ),
    "vssadmin.exe": (
        SeverityLevel.HIGH,
        0.95,
        "Shadow copy administration utility attempting network connection; common precursor to ransomware data exfiltration or deletion.",
    ),
    "certutil.exe": (
        SeverityLevel.MEDIUM,
        0.80,
        "Certificate utility (certutil) connecting out; frequently abused by adversaries for ingress file transfer and staging malware payloads.",
    ),
    "regsvr32.exe": (
        SeverityLevel.HIGH,
        0.85,
        "DLL registration tool making network calls; known Squiblydoo technique for executing remote scripts.",
    ),
    "mshta.exe": (
        SeverityLevel.HIGH,
        0.90,
        "HTML Application host (mshta.exe) connecting outbound; high-risk Living-off-the-Land execution pattern.",
    ),
    "cscript.exe": (
        SeverityLevel.MEDIUM,
        0.75,
        "Console VBScript/JScript runtime opening network socket; verify legitimate admin script usage.",
    ),
    "wscript.exe": (
        SeverityLevel.MEDIUM,
        0.75,
        "Windows GUI Scripting Host connecting out; possible malicious script execution via email attachment or payload.",
    ),
}


class SuspiciousProcessRule(BaseDetectionRule):
    """Flags external network connections made by binaries with no legitimate networking role."""

    def __init__(self) -> None:
        super().__init__(
            rule_id="RULE-PROC-001",
            name="Suspicious Process Network Activity (LOLBin)",
            description="Detects anomalous network sockets initiated by native system utilities commonly abused for living-off-the-land techniques or process injection.",
            category=DetectionType.SUSPICIOUS_PROCESS,
            default_severity=SeverityLevel.HIGH,
            enabled=True,
            config={
                "monitored_binaries": list(ANOMALOUS_NETWORK_BINARIES.keys()),
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
            proc_name = (conn.get("process_name") or "").lower()
            if not proc_name:
                continue

            # Strip extension or check exact match
            normalized_proc = proc_name if proc_name.endswith(".exe") else f"{proc_name}.exe"

            if normalized_proc in ANOMALOUS_NETWORK_BINARIES:
                remote_ip = conn.get("remote_ip")
                remote_port = conn.get("remote_port")

                # Require active destination
                if not remote_ip or not remote_port:
                    continue

                if ignore_loopback and remote_ip in ("127.0.0.1", "::1", "localhost"):
                    continue

                severity, confidence, explanation = ANOMALOUS_NETWORK_BINARIES[normalized_proc]
                pid = conn.get("pid")
                local_ip = conn.get("local_ip")
                local_port = conn.get("local_port")
                protocol = conn.get("protocol", "tcp").upper()

                event = self._create_event(
                    title=f"Suspicious Outbound Connection by {normalized_proc}",
                    description=(
                        f"Executable '{normalized_proc}' (PID: {pid}) established an outbound {protocol} "
                        f"connection to {remote_ip}:{remote_port}. {explanation}"
                    ),
                    severity=severity,
                    confidence=confidence,
                    source_ip=local_ip,
                    source_port=local_port,
                    dest_ip=remote_ip,
                    dest_port=remote_port,
                    protocol=protocol,
                    process_name=conn.get("process_name") or normalized_proc,
                    pid=pid,
                    evidence={
                        "binary_name": normalized_proc,
                        "pid": pid,
                        "remote_ip": remote_ip,
                        "remote_port": remote_port,
                        "connection_status": conn.get("status"),
                        "threat_explanation": explanation,
                    },
                    recommendations=[
                        f"Immediately isolate host or suspend process '{normalized_proc}' (PID: {pid}).",
                        f"Check parent process command line (PPID) to determine how '{normalized_proc}' was spawned.",
                        f"Verify if process memory shows signs of reflective DLL injection or hollowed code.",
                        f"Block the remote address {remote_ip} on perimeter network defenses.",
                    ],
                )
                events.append(event)

        return events
