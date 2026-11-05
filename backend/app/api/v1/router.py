"""Combined API v1 router definition."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, network, processes, websockets

api_router = APIRouter()

# Include endpoint routers with consistent tags and paths
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(network.router, prefix="/network", tags=["Network"])
api_router.include_router(processes.router, prefix="/processes", tags=["Processes"])
api_router.include_router(websockets.router, tags=["WebSockets"])
