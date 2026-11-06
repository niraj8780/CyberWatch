"""FastAPI endpoints for IP Intelligence & Geolocation."""

from fastapi import APIRouter, HTTPException, status

from app.intelligence.ip_intel import ip_intelligence_service
from app.schemas.intelligence import (
    BatchIPEnrichmentRequest,
    BatchIPEnrichmentResponse,
    IPIntelligenceSchema,
)

router = APIRouter()


@router.get(
    "/ip/{ip_address}",
    response_model=IPIntelligenceSchema,
    summary="Get IP intelligence and geolocation",
    description="Inspect public/private status, country, ASN/Org, and risk reputation rating for an IP address.",
)
async def get_ip_intelligence(ip_address: str) -> IPIntelligenceSchema:
    """Analyze and geolocate an IP address."""
    if not ip_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An IP address must be provided.",
        )
    return ip_intelligence_service.analyze_ip(ip_address)


@router.post(
    "/ip/batch",
    response_model=BatchIPEnrichmentResponse,
    summary="Batch IP intelligence lookup",
    description="Enrich an array of IP addresses in a single query.",
)
async def batch_ip_intelligence(payload: BatchIPEnrichmentRequest) -> BatchIPEnrichmentResponse:
    """Batch-enrich multiple IP addresses."""
    results = ip_intelligence_service.batch_analyze(payload.ips)
    return BatchIPEnrichmentResponse(
        results=results,
        total_processed=len(results),
    )
