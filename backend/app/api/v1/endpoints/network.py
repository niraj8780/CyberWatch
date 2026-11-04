"""Network monitoring API endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Query

from app.monitoring.network_monitor import network_monitor
from app.schemas.network import (
    ConnectionListResponse,
    ListeningPortSchema,
    NetworkInterfaceSchema,
    NetworkStatisticsResponse,
)

router = APIRouter()


@router.get(
    "/connections",
    response_model=ConnectionListResponse,
    summary="List active network connections",
)
async def get_connections(
    protocol: str | None = Query(
        None, description="Filter by protocol ('tcp' or 'udp')"
    ),
    status: str | None = Query(
        None, description="Filter by connection status (e.g. 'ESTABLISHED', 'LISTEN')"
    ),
    process_name: str | None = Query(
        None, description="Filter by process name substring"
    ),
    limit: int = Query(500, ge=1, le=5000, description="Max connections to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> ConnectionListResponse:
    """Retrieve filtered and paginated real network connections."""
    conns, total = await network_monitor.get_connections(
        protocol=protocol,
        status=status,
        process_name=process_name,
        limit=limit,
        offset=offset,
    )
    last_time = network_monitor.last_scan_time
    ts = (
        last_time.isoformat()
        if last_time
        else datetime.now(timezone.utc).isoformat()
    )
    return ConnectionListResponse(
        total=total,
        connections=conns,
        timestamp=ts,
    )


@router.get(
    "/interfaces",
    response_model=list[NetworkInterfaceSchema],
    summary="List network interfaces",
)
async def get_interfaces() -> list[NetworkInterfaceSchema]:
    """Retrieve all system network interfaces, IP/MAC addresses, and interface status."""
    return await network_monitor.get_interfaces()


@router.get(
    "/statistics",
    response_model=NetworkStatisticsResponse,
    summary="Get network statistics summary",
)
async def get_statistics() -> NetworkStatisticsResponse:
    """Retrieve connection counts by protocol, family, and connection states."""
    stats = await network_monitor.get_statistics()
    return NetworkStatisticsResponse(**stats)


@router.get(
    "/listening-ports",
    response_model=list[ListeningPortSchema],
    summary="List listening sockets",
)
async def get_listening_ports() -> list[ListeningPortSchema]:
    """Retrieve listening ports along with their bound process information."""
    ports = await network_monitor.get_listening_ports()
    return [ListeningPortSchema(**p) for p in ports]
