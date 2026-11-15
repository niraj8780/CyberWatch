"""Enhanced AI Security Analyst engine with Google Gemini integration, live telemetry context, and comprehensive SOC reasoning."""

import os
import re
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import httpx
import structlog

from app.alerts.manager import alert_manager
from app.detection.rule_engine import rule_engine
from app.monitoring.network_monitor import network_monitor
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
    """Intelligent SOC analyst powered by Gemini LLM integration with an expansive local knowledge fallback."""

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def _get_live_context(self) -> dict[str, Any]:
        """Gather real-time system and security telemetry to inject into AI reasoning."""
        try:
            sec_summary = await rule_engine.get_summary()
            alert_summary = alert_manager.get_summary()
            net_stats = await network_monitor.get_statistics()
            return {
                "active_threats_count": sec_summary.total_events,
                "threat_level": sec_summary.threat_level,
                "high_severity_threats": sec_summary.high_severity_count,
                "open_alerts": alert_summary.new_alerts + alert_summary.acknowledged_alerts,
                "critical_alerts": alert_summary.critical_alerts,
                "total_active_sockets": net_stats.get("total_connections", 0),
                "top_flagged_processes": [p["process_name"] for p in sec_summary.top_flagged_processes[:3]],
                "top_targeted_ports": [p["port"] for p in sec_summary.top_flagged_ports[:3]],
            }
        except Exception as e:
            logger.debug("failed_to_gather_live_context", error=str(e))
            return {}

    async def analyze_threat(self, req: AIThreatAnalysisRequest) -> AIThreatAnalysisResponse:
        """Produce an automated expert SOC investigation report for a threat incident."""
        api_key = req.api_key or os.environ.get("GEMINI_API_KEY")

        # If Gemini API key is present, try real generative analysis
        if api_key:
            try:
                gemini_res = await self._call_gemini_analysis(req, api_key)
                if gemini_res:
                    return gemini_res
            except Exception as gemini_err:
                logger.warning("gemini_threat_analysis_failed_falling_back", error=str(gemini_err))

        return self._local_threat_analysis(req)

    def _local_threat_analysis(self, req: AIThreatAnalysisRequest) -> AIThreatAnalysisResponse:
        """High-fidelity rule-based MITRE ATT&CK forensic mapping engine."""
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
                MitreTacticSchema(id="T1595.001", name="Active Scanning: Port Scanning", tactic="Reconnaissance"),
                MitreTacticSchema(id="T1018", name="Remote System Discovery", tactic="Discovery"),
            ]
            root_cause = (
                f"The process '{req.process_name or 'scanner'}' (PID: {req.pid or 'N/A'}) initiated rapid sequential TCP SYN probes "
                f"targeting multiple distinct destination ports. This behavior strongly matches automated network reconnaissance tools "
                f"(e.g., Nmap, Masscan, Angry IP Scanner)."
            )
            impact = "Adversary or automated script mapping listening internal services to locate unpatched or exploitable daemons."
            attribution = "Automated Scanning Script / Network Penetration Tool / Ingress Reconnaissance"
            containment = [
                f"Determine whether PID {req.pid or 'N/A'} was run by an authorized systems engineer.",
                "Inspect host process lineage to find the parent executing shell (PowerShell/CMD).",
                "Apply rate-limiting on target subnet switches or perimeter ACLs.",
                f"Block the remote address {req.dest_ip or 'Target'} on edge firewalls.",
            ]
            commands = [
                f"Get-Process -Id {req.pid or 1} | Select-Object Name, Path, CommandLine",
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"New-NetFirewallRule -DisplayName 'Block Recon Source' -Direction Inbound -Action Block -RemoteAddress {req.source_ip or '192.168.1.1'}",
            ]

        elif any(lol in proc_lower for lol in ["notepad", "calc", "mspaint", "vssadmin", "certutil", "mshta", "regsvr32"]):
            mitre_list = [
                MitreTacticSchema(id="T1218", name="System Binary Proxy Execution (LOLBin)", tactic="Defense Evasion"),
                MitreTacticSchema(id="T1055", name="Process Injection", tactic="Privilege Escalation"),
                MitreTacticSchema(id="T1071.001", name="Application Layer Protocol: Web Protocols", tactic="Command and Control"),
                MitreTacticSchema(id="T1105", name="Ingress Tool Transfer", tactic="Command and Control"),
            ]
            root_cause = (
                f"The native Windows utility '{req.process_name}' has established an external socket to {req.dest_ip}:{port}. "
                f"Because '{req.process_name}' possesses no legitimate networking logic, this pattern indicates DLL search-order hijacking, "
                f"process hollowing, or reflective injection used to disguise beaconing within a trusted Microsoft binary."
            )
            impact = "Active Command-and-Control (C2) channel established; potential reverse shell or secondary payload ingress."
            attribution = "Living-off-the-Land (LotL) Intrusion Vector / Advanced Persistent Threat (APT)"
            containment = [
                f"Immediately terminate PID {req.pid or 'N/A'} to break the active C2 socket.",
                f"Perform memory dump of '{req.process_name}' prior to host restart.",
                f"Block outbound destination {req.dest_ip}:{port} on network firewalls.",
                "Inspect Parent PID (PPID) and scheduled tasks for persistence mechanisms.",
            ]
            commands = [
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"Get-CimInstance Win32_Process -Filter \"ProcessId = '{req.pid or 1}'\" | Select-Object ParentProcessId, CommandLine",
                f"New-NetFirewallRule -DisplayName 'Block Malicious C2' -Direction Outbound -Action Block -RemoteAddress {req.dest_ip or '198.51.100.25'}",
            ]

        elif port in (4444, 1337, 31337, 12345, 6667, 5555, 9999):
            mitre_list = [
                MitreTacticSchema(id="T1571", name="Non-Standard Port", tactic="Command and Control"),
                MitreTacticSchema(id="T1059", name="Command and Scripting Interpreter", tactic="Execution"),
                MitreTacticSchema(id="T1095", name="Non-Application Layer Protocol", tactic="Command and Control"),
            ]
            root_cause = (
                f"Socket connection targeting port {port}, a widely documented signature port associated with Metasploit, "
                f"Back Orifice, or remote administration trojans. Threat actors utilize this port during initial interactive access."
            )
            impact = "Unauthorized remote administrative access or interactive shell prompt available to an external actor."
            attribution = "Metasploit Framework / Script Kiddie / Reverse Shell Ingress"
            containment = [
                "Sever active connection immediately or isolate host from the network.",
                f"Kill process '{req.process_name}' (PID: {req.pid or 'N/A'}).",
                "Audit recent user logins and authentication logs.",
                "Capture memory artifacts for reverse shell process identification.",
            ]
            commands = [
                f"Stop-Process -Id {req.pid or 1} -Force",
                f"Get-NetTCPConnection -RemotePort {port} | Format-Table -AutoSize",
                f"New-NetFirewallRule -DisplayName 'Block Port {port}' -Direction Outbound -Action Block -RemotePort {port}",
            ]

        else:
            mitre_list = [
                MitreTacticSchema(id="T1071", name="Application Layer Protocol", tactic="Command and Control"),
                MitreTacticSchema(id="T1049", name="System Network Connections Discovery", tactic="Discovery"),
            ]
            root_cause = (
                f"Anomalous network connection from '{req.process_name or 'Unknown'}'. "
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
            incident_summary=f"Automated AI forensic investigation for: {req.title}",
            mitre_techniques=mitre_list,
            severity_assessment="CRITICAL - Immediate containment required" if port in (4444, 31337) or any(l in proc_lower for l in ["notepad", "calc"]) else "ELEVATED - Active investigation recommended",
            root_cause_analysis=root_cause,
            potential_impact=impact,
            threat_actor_attribution=attribution,
            containment_checklist=containment,
            suggested_commands=commands,
            provider="CyberWatch SOC Intelligence (Heuristic Engine)",
            generated_at=now,
        )

    async def _call_gemini_analysis(self, req: AIThreatAnalysisRequest, api_key: str) -> AIThreatAnalysisResponse | None:
        """Call Google Gemini API for deep threat investigation."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = (
            f"You are a Senior SOC Incident Responder analyzing a network threat.\n"
            f"Incident: {req.title}\n"
            f"Description: {req.description}\n"
            f"Process: {req.process_name} (PID: {req.pid})\n"
            f"Destination: {req.dest_ip}:{req.dest_port}\n\n"
            f"Provide a structured JSON response with keys:\n"
            f"- incident_summary (string)\n"
            f"- root_cause_analysis (string)\n"
            f"- potential_impact (string)\n"
            f"- threat_actor_attribution (string)\n"
            f"- containment_checklist (array of 3 strings)\n"
            f"- suggested_commands (array of 2 PowerShell commands)\n"
            f"Respond ONLY with valid JSON."
        )

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                import json
                cleaned = re.sub(r"```json|```", "", text).strip()
                data = json.loads(cleaned)
                return AIThreatAnalysisResponse(
                    analysis_id=f"gemini-{uuid4().hex[:8]}",
                    incident_summary=data.get("incident_summary", req.title),
                    mitre_techniques=[
                        MitreTacticSchema(id="T1071", name="Application Layer Protocol", tactic="Command and Control"),
                        MitreTacticSchema(id="T1218", name="Signed Binary Proxy Execution", tactic="Defense Evasion"),
                    ],
                    severity_assessment="HIGH - Generated via Google Gemini",
                    root_cause_analysis=data.get("root_cause_analysis", "Analyzed by Gemini."),
                    potential_impact=data.get("potential_impact", "Potential unauthorized network communication."),
                    threat_actor_attribution=data.get("threat_actor_attribution", "Threat Actor Vector"),
                    containment_checklist=data.get("containment_checklist", ["Isolate endpoint", "Kill offending PID"]),
                    suggested_commands=data.get("suggested_commands", [f"Stop-Process -Id {req.pid or 1} -Force"]),
                    provider="Google Gemini 1.5 Flash",
                    generated_at=self._now_iso(),
                )
        return None

    async def chat(self, req: AIChatRequest) -> AIChatResponse:
        """Handle conversational SOC analyst queries with live telemetry context or Gemini API."""
        api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
        live_ctx = await self._get_live_context()

        # If Gemini API Key is provided, call real Gemini model
        if api_key:
            try:
                gemini_reply = await self._call_gemini_chat(req, api_key, live_ctx)
                if gemini_reply:
                    return gemini_reply
            except Exception as e:
                logger.warning("gemini_chat_failed_falling_back_to_local", error=str(e))

        return self._local_expert_chat(req, live_ctx)

    async def _call_gemini_chat(
        self, req: AIChatRequest, api_key: str, live_ctx: dict[str, Any]
    ) -> AIChatResponse | None:
        """Query Gemini API with live telemetry injection."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

        system_instruction = (
            "You are CyberWatch AI, an elite Senior Security Operations Center (SOC) Analyst and Threat Intelligence Expert. "
            "You assist analysts in monitoring host network telemetry, analyzing suspicious sockets, and investigating incidents. "
            f"Here is current live telemetry from this host: {live_ctx}. "
            "Provide clear, professional, markdown-formatted responses with actionable technical insights and PowerShell commands when relevant."
        )

        contents: list[dict[str, Any]] = []
        for msg in req.history[-6:]:
            contents.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [{"text": msg.content}],
            })

        contents.append({
            "role": "user",
            "parts": [{"text": f"System Context: {system_instruction}\n\nAnalyst Question: {req.message}"}],
        })

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json={"contents": contents})
            if resp.status_code == 200:
                raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                return AIChatResponse(
                    reply=raw_text,
                    suggested_followups=[
                        "What are the top recommended firewall rules for this?",
                        "How can I investigate this PID further?",
                        "Generate an executive briefing on current posture.",
                    ],
                    provider="Google Gemini 1.5 Flash",
                    timestamp=self._now_iso(),
                )
        return None

    def _local_expert_chat(self, req: AIChatRequest, live_ctx: dict[str, Any]) -> AIChatResponse:
        """Comprehensive built-in cybersecurity expert reasoning engine."""
        q = req.message.lower().strip()
        now = self._now_iso()

        # 1. Active System Telemetry & Status Queries
        if any(w in q for w in ["status", "health", "system", "posture", "current threat", "active threat", "how is my pc", "analyze my", "overview", "what is happening"]):
            threat_count = live_ctx.get("active_threats_count", 0)
            open_alerts = live_ctx.get("open_alerts", 0)
            level = live_ctx.get("threat_level", "LOW")
            sockets = live_ctx.get("total_active_sockets", 0)
            flagged = ", ".join(live_ctx.get("top_flagged_processes", [])) or "None"

            reply = (
                f"### 🛡️ Host Security Telemetry Briefing\n\n"
                f"- **Overall Threat Posture:** `{level}`\n"
                f"- **Active Network Sockets Audited:** `{sockets}` active connections\n"
                f"- **Detected Security Threats:** `{threat_count}` threat events recorded\n"
                f"- **Open Incident Tickets:** `{open_alerts}` open alerts requiring triage\n"
                f"- **Top Flagged Binaries:** `{flagged}`\n\n"
                f"**Analyst Assessment:** "
                + (
                    "Your system is currently in an elevated risk tier. Immediate investigation of open incidents in the **Alerts** tab is strongly recommended."
                    if threat_count > 0
                    else "All active sockets match baseline safe behavior. Continuous heuristic monitoring remains active across all interfaces."
                )
            )
            followups = [
                "What are the highest severity alerts right now?",
                "Which ports have the most traffic?",
                "How do I harden my Windows network firewall?",
            ]

        # 2. Port Specific Inquiries
        elif "port 4444" in q or "4444" in q:
            reply = (
                "### 🚨 Port 4444: Metasploit Default C2 Listener\n\n"
                "Port `4444` is the default port used by the **Metasploit Meterpreter** payload for reverse shells. "
                "When a machine is compromised, the attacker directs the victim machine to open an outbound TCP socket to port 4444.\n\n"
                "**SOC Investigation Checklist:**\n"
                "1. **Identify the Process:** `Get-NetTCPConnection -RemotePort 4444 | Select-Object OwningProcess`\n"
                "2. **Kill the Process:** `Stop-Process -Id <PID> -Force`\n"
                "3. **Block Outbound Port 4444:** `New-NetFirewallRule -DisplayName 'Block 4444' -Direction Outbound -Action Block -RemotePort 4444`\n"
                "4. **Inspect Dropped Files:** Check `%TEMP%` and `%APPDATA%` for unrecognized `.exe`, `.bat`, or `.ps1` files."
            )
            followups = [
                "What other dangerous ports should CyberWatch monitor?",
                "What is a reverse shell and how does it bypass firewalls?",
                "How do I block an IP permanently?",
            ]

        elif any(p in q for p in ["port 1337", "31337", "12345", "6667", "5555", "9999", "port"]):
            matched_port = re.search(r"\b(1337|31337|12345|6667|5555|9999|21|22|23|80|443|445|3389|8080)\b", q)
            p_num = matched_port.group(1) if matched_port else "unusual"

            port_profiles = {
                "1337": "Classic Hacker / Backdoor signature port.",
                "31337": "Back Orifice Remote Administration Trojan port.",
                "12345": "NetBus Trojan default listening socket.",
                "6667": "IRC protocol, frequently abused for automated botnet C2 coordination.",
                "5555": "Android Debug Bridge (ADB), dangerous when exposed publicly without auth.",
                "23": "Telnet plaintext remote access; unencrypted credentials transmitted over network.",
                "445": "SMB (Server Message Block), target of EternalBlue (WannaCry) exploits.",
                "3389": "RDP (Remote Desktop Protocol), target of credential brute-forcing.",
                "8080": "Alternative HTTP proxy or web administration interface.",
            }
            desc = port_profiles.get(p_num, "Non-standard high port frequently leveraged for proxying or C2.")

            reply = (
                f"### 🔍 Network Port Profile: Port {p_num}\n\n"
                f"**Risk Profile:** {desc}\n\n"
                f"**Investigation Steps:**\n"
                f"- To check if any local process is listening: `netstat -ano | findstr :{p_num}`\n"
                f"- To inspect the executable path: `(Get-Process -Id <PID>).Path`\n"
                f"- Check firewall policy: Ensure incoming unsolicited connections on port {p_num} are rejected."
            )
            followups = [
                f"How to close port {p_num} in Windows Firewall?",
                "What are the signs of lateral movement?",
                "Explain the difference between TCP and UDP sockets.",
            ]

        # 3. Process / LOLBin Inquiries
        elif any(b in q for b in ["notepad", "calc", "lolbin", "certutil", "vssadmin", "powershell", "svchost"]):
            reply = (
                "### 🧩 Living-off-the-Land Binaries (LOLBins) & Process Injection\n\n"
                "**Why are system utilities flagged?**\n"
                "Standard Windows utilities like `notepad.exe` and `calc.exe` have **zero legitimate networking code**.\n\n"
                "When observed connecting out to the internet, it signifies **Process Injection**:\n"
                "- **Process Hollowing:** An attacker spawns a suspended benign process and replaces its memory image with malicious shellcode.\n"
                "- **Reflective DLL Injection:** Loading malicious libraries directly from memory without writing to disk.\n\n"
                "**Immediate Remediation:**\n"
                "```powershell\n"
                "# Kill offending process\n"
                "Stop-Process -Name notepad -Force\n\n"
                "# Find parent process (PPID)\n"
                "Get-CimInstance Win32_Process -Filter \"Name = 'notepad.exe'\" | Select-Object ParentProcessId, CommandLine\n"
                "```"
            )
            followups = [
                "What is the difference between LOLBins and traditional malware?",
                "How does CyberWatch catch process injection?",
                "How can I audit Windows PowerShell logs?",
            ]

        # 4. Port Scanning & Reconnaissance
        elif any(w in q for w in ["port scan", "scanning", "reconnaissance", "nmap", "sweep"]):
            reply = (
                "### 📡 Port Scanning Reconnaissance Analysis\n\n"
                "Port scanning is the **first phase** of cyber reconnaissance. The attacker sends rapid probes to find which services are open.\n\n"
                "**How CyberWatch Detects It:**\n"
                "- Tracks the count of unique destination ports targeted by a single PID within a sliding window.\n"
                "- If a process connects to $\\ge 4$ distinct ports rapidly, a `PORT_SCAN` threat is raised.\n\n"
                "**Hardening Actions:**\n"
                "1. Configure firewall to drop dropped packets silently (stealth mode).\n"
                "2. Disable unused services (FTP, Telnet, SMBv1).\n"
                "3. Place sensitive administration endpoints (SSH/RDP) behind a VPN."
            )
            followups = [
                "What is a SYN stealth scan vs full connect scan?",
                "How can I simulate a port scan safely for testing?",
                "Explain MITRE ATT&CK technique T1046.",
            ]

        # 5. Incident Response & SOC Workflow
        elif any(w in q for w in ["triage", "incident", "soc", "respond", "workflow", "alert"]):
            reply = (
                "### 🎯 The 5-Stage SOC Incident Response Lifecycle (NIST SP 800-61)\n\n"
                "1. **Detection & Analysis:** Validate the alert in CyberWatch. Verify process name, PID, and destination IP reputation.\n"
                "2. **Containment:** Transition alert status to `ACKNOWLEDGED`. Isolate host or terminate offending PID (`Stop-Process -Id <PID> -Force`).\n"
                "3. **Eradication:** Remove persistence registry keys, scheduled tasks, or temporary staging files.\n"
                "4. **Recovery:** Re-audit system sockets to confirm all connections are clean.\n"
                "5. **Post-Incident Review:** Transition alert status to `RESOLVED`, add investigation notes, and export an **Executive Report**."
            )
            followups = [
                "How do I mark an alert as resolved in CyberWatch?",
                "How do I export incident records to CSV?",
                "What is MTTR and why does it matter?",
            ]

        # 6. General Greetings
        elif any(g in q for g in ["hello", "hi", "hey", "who are you", "what can you do"]):
            reply = (
                "### 👋 Hello Analyst!\n\n"
                "I am your **CyberWatch AI Security Analyst**, integrated directly into your Security Operations Center.\n\n"
                "**What I Can Do:**\n"
                "- **Live Posture Analysis:** Ask me about your system's current threats, alerts, or active sockets.\n"
                "- **MITRE ATT&CK Mapping:** Deep forensic investigation of any detected incident.\n"
                "- **Threat Explanation:** Ask about any port (e.g., 4444, 3389), process (e.g., notepad, certutil), or malware type.\n"
                "- **CLI Playbooks:** Generate copy-paste PowerShell remediation commands.\n\n"
                "Try asking: *\"What is my current threat level?\"* or *\"Why is port 4444 dangerous?\"*"
            )
            followups = [
                "What is my current threat level?",
                "Explain the risks of port 4444.",
                "How do I investigate a suspicious process?",
            ]

        # 7. Default Rich Technical Answer
        else:
            reply = (
                f"### 🛡️ CyberWatch Threat Intelligence Analysis\n\n"
                f"I evaluated your inquiry regarding **\"{req.message}\"** in the context of host endpoint security.\n\n"
                f"**Key Considerations:**\n"
                f"- **Telemetry Verification:** Every outbound socket represents an established network session. Inspect the owning PID and destination IP reputation.\n"
                f"- **Defense in Depth:** Ensure your perimeter firewall enforces default-deny outbound egress rules on non-standard ports.\n"
                f"- **Incident Queue:** Use the **Alerts** tab to prioritize high-risk indicators and assign investigation tickets.\n\n"
                f"*Tip: You can ask specific questions about any port, executable, attack technique, or live system posture.*"
            )
            followups = [
                "What are the top flagged processes right now?",
                "Explain how LOLBins evade detection.",
                "How do I export an executive security report?",
            ]

        return AIChatResponse(
            reply=reply,
            suggested_followups=followups,
            provider="CyberWatch SOC Intelligence (Local Engine)",
            timestamp=now,
        )


ai_analyst = AISecurityAnalyst()
