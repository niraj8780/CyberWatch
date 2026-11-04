# 🛡️ CyberWatch — AI-Powered Cybersecurity Monitoring Platform

> Real-time network monitoring, threat detection, and AI-assisted security analysis for Windows 11.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features (Phase 1 — MVP)

- **Real Network Monitoring** — Scans your PC's actual TCP/UDP connections using `psutil`
- **Process Identification** — Shows which programs are making network connections
- **Live Dashboard** — Dark SOC-inspired UI with KPI cards, charts, and connection tables
- **REST API** — 8 versioned endpoints serving real system data
- **Network Statistics** — Connection counts by protocol, IP version, and state
- **Listening Port Detection** — Shows all open/listening ports on your system
- **Auto-Refresh** — Dashboard updates every 5 seconds automatically
- **Filtering** — Filter connections by protocol, status, or process name

## 🏗️ Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────┐
│    Frontend (React/Vite)    │────▶│   Backend (FastAPI)      │
│    localhost:5173            │     │   localhost:8000         │
│                             │     │                          │
│  • Overview Dashboard       │     │  • Network Monitor       │
│  • Network Monitor Page     │◀────│    (psutil, real data)   │
│  • Process Inspector        │     │  • Process Monitor       │
│  • Charts (Recharts)        │     │  • REST API v1           │
│  • Dark SOC Theme           │     │  • Structured Logging    │
└─────────────────────────────┘     └──────────────────────────┘
```

## 📋 Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | Any | [git-scm.com](https://git-scm.com/) |

## 🚀 Quick Start (Windows 11)

### Step 1: Backend Setup

```powershell
# Navigate to the backend directory
cd CyberWatch\backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Start the backend server (requires admin for full network monitoring)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify: Open http://localhost:8000/docs to see the Swagger API documentation.

### Step 2: Frontend Setup (New Terminal)

```powershell
# Navigate to the frontend directory
cd CyberWatch\frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
VITE v6.0.3  ready in 500ms
➜  Local: http://localhost:5173/
```

### Step 3: Open the Dashboard

Open **http://localhost:5173** in your browser. You'll see your real network connections!

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check + monitoring status |
| GET | `/api/v1/system/info` | System info (hostname, CPU, memory) |
| GET | `/api/v1/network/connections` | Active network connections (filterable) |
| GET | `/api/v1/network/interfaces` | Network interfaces |
| GET | `/api/v1/network/statistics` | Connection statistics breakdown |
| GET | `/api/v1/network/listening-ports` | Open listening ports |
| GET | `/api/v1/processes` | Processes with network connections |
| GET | `/api/v1/processes/{pid}` | Detailed process information |

### Query Parameters (connections)

- `protocol` — Filter by `tcp` or `udp`
- `status` — Filter by state (e.g., `ESTABLISHED`, `LISTEN`)
- `process_name` — Search by process name
- `limit` — Results per page (default: 500)
- `offset` — Pagination offset

## 🧪 Running Tests

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

## 🗂️ Project Structure

```
CyberWatch/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings management
│   │   ├── api/v1/endpoints/    # REST API endpoints
│   │   ├── monitoring/          # Network & process monitors (psutil)
│   │   ├── schemas/             # Pydantic response schemas
│   │   ├── models/              # SQLAlchemy ORM models
│   │   └── database/            # DB session & base classes
│   ├── tests/                   # pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard pages (Overview, Network, etc.)
│   │   ├── components/          # Reusable UI components
│   │   ├── services/api.ts      # Backend API client
│   │   ├── hooks/useApi.ts      # Data fetching hook
│   │   └── types/index.ts       # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

## 🔒 Security Notes

- Monitoring is **passive only** — CyberWatch never modifies connections, kills processes, or changes firewall rules
- No packet payload capture — only connection metadata (IPs, ports, process names)
- No API keys are required for Phase 1
- All data stays local on your machine

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Network Monitoring + Dashboard | ✅ Complete |
| 2 | WebSocket Live Updates | 🔜 Next |
| 3 | Threat Detection Engine | 📋 Planned |
| 4 | Alert Management | 📋 Planned |
| 5 | AI Security Analyst | 📋 Planned |
| 6 | IP Intelligence | 📋 Planned |
| 7 | Reports (PDF/CSV) | 📋 Planned |
| 8 | Docker + CI/CD + Docs | 📋 Planned |

## 📄 License

MIT License — see [LICENSE](LICENSE).
