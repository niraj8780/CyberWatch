"""AI Security Analyst engine for intelligent incident investigation and triage assistance."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import structlog

from app.schemas.ai import (
    AIChatMessage,
    AIChatRequest,
    AIChatResponse,
    AIThreatAnalysisRequest,
    AIThreatAnalysisResponse,
    MitreTacticSchema,
)

logger = structlog.get_logger(__name__)


class AISecurityAnalyst:
    """Automated security analyst performing MITRE ATT&CK mapping, root cause analysis, and interactive triage."""

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def analyze_threat(self, req: AIThreatAnalysisRequest) -> AIThreatAnalysisResponse:
        """Produce an automated expert SOC investigation report for a threat incident."""
        title_lower = req.title.lower()
        proc_lower = (req.process_name or "").lower()
        port = req.dest_port or 0
        now = self._now_iso()

        mitre_list: list[MitreTacticSchema] = []
        root_cause = ""
        impact = ""
        attribution = ""
        containment: list[str] = []
        commands: list[str] = []

        if "port scan" in title_lower or "reconnaissance" in title_lower:
            mitre_list = [
                MitreTacticSchema(id="T1046", name="Network Service Discovery", tactic="Discovery"),
                MitreTacticSchema(id="T1595", name="Active Scanning", tactic="Reconnaissance"),
            ]
            root_cause = (
                f"The process '{req.process_name or 'scanner'}' initiated rapid sequential TCP SYN probes "
                f"targeting multiple distinct ports. This activity matches automated port sweeping tools (e.g., Nmap, Masscan)."
            )
            impact = "Adversary or automated script mapping listening internal services to locate exploitable vulnerabilities."
            attribution = "Automated Scanning Script / Network Auditor / Ingress Reconnaissance"
            containment = [
                f"Verify if PID {req.pid or 'N/A'} was run by an authorized systems engineer.",
                "Inspect host process lineage to find the parent executing shell.",
                "Apply rate-limiting on target subnet switches or perimeter ACLs.",
            ]
            commands = [
                f"Get-Process -Id {req.pid or 1} | Select-Object Name, Path, CommandLine",
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"New-NetFirewallRule -DisplayName 'Block Recon Source' -Direction Inbound -Action Block -RemoteAddress {req.source_ip or '192.168.1.1'}",
            ]

        elif any(lol in proc_lower for lol in ["notepad", "calc", "mspaint", "vssadmin", "certutil"]):
            mitre_list = [
                MitreTacticSchema(id="T1218", name="System Binary Proxy Execution (LOLBin)", tactic="Defense Evasion"),
                MitreTacticSchema(id="T1055", name="Process Injection", tactic="Privilege Escalation"),
                MitreTacticSchema(id="T1071.001", name="Web Protocols C2", tactic="Command and Control"),
            ]
            root_cause = (
                f"The native Windows utility '{req.process_name}' has established an external socket to {req.dest_ip}:{port}. "
                f"Since '{req.process_name}' possesses no legitimate networking logic, this indicates DLL search-order hijacking, "
                f"process hollowing, or reflective injection used to bypass host endpoint protection."
            )
            impact = "Active Command-and-Control (C2) channel established; potential reverse shell or payload download."
            attribution = "Living-off-the-Land (LotL) Intrusion Vector / Post-Exploitation Agent"
            containment = [
                f"Immediately kill PID {req.pid or 'N/A'} to terminate the C2 socket.",
                f"Perform memory dump of '{req.process_name}' prior to host restart.",
                f"Block outbound destination {req.dest_ip}:{port} on the network firewall.",
                "Inspect parent PID and scheduled tasks for persistence mechanisms.",
            ]
            commands = [
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"Get-CimInstance Win32_Process -Filter \"ProcessId = '{req.pid or 1}'\" | Select-Object ParentProcessId, CommandLine",
                f"New-NetFirewallRule -DisplayName 'Block Malicious C2' -Direction Outbound -Action Block -RemoteAddress {req.dest_ip or '198.51.100.25'}",
            ]

        elif port in (4444, 1337, 31337, 12345, 6667):
            mitre_list = [
                MitreTacticSchema(id="T1571", name="Non-Standard Port", tactic="Command and Control"),
                MitreTacticSchema(id="T1059", name="Command and Scripting Interpreter", tactic="Execution"),
            ]
            root_cause = (
                f"Socket opened targeting port {port}, a well-known signature port for Metasploit, Back Orifice, "
                f"or Trojan remote access. Adversaries frequently utilize this port during initial staging."
            )
            impact = "Unauthorized remote administrative access or interactive shell prompt available to an external actor."
            attribution = "Metasploit Framework / Script Kiddie / Penetration Test Artifact"
            containment = [
                f"Disconnect host from local subnet or enable host isolation.",
                f"Terminate process '{req.process_name}' (PID: {req.pid or 'N/A'}).",
                f"Examine user login history around timestamp.",
            ]
            commands = [
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"Get-NetTCPConnection -RemotePort {port} | Format-Table -AutoSize",
                f"netstat -ano | findstr {port}",
            ]

        else:
            mitre_list = [
                MitreTacticSchema(id="T1071", name="Application Layer Protocol", tactic="Command and Control"),
                MitreTacticSchema(id="T1049", name="System Network Connections Discovery", tactic="Discovery"),
            ]
            root_cause = (
                f"Anomalous network connection observed from '{req.process_name or 'Unknown'}'. "
                f"Targeting {req.dest_ip or 'Remote Host'}:{port} outside normal baseline operational bounds."
            )
            impact = "Potential exfiltration, unauthorized API communication, or background beaconing."
            attribution = "Unclassified Suspicious Network Socket"
            containment = [
                f"Audit digital signature and executable hash of '{req.process_name}'.",
                "Verify whether destination IP is an approved corporate cloud resource.",
            ]
            commands = [
                f"Get-AuthenticodeSignature (Get-Process -Id {req.pid or 1}).Path",
                f"Test-NetConnection -ComputerName {req.dest_ip or '127.0.0.1'} -Port {port or 80}",
            ]

        return AIThreatAnalysisResponse(
            analysis_id=f"ai-diag-{uuid4().hex[:8]}",
            incident_summary=f"Automated AI investigation for: {req.title}",
            mitre_techniques=mitre_list,
            severity_assessment="CRITICAL - Requires active containment" if port in (4444, 31337) or "notepad" in proc_lower else "ELEVATED - Active investigation recommended",
            root_cause_analysis=root_cause,
            potential_impact=impact,
            threat_actor_attribution=attribution,
            containment_checklist=containment,
            suggested_commands=commands,
            generated_at=now,
        )

    def chat(self, req: AIChatRequest) -> AIChatResponse:
        """Handle interactive user cybersecurity questions with context-aware responses."""
        q = req.message.lower().strip()
        now = self._now_iso()

        if "port 4444" in q or "4444" in q:
            reply = (
                "**Port 4444 Analysis:**\n\n"
                "Port 4444 is famous in cybersecurity as the **default listening port for Metasploit's Meterpreter** "
                "reverse shell payload. When an exploit succeeds on a victim host, it connects back to port 4444 on the attacker machine.\n\n"
                "**Actionable Steps:**\n"
                "1. Check which process holds the socket: `netstat -ano | findstr 4444`\n"
                "2. Find PID and kill immediately: `Stop-Process -Id <PID> -Force`\n"
                "3. Search for dropped payloads in `%TEMP%` or `%APPDATA%`."
            )
            followups = [
                "What other dangerous ports should I monitor?",
                "How do I block port 4444 in Windows Firewall?",
                "What is a reverse shell?",
            ]

        elif "notepad" in q or "calc" in q or "lolbin" in q:
            reply = (
                "**Living-off-the-Land (LOLBin) Threat Explanation:**\n\n"
                "System binaries like `notepad.exe` and `calc.exe` are completely offline desktop tools. "
                "They have **zero legitimate code for networking**.\n\n"
                "When you see them opening TCP or UDP connections, it means an attacker has used **Process Injection** "
                "(such as Reflective DLL Injection or Process Hollowing). They inject malicious shellcode into a trusted Windows process "
                "so that standard antivirus thinks the traffic is safe.\n\n"
                "**Recommendation:** Suspend the process immediately and dump its memory space for string analysis."
            )
            followups = [
                "How does process hollowing work?",
                "How can I see the parent process (PPID) in PowerShell?",
                "What is the difference between LOLBins and malware?",
            ]

        elif "port scan" in q or "scanning" in q:
            reply = (
                "**Port Scanning Reconnaissance:**\n\n"
                "Port scanning is the preparatory reconnaissance phase of a cyberattack. An attacker sweeps a target's IP "
                "across hundreds of ports (e.g. 21, 22, 80, 443, 3389, 8080) to discover open services and software versions.\n\n"
                "**Defense Strategy:**\n"
                "- Ensure firewall drops unsolicited SYN packets rather than rejecting them (stealth mode).\n"
                "- Restrict remote administration (SSH/RDP) to private VPNs.\n"
                "- Implement automated IP banning for hosts hitting >10 closed ports in 10 seconds."
            )
            followups = [
                "What is SYN scanning vs full connect scanning?",
                "How does CyberWatch detect port scans?",
                "How can I harden my firewall?",
            ]

        elif "soc" in q or "triage" in q or "incident" in q:
            reply = (
                "**Standard SOC Incident Triage Workflow:**\n\n"
                "1. **Triage & Classification:** Validate whether the alert is a true positive or false alarm (check process path & hash).\n"
                "2. **Containment:** Sever network connection or isolate endpoint (`New-NetFirewallRule` / host isolation).\n"
                "3. **Eradication:** Terminate unauthorized PIDs, remove persistence scheduled tasks, and delete dropped artifacts.\n"
                "4. **Recovery:** Restore affected services and confirm clean telemetry.\n"
                "5. **Lessons Learned:** Update detection rules and document incident in executive audit report."
            )
            followups = [
                "How do I export this incident report?",
                "What are MITRE ATT&CK tactics?",
                "How do I mark an alert as resolved in CyberWatch?",
            ]

        else:
            reply = (
                f"**CyberWatch AI Analyst Intelligence Briefing:**\n\n"
                f"I analyzed your inquiry: *\"{req.message}\"*.\n\n"
                "In SOC operations, network telemetry and process lineage provide the highest-fidelity indicators of compromise. "
                "To investigate any suspicious activity on this host:\n\n"
                "- Navigate to **Threat Detection** to view heuristic rule matches.\n"
                "- Check **Alerts** to assign and resolve high-priority incident tickets.\n"
                "- Use the **Reports** tab to compile executive posture digests for compliance audits."
            )
            followups = [
                "Why is port 4444 dangerous?",
                "Why would notepad.exe connect to the internet?",
                "Explain the SOC triage process.",
            ]

        return AIChatResponse(
            reply=reply,
            suggested_followups=followups,
            timestamp=now,
        )


ai_analyst = AISecurityAnalyst()
