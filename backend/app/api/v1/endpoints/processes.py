"""Process monitoring API endpoints."""

from fastapi import APIRouter, HTTPException, Query, status

from app.monitoring.process_monitor import process_monitor
from app.schemas.process import ProcessDetailSchema, ProcessListResponse

router = APIRouter()


@router.get(
    "",
    response_model=ProcessListResponse,
    summary="List system processes with connection summaries",
)
async def list_processes(
    name: str | None = Query(
        None, description="Filter processes by name substring (case-insensitive)"
    ),
    has_connections: bool = Query(
        False, description="Filter only processes that have active network connections"
    ),
    limit: int = Query(100, ge=1, le=1000, description="Max processes to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> ProcessListResponse:
    """Retrieve filtered and paginated processes correlated with network sockets."""
    procs, total = await process_monitor.get_processes(
        name_filter=name,
        has_connections=has_connections,
        limit=limit,
        offset=offset,
    )
    return ProcessListResponse(total=total, processes=procs)


@router.get(
    "/{pid}",
    response_model=ProcessDetailSchema,
    summary="Get detailed information for a process by PID",
)
async def get_process_detail(pid: int) -> ProcessDetailSchema:
    """Retrieve detailed process metrics, execution arguments, and network connections."""
    detail = await process_monitor.get_process_detail(pid)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Process with PID {pid} not found",
        )
    return ProcessDetailSchema(**detail)
