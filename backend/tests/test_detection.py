"""Comprehensive test suite for Phase 3 Threat Detection Engine and rules."""

import asyncio
import httpx
import pytest

from app.detection.rule_engine import RuleEngine
from app.detection.rules.connection_burst import ConnectionBurstRule
from app.detection.rules.port_scanning import PortScanRule
from app.detection.rules.repeated_attempts import RepeatedAttemptsRule
from app.detection.rules.suspicious_processes import SuspiciousProcessRule
from app.detection.rules.unexpected_listeners import UnexpectedListenersRule
from app.detection.rules.unusual_ports import UnusualPortsRule
from app.main import app
from app.schemas.security import SeverityLevel


@pytest.fixture
def clean_engine() -> RuleEngine:
    """Provide a fresh RuleEngine instance isolated from global singleton state."""
    engine = RuleEngine(max_events=100, dedup_cooldown_seconds=1.0)
    return engine


def test_unusual_ports_rule_detects_malicious_ports() -> None:
    """Verify that connections targeting dangerous ports trigger high-severity events."""
    rule = UnusualPortsRule()
    test_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 50123,
            "remote_ip": "198.51.100.25",
            "remote_port": 4444,  # Metasploit default
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "malicious_script.exe",
            "pid": 4321,
        },
        {
            "local_ip": "192.168.1.100",
            "local_port": 50124,
            "remote_ip": "142.250.190.46",
            "remote_port": 443,  # Standard HTTPS, should NOT trigger
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "chrome.exe",
            "pid": 1122,
        },
    ]

    events = rule.evaluate(test_conns)
    assert len(events) == 1
    evt = events[0]
    assert evt.rule_id == "RULE-NET-001"
    assert evt.dest_port == 4444
    assert evt.severity == SeverityLevel.HIGH
    assert "Metasploit" in evt.title or "4444" in evt.title
    assert len(evt.recommendations) > 0


def test_suspicious_processes_rule_flags_lolbins() -> None:
    """Verify that system utilities like notepad.exe making external sockets get flagged."""
    rule = SuspiciousProcessRule()
    test_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 51000,
            "remote_ip": "203.0.113.88",
            "remote_port": 8080,
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "notepad.exe",  # Anomalous network binary
            "pid": 9876,
        },
        {
            "local_ip": "192.168.1.100",
            "local_port": 51001,
            "remote_ip": "1.1.1.1",
            "remote_port": 53,
            "protocol": "udp",
            "status": "NONE",
            "process_name": "chrome.exe",  # Legitimate network app
            "pid": 5432,
        },
    ]

    events = rule.evaluate(test_conns)
    assert len(events) == 1
    evt = events[0]
    assert evt.rule_id == "RULE-PROC-001"
    assert evt.process_name == "notepad.exe"
    assert evt.severity == SeverityLevel.HIGH
    assert "notepad.exe" in evt.title


def test_port_scanning_rule_detects_reconnaissance() -> None:
    """Verify that a single process probing multiple destination ports triggers scan detection."""
    rule = PortScanRule()
    # Create 6 connections to different ports from same process
    test_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 40000 + i,
            "remote_ip": "10.0.0.50",
            "remote_port": port,
            "protocol": "tcp",
            "status": "SYN_SENT",
            "process_name": "scanner_tool.exe",
            "pid": 6789,
        }
        for i, port in enumerate([21, 22, 23, 80, 443, 8080])
    ]

    events = rule.evaluate(test_conns)
    assert len(events) == 1
    evt = events[0]
    assert evt.rule_id == "RULE-SCAN-001"
    assert evt.evidence["unique_ports_count"] == 6


def test_connection_burst_rule() -> None:
    """Verify that an abnormal spike in outbound connections triggers a burst alert."""
    rule = ConnectionBurstRule()
    # Create 20 connections from an unknown/non-browser process
    test_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 41000 + i,
            "remote_ip": f"198.51.100.{i + 1}",
            "remote_port": 80,
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "exfiltrator.exe",
            "pid": 7777,
        }
        for i in range(20)
    ]

    events = rule.evaluate(test_conns)
    assert len(events) == 1
    evt = events[0]
    assert evt.rule_id == "RULE-BURST-001"
    assert evt.evidence["total_concurrent_connections"] == 20


