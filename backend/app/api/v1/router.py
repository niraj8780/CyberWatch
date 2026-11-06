"""Combined API v1 router definition for all CyberWatch modules."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai_analyst,
    alerts,
    health,
    intelligence,
    network,
    processes,
    reports,
    security,
    websockets,
)

api_router = APIRouter()

# Include endpoint routers with consistent tags and paths
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(network.router, prefix="/network", tags=["Network"])
api_router.include_router(processes.router, prefix="/processes", tags=["Processes"])
api_router.include_router(security.router, prefix="/security", tags=["Security & Threat Detection"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts & Incident Management"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["IP Intelligence & Geolocation"])
api_router.include_router(ai_analyst.router, prefix="/ai", tags=["AI Security Analyst"])
api_router.include_router(reports.router, prefix="/reports", tags=["Executive Reports & Audit Export"])
api_router.include_router(websockets.router, tags=["WebSockets"])
