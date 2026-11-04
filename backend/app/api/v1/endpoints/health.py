"""Health check and system information endpoints."""

from datetime import datetime, timezone
import platform
import socket
import time

from fastapi import APIRouter
import psutil

from app.config import get_settings
from app.monitoring.network_monitor import network_monitor
from app.schemas.common import HealthResponse, SystemInfoResponse

router = APIRouter()
settings = get_settings()

APP_START_TIME = time.time()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def get_health() -> HealthResponse:
    """Return health status, version, uptime, and monitor status."""
    uptime = round(time.time() - APP_START_TIME, 2)
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        uptime_seconds=uptime,
        monitoring_active=network_monitor.is_running,
    )


@router.get("/system/info", response_model=SystemInfoResponse, tags=["Health"])
async def get_system_info() -> SystemInfoResponse:
    """Return host platform, CPU count, memory statistics, and boot time."""
    vmem = psutil.virtual_memory()
    boot_time_dt = datetime.fromtimestamp(psutil.boot_time(), tz=timezone.utc)

    return SystemInfoResponse(
        hostname=socket.gethostname(),
        platform=platform.platform(),
        cpu_count=psutil.cpu_count(logical=True),
        memory_total_gb=round(vmem.total / (1024**3), 2),
        memory_available_gb=round(vmem.available / (1024**3), 2),
        memory_percent=float(vmem.percent),
        boot_time=boot_time_dt.isoformat(),
        python_version=platform.python_version(),
    )
