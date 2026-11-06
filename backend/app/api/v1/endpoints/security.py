"""FastAPI endpoints for Phase 3 Threat Detection Engine."""

import time
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, status

from app.detection.rule_engine import rule_engine
from app.monitoring.network_monitor import network_monitor
from app.schemas.security import (
    DetectionRuleSchema,
    DetectionRuleToggleRequest,
    ManualScanResponse,
    SecurityEventListResponse,
    SecurityEventSchema,
    SecuritySummaryResponse,
)

router = APIRouter()


@router.get(
    "/events",
    response_model=SecurityEventListResponse,
    summary="List detected security events",
    description="Retrieve detected threat events with optional filtering by severity, rule, and process.",
)
async def list_security_events(
    severity: Annotated[str | None, Query(description="Filter by severity: low, medium, high")] = None,
    rule_id: Annotated[str | None, Query(description="Filter by rule ID")] = None,
    process_name: Annotated[str | None, Query(description="Filter by process name substring")] = None,
    limit: Annotated[int, Query(ge=1, le=200, description="Page limit")] = 50,
    offset: Annotated[int, Query(ge=0, description="Page offset")] = 0,
) -> SecurityEventListResponse:
    """Query recent security events with filtering and counts."""
    items, total, high_cnt, med_cnt, low_cnt = await rule_engine.get_events(
        severity=severity,
        rule_id=rule_id,
        process_name=process_name,
        limit=limit,
        offset=offset,
    )
    return SecurityEventListResponse(
        total=total,
        items=items,
        high_count=high_cnt,
        medium_count=med_cnt,
        low_count=low_cnt,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/events/{event_id}",
    response_model=SecurityEventSchema,
    summary="Get single security event detail",
    description="Fetch comprehensive metadata, evidence payload, and investigation recommendations for a specific event.",
)
async def get_security_event(event_id: str) -> SecurityEventSchema:
    """Retrieve detailed security event by ID."""
    event = await rule_engine.get_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security event with ID '{event_id}' not found.",
        )
    return event


@router.post(
    "/scan",
    response_model=ManualScanResponse,
    summary="Trigger immediate threat detection scan",
    description="Execute all active detection rules against the latest network connection snapshot.",
)
async def trigger_security_scan() -> ManualScanResponse:
    """Manually invoke the threat detection engine on current active connections."""
    start_time = time.perf_counter()
    connections = await network_monitor.get_connections()

    # Run detection engine across snapshot
    new_events = await rule_engine.run_scan(connections)
    duration_ms = (time.perf_counter() - start_time) * 1000.0

    all_items, total, _, _, _ = await rule_engine.get_events(limit=10)
    now_iso = datetime.now(timezone.utc).isoformat()

    return ManualScanResponse(
        scanned_connections_count=len(connections),
        new_threats_detected=len(new_events),
        total_active_threats=total,
        events=new_events,
        scan_duration_ms=round(duration_ms, 2),
        timestamp=now_iso,
    )


@router.get(
    "/summary",
    response_model=SecuritySummaryResponse,
    summary="Get security threat posture summary",
    description="Return overall threat posture, severity counts, active rules, and top flagged processes/ports.",
)
async def get_security_summary() -> SecuritySummaryResponse:
    """Retrieve summarized threat intelligence and engine stats."""
    return await rule_engine.get_summary()


@router.get(
    "/rules",
    response_model=list[DetectionRuleSchema],
    summary="List all detection rules",
    description="Retrieve all registered threat detection rules, their categories, severities, and enabled states.",
)
async def list_detection_rules() -> list[DetectionRuleSchema]:
    """Return all configurable detection rules."""
    return rule_engine.get_rules()


@router.patch(
    "/rules/{rule_id}",
    response_model=DetectionRuleSchema,
    summary="Enable or disable a detection rule",
    description="Toggle active status of a specific threat detection rule.",
)
async def toggle_detection_rule(
    rule_id: str,
    payload: DetectionRuleToggleRequest,
) -> DetectionRuleSchema:
    """Toggle a detection rule's active state."""
    updated = rule_engine.toggle_rule(rule_id, payload.enabled)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Detection rule '{rule_id}' not found.",
        )
    return updated


@router.delete(
    "/events",
    status_code=status.HTTP_200_OK,
    summary="Clear recorded security events",
    description="Clear the in-memory security events buffer and reset deduplication state.",
)
async def clear_security_events() -> dict[str, Any]:
    """Clear threat event log."""
    count = await rule_engine.clear_events()
    return {"message": f"Successfully cleared {count} security events.", "cleared_count": count}
