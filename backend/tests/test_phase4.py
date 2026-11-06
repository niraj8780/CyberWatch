"""Comprehensive test suite for Phase 4 Final capabilities: Alerts, IP Intel, AI Analyst & Reports."""

import asyncio
import pytest

from app.ai.analyst import ai_analyst
from app.alerts.manager import alert_manager
from app.intelligence.ip_intel import ip_intelligence_service
from app.reports.generator import report_generator
from app.schemas.ai import AIChatRequest, AIThreatAnalysisRequest
from app.schemas.alert import AlertCreateRequest, AlertSeverity, AlertStatus
from app.schemas.intelligence import IPType, ReputationStatus


def test_alert_manager_lifecycle() -> None:
    """Verify alert creation, querying, and triage status updates."""
    # 1. Query initial alerts
    alerts, total, new_cnt, _, _, _, _ = alert_manager.get_alerts()
    assert total >= 3
    assert new_cnt >= 1

    # 2. Create manual alert
    new_alert = alert_manager.create_alert(
        AlertCreateRequest(
            title="Unauthorized Reverse Shell",
            description="Process bash.exe connected to remote port 4444.",
            severity=AlertSeverity.HIGH,
            process_name="bash.exe",
            pid=9999,
            dest_ip="198.51.100.25",
            dest_port=4444,
        )
    )
    assert new_alert.id.startswith("alt-")
    assert new_alert.status == AlertStatus.NEW
    assert new_alert.severity == AlertSeverity.HIGH

    # 3. Update alert to ACKNOWLEDGED with note
    updated = alert_manager.update_alert(
        alert_id=new_alert.id,
        status=AlertStatus.ACKNOWLEDGED,
        assigned_to="Senior Analyst",
        note="Host isolated via firewall rule.",
    )
    assert updated is not None
    assert updated.status == AlertStatus.ACKNOWLEDGED
    assert updated.assigned_to == "Senior Analyst"
    assert len(updated.notes) >= 2

    # 4. Resolve alert
    resolved = alert_manager.update_alert(
        alert_id=new_alert.id,
        status=AlertStatus.RESOLVED,
        note="Malicious process terminated.",
    )
    assert resolved is not None
    assert resolved.status == AlertStatus.RESOLVED


def test_ip_intelligence_classification() -> None:
    """Verify IP classification, geolocation, and threat reputation scoring."""
    # Loopback
    loopback = ip_intelligence_service.analyze_ip("127.0.0.1")
    assert loopback.ip_type == IPType.LOOPBACK
    assert loopback.is_private is True
    assert loopback.threat_score == 0

    # RFC 1918 Private
    private_ip = ip_intelligence_service.analyze_ip("192.168.1.105")
    assert private_ip.ip_type == IPType.PRIVATE
    assert private_ip.is_private is True
    assert private_ip.country_code == "PRI"

    # Known Malicious C2
    c2_ip = ip_intelligence_service.analyze_ip("198.51.100.25")
    assert c2_ip.reputation == ReputationStatus.MALICIOUS
    assert c2_ip.threat_score >= 80

    # Known Public DNS
    dns_ip = ip_intelligence_service.analyze_ip("1.1.1.1")
    assert dns_ip.reputation == ReputationStatus.CLEAN
    assert dns_ip.country_code == "US"
    assert dns_ip.asn == "AS13335"


def test_ai_analyst_threat_investigation() -> None:
    """Verify AI analyst produces MITRE ATT&CK mapping and containment commands."""
    req = AIThreatAnalysisRequest(
        title="Suspicious Outbound Socket from notepad.exe",
        description="LOLBin notepad.exe connecting to remote host 198.51.100.25:8080.",
        process_name="notepad.exe",
        pid=1234,
        dest_ip="198.51.100.25",
        dest_port=8080,
    )
    res = ai_analyst.analyze_threat(req)
    assert res.analysis_id.startswith("ai-diag-")
    assert len(res.mitre_techniques) >= 1
    assert any("LOLBin" in t.name or "Injection" in t.name for t in res.mitre_techniques)
    assert len(res.containment_checklist) >= 2
    assert len(res.suggested_commands) >= 1


def test_ai_analyst_chat_assistance() -> None:
    """Verify AI analyst chat responds to cybersecurity inquiries."""
    chat_req = AIChatRequest(message="Why is port 4444 dangerous?")
    chat_res = ai_analyst.chat(chat_req)
    assert "4444" in chat_res.reply
    assert "Metasploit" in chat_res.reply
    assert len(chat_res.suggested_followups) >= 1


def test_executive_reports_generation() -> None:
    """Verify executive report compilation and CSV audit generation."""
    # Test CSV export
    csv_text = asyncio.run(report_generator.generate_csv())
    assert "Incident_ID" in csv_text
    assert "Severity" in csv_text
    assert "Process_Name" in csv_text

    # Test Executive Report document
    report = asyncio.run(report_generator.generate_executive_report())
    assert report.report_id.startswith("rep-exec-")
    assert report.overall_posture_score >= 0
    assert len(report.compliance_evaluations) >= 4
    assert any("NIST" in c.framework for c in report.compliance_evaluations)
    assert len(report.strategic_recommendations) >= 2