def test_unexpected_listeners_rule() -> None:
    """Verify that high-risk listening sockets bound on wildcard interfaces are caught."""
    rule = UnexpectedListenersRule()
    test_conns = [
        {
            "local_ip": "0.0.0.0",
            "local_port": 4444,
            "remote_ip": None,
            "remote_port": None,
            "protocol": "tcp",
            "status": "LISTEN",
            "process_name": "nc.exe",
            "pid": 1337,
        }
    ]

    events = rule.evaluate(test_conns)
    assert len(events) == 1
    assert events[0].rule_id == "RULE-LISTEN-001"
    assert events[0].source_port == 4444


def test_repeated_attempts_rule() -> None:
    """Verify that repeated stuck SYN_SENT connection attempts are detected."""
    rule = RepeatedAttemptsRule()
    test_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 50000 + i,
            "remote_ip": "203.0.113.99",
            "remote_port": 4444,
            "protocol": "tcp",
            "status": "SYN_SENT",
            "process_name": "beacon_agent.exe",
            "pid": 8888,
        }
        for i in range(4)
    ]

    events = rule.evaluate(test_conns)
    assert len(events) >= 1
    assert events[0].rule_id == "RULE-CONN-001"


def test_rule_engine_scan_and_deduplication(clean_engine: RuleEngine) -> None:
    """Verify engine runs all rules and deduplicates identical events within cooldown."""
    synthetic_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 50123,
            "remote_ip": "198.51.100.25",
            "remote_port": 4444,
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "powershell_payload.exe",
            "pid": 4321,
        }
    ]

    # First scan should detect the event
    first_run = asyncio.run(clean_engine.run_scan(synthetic_conns))
    assert len(first_run) >= 1

    # Immediate second scan with identical connection should be deduplicated
    second_run = asyncio.run(clean_engine.run_scan(synthetic_conns))
    assert len(second_run) == 0

    # Query events
    events, total, high_cnt, _, _ = asyncio.run(clean_engine.get_events())
    assert total >= 1
    assert high_cnt >= 1


def test_rule_engine_toggle_rule(clean_engine: RuleEngine) -> None:
    """Verify that disabling a rule halts its evaluation."""
    rule_id = "RULE-NET-001"
    updated = clean_engine.toggle_rule(rule_id, enabled=False)
    assert updated is not None
    assert updated.enabled is False

    synthetic_conns = [
        {
            "local_ip": "192.168.1.100",
            "local_port": 50123,
            "remote_ip": "198.51.100.25",
            "remote_port": 4444,
            "protocol": "tcp",
            "status": "ESTABLISHED",
            "process_name": "bad.exe",
            "pid": 4321,
        }
    ]

    # Should not trigger RULE-NET-001 because it is disabled
    events = asyncio.run(clean_engine.run_scan(synthetic_conns))
    net_events = [e for e in events if e.rule_id == rule_id]
    assert len(net_events) == 0


@pytest.mark.asyncio
async def test_security_api_endpoints(app_client: httpx.AsyncClient) -> None:
    """Test full security REST API endpoints using async app_client."""
    # 1. Get rules
    rules_resp = await app_client.get("/api/v1/security/rules")
    assert rules_resp.status_code == 200
    rules = rules_resp.json()
    assert len(rules) >= 6

    # 2. Get security summary
    summary_resp = await app_client.get("/api/v1/security/summary")
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert "threat_level" in summary
    assert "active_rules_count" in summary

    # 3. List events
    events_resp = await app_client.get("/api/v1/security/events")
    assert events_resp.status_code == 200
    events_data = events_resp.json()
    assert "items" in events_data
    assert "high_count" in events_data

    # 4. Trigger manual scan
    scan_resp = await app_client.post("/api/v1/security/scan")
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert "scanned_connections_count" in scan_data
    assert "scan_duration_ms" in scan_data

    # 5. Toggle a rule
    rule_to_toggle = rules[0]["id"]
    toggle_resp = await app_client.patch(
        f"/api/v1/security/rules/{rule_to_toggle}",
        json={"enabled": False},
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["enabled"] is False

    # Restore rule
    await app_client.patch(
        f"/api/v1/security/rules/{rule_to_toggle}",
        json={"enabled": True},
    )
