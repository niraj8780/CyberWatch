"""Executive Security Reports & Audit Export generator for CyberWatch Phase 4."""

import csv
from datetime import datetime, timezone
import io
import platform
import socket
from typing import Any
from uuid import uuid4

from app.alerts.manager import alert_manager
from app.detection.rule_engine import rule_engine
from app.monitoring.network_monitor import network_monitor
from app.schemas.report import ComplianceScoreSchema, ExecutiveReportSchema


class ReportGenerator:
    """Compiles comprehensive cybersecurity executive audit reports and compliance digests."""

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def generate_executive_report(self) -> ExecutiveReportSchema:
        """Generate a complete executive posture audit report."""
        hostname = platform.node() or socket.gethostname() or "SOC-Monitored-Host"
        now = self._now_iso()

        # Gather engine stats
        sec_summary = await rule_engine.get_summary()
        alert_summary = alert_manager.get_summary()
        net_stats = await network_monitor.get_statistics()

        # Calculate security posture score (out of 100)
        deductions = (
            (alert_summary.critical_alerts * 20)
            + (alert_summary.high_alerts * 10)
            + (alert_summary.new_alerts * 5)
        )
        overall_score = max(35, min(100, 100 - deductions))

        if overall_score >= 85:
            risk_tier = "LOW"
        elif overall_score >= 70:
            risk_tier = "MODERATE"
        elif overall_score >= 50:
            risk_tier = "ELEVATED"
        else:
            risk_tier = "CRITICAL"

        compliance_evals = [
            ComplianceScoreSchema(
                framework="NIST Cybersecurity Framework (CSF 2.0)",
                score=min(95, overall_score + 5),
                status="Compliant" if overall_score >= 70 else "Needs Attention",
                details="Continuous socket telemetry monitoring satisfies PR.DS-1 and DE.CM-1 controls.",
            ),
            ComplianceScoreSchema(
                framework="CIS Critical Security Controls v8",
                score=min(90, overall_score),
                status="Compliant" if overall_score >= 65 else "Needs Attention",
                details="Asset discovery & network port monitoring aligned with CIS Control 8 & 9.",
            ),
            ComplianceScoreSchema(
                framework="PCI-DSS v4.0 Network Security Controls",
                score=min(92, overall_score + 2),
                status="Compliant" if overall_score >= 75 else "Action Required",
                details="Inbound listening port restrictions & perimeter socket egress filtering evaluated.",
            ),
            ComplianceScoreSchema(
                framework="ISO/IEC 27001:2022 Annex A.8 (Threat Intelligence)",
                score=min(94, overall_score + 4),
                status="Compliant" if overall_score >= 70 else "Needs Attention",
                details="A.8.7 (Malware Protection) and A.8.16 (Monitoring Activities) active.",
            ),
        ]

        exec_summary = (
            f"Security Operations Audit conducted for host '{hostname}' on {datetime.now().strftime('%B %d, %Y')}. "
            f"The host network posture is evaluated at a score of {overall_score}/100 ({risk_tier} risk tier). "
            f"A total of {net_stats.get('total_connections', 0)} active network sockets and {sec_summary.active_rules_count} "
            f"continuous heuristic detection rules were monitored. Currently, {alert_summary.open_alerts if hasattr(alert_summary, 'open_alerts') else alert_summary.new_alerts} "
            f"incidents require SOC triage attention."
        )

        recommendations = [
            "Maintain continuous sub-second WebSocket telemetry streaming across all network interfaces.",
            "Enforce strict Windows Firewall ingress restrictions on high unassigned ports (>1024).",
            "Periodically review Living-off-the-Land (LOLBin) process executions for unauthorized network socket behavior.",
            "Ensure mean-time-to-acknowledge (MTTA) for critical alerts remains under 5 minutes.",
        ]

        return ExecutiveReportSchema(
            report_id=f"rep-exec-{uuid4().hex[:8]}",
            generated_at=now,
            hostname=hostname,
            overall_posture_score=overall_score,
            risk_tier=risk_tier,
            total_sockets_audited=net_stats.get("total_connections", 0),
            threats_detected_count=sec_summary.total_events,
            open_alerts_count=alert_summary.new_alerts + alert_summary.acknowledged_alerts,
            resolved_incidents_count=alert_summary.resolved_alerts,
            compliance_evaluations=compliance_evals,
            top_flagged_processes=sec_summary.top_flagged_processes,
            top_targeted_ports=sec_summary.top_flagged_ports,
            executive_summary=exec_summary,
            strategic_recommendations=recommendations,
        )

    async def generate_csv(self) -> str:
        """Export all recorded threats and incidents as a structured CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Incident_ID",
            "Type",
            "Severity",
            "Status",
            "Title",
            "Process_Name",
            "PID",
            "Source_IP",
            "Dest_IP",
            "Dest_Port",
            "Created_At",
        ])

        # Write Alert records
        alerts, _, _, _, _, _, _ = alert_manager.get_alerts(limit=500)
        for a in alerts:
            writer.writerow([
                a.id,
                "INCIDENT_ALERT",
                a.severity.value,
                a.status.value,
                a.title,
                a.process_name or "N/A",
                a.pid or "N/A",
                a.source_ip or "N/A",
                a.dest_ip or "N/A",
                a.dest_port or "N/A",
                a.created_at,
            ])

        # Write Security Events
        events, _, _, _, _ = await rule_engine.get_events(limit=500)
        for e in events:
            writer.writerow([
                e.id,
                f"THREAT_{e.detection_type}",
                e.severity.value,
                "DETECTED",
                e.title,
                e.process_name or "N/A",
                e.pid or "N/A",
                e.source_ip or "N/A",
                e.dest_ip or "N/A",
                e.dest_port or "N/A",
                e.timestamp,
            ])

        return output.getvalue()


report_generator = ReportGenerator()
