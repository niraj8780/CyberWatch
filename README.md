# 🛡️ CyberWatch — Full-Stack SOC Network Security & AI Incident Platform

> Enterprise-grade real-time network monitoring, automated heuristic threat detection, and AI-assisted incident triage platform.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Live_Streaming-FF6B6B)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🌟 Key Platform Modules

CyberWatch is a production-quality cybersecurity monitoring application designed for Security Operations Centers (SOC):

### 1. 📡 Real-Time Telemetry & WebSocket Streaming
- Scans host TCP/UDP sockets, interfaces, and process associations in real time using `psutil`.
- High-frequency delta tracking broadcasts newly connected and disconnected sockets to connected analysts with sub-second latency.
- Dynamic network traffic status, socket states (`ESTABLISHED`, `LISTEN`, `SYN_SENT`, `TIME_WAIT`), and protocol distributions.

### 2. 🧠 Modular Threat Detection Engine
- **Heuristic Rule Engine** evaluating connection snapshots against 6 configurable detection rules:
  1. **Dangerous & Anomalous Destination Ports** (`4444` Metasploit, `1337`, `31337`, `6667` IRC botnets).
  2. **Living-off-the-Land (LOLBin) Process Abuse** (detects `notepad.exe`, `calc.exe`, `vssadmin.exe`, `certutil.exe` making unauthorized external connections).
  3. **Port Scanning Reconnaissance** (catches rapid multi-port sweeping across internal/external subnets).
  4. **Connection Bursts & Spikes** (identifies abnormal concurrent socket surges signaling exfiltration or DDoS).
  5. **Unexpected Wildcard Listeners** (flags sensitive services bound to `0.0.0.0`).
  6. **Repeated Probes & Beaconing** (identifies persistent stuck `SYN_SENT` attempts to dead or sinkholed C2 servers).
- Real-time rule toggles allow analysts to enable or disable individual heuristics on the fly.
- Automated alert deduplication cooldown prevents notification flooding.

### 3. 🚨 Alerts & Incident Triage Lifecycle
- Complete incident management workflow: **New $\rightarrow$ Acknowledged $\rightarrow$ Resolved**.
- High-severity threats are automatically promoted to incident tickets.
- Analyst triage notebook: post timestamped investigation comments and assign responders.
- Manual incident reporting for ad-hoc SOC ticket creation.

### 4. 🤖 AI Security Analyst & Reasoning Engine
- Maps incidents directly to the **MITRE ATT&CK Matrix** (e.g. *T1046 Network Service Discovery*, *T1218 System Binary Proxy Execution*, *T1055 Process Injection*).
- Conducts automated root-cause analysis, threat actor attribution, and containment checklists.
- Generates copyable host isolation and remediation CLI commands (PowerShell / Windows Firewall).
- Interactive conversational AI interface for technical cybersecurity inquiries.

### 5. 🌍 IP Intelligence & Geolocation
- Automatic classification of Private (RFC 1918), Loopback, Multicast, and Public internet addresses.
- Enriches IP addresses with country origin, city, ISP / Organization, ASN, and reputation threat scores (0–100).
- Flagging for Tor exit nodes, public DNS resolvers, and known malicious command-and-control servers.

### 6. 📄 Executive Reports & Compliance Audit
- Automated evaluation of enterprise compliance frameworks: **NIST CSF 2.0**, **CIS Controls v8**, **PCI-DSS v4.0**, and **ISO 27001:2022**.
- Overall Security Posture Health Score (0–100) and risk tier classification (`LOW`, `MODERATE`, `ELEVATED`, `CRITICAL`).
- One-click structured **CSV export** for audit logging and printable **Executive PDF Report**.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CyberWatch SOC Platform                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌───────────────────────────────┐           ┌────────────────────────────────┐
│   React 18 + TypeScript UI    │           │      FastAPI Python Server     │
│       localhost:5173          │           │         localhost:8000         │
├───────────────────────────────┤           ├────────────────────────────────┤
│ • Overview Telemetry          │ WebSocket │ • WebSocket Live Manager       │
│ • Network Connection Monitor  │◀─────────▶│ • Real psutil Telemetry Loop   │
│ • Heuristic Threat Detection  │           │ • RuleEngine (6 Heuristics)    │
│ • Incident Triage Queue       │           │ • AlertManager (CRUD Lifecycle)│
│ • AI Security Analyst Console │  REST v1  │ • IP Intelligence Service      │
│ • Executive Audit Reports     │◀─────────▶│ • AI Reasoning Engine          │
│ • Dark SOC Aesthetic          │           │ • Compliance Report Generator  │
└───────────────────────────────┘           └────────────────────────────────┘
```

---

## 🚀 Quick Start (Windows 11 / PowerShell)

### Prerequisites
- **Python 3.11+** installed (`python --version`)
- **Node.js 18+** installed (`node --version`)

### 1. Start Backend API
```powershell
cd 'CyberWatch\backend'
python -m uvicorn app.main:app --reload --port 8000
```
*Backend runs at: `http://localhost:8000` (API documentation at `http://localhost:8000/docs`)*

### 2. Start Frontend Dashboard
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$env:ComSpec = "C:\Windows\system32\cmd.exe"
cd 'CyberWatch\frontend'
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 🧪 Testing

Run backend test suites:
```powershell
cd 'CyberWatch\backend'
pytest tests/ -v
```

---

## 📜 License
Released under the [MIT License](LICENSE).
