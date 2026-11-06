"""FastAPI endpoints for Alerts & Incident Management."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.alerts.manager import alert_manager
from app.schemas.alert import (
    AlertCreateRequest,
    AlertListResponse,
    AlertSchema,
    AlertSummaryResponse,
    AlertUpdateRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List security alerts",
    description="Retrieve all incident alerts with optional filtering by status (new, acknowledged, resolved) and severity.",
)
async def list_alerts(
    status: Annotated[str | None, Query(description="Filter by alert status: new, acknowledged, resolved")] = None,
    severity: Annotated[str | None, Query(description="Filter by severity: low, medium, high, critical")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> AlertListResponse:
    """Retrieve security incident alerts with pagination."""
    items, total, new_cnt, ack_cnt, res_cnt, crit_cnt, high_cnt = alert_manager.get_alerts(
        status=status,
        severity=severity,
        limit=limit,
        offset=offset,
    )
    return AlertListResponse(
        total=total,
        items=items,
        new_count=new_cnt,
        acknowledged_count=ack_cnt,
        resolved_count=res_cnt,
        critical_count=crit_cnt,
        high_count=high_cnt,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=AlertSummaryResponse,
    summary="Incident triage summary",
    description="Return overall incident counts, status breakdowns, and MTTA/MTTR metrics.",
)
async def get_alerts_summary() -> AlertSummaryResponse:
    """Retrieve incident triage statistical summary."""
    return alert_manager.get_summary()


@router.get(
    "/{alert_id}",
    response_model=AlertSchema,
    summary="Get single alert detail",
    description="Fetch complete metadata and investigation notes for an incident alert.",
)
async def get_alert(alert_id: str) -> AlertSchema:
    """Retrieve an alert by its ID."""
    alert = alert_manager.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    return alert


@router.post(
    "",
    response_model=AlertSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual incident alert",
    description="Raise a new incident alert with custom parameters.",
)
async def create_alert(payload: AlertCreateRequest) -> AlertSchema:
    """Manually raise an incident alert."""
    return alert_manager.create_alert(payload)


@router.patch(
    "/{alert_id}",
    response_model=AlertSchema,
    summary="Update incident status or add triage note",
    description="Transition alert state (new -> acknowledged -> resolved) or append analyst investigation comments.",
)
async def update_alert(
    alert_id: str,
    payload: AlertUpdateRequest,
) -> AlertSchema:
    """Update triage state of an incident."""
    updated = alert_manager.update_alert(
        alert_id=alert_id,
        status=payload.status,
        assigned_to=payload.assigned_to,
        note=payload.note,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found.",
        )
    return updated
