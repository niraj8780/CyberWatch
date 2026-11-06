"""Pydantic schemas for the Phase 4 IP Intelligence & Geolocation service."""

from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


class IPType(str, Enum):
    """Network IP address classification."""

    LOOPBACK = "loopback"
    PRIVATE = "private"
    PUBLIC = "public"
    MULTICAST = "multicast"


class ReputationStatus(str, Enum):
    """Calculated threat reputation status."""

    CLEAN = "clean"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    UNKNOWN = "unknown"


class IPIntelligenceSchema(BaseModel):
    """Enriched IP intelligence and geolocation information."""

    ip: str = Field(..., description="Target IPv4 or IPv6 address")
    ip_type: IPType = Field(..., description="Classification category")
    is_private: bool = Field(..., description="Whether address is RFC 1918 private")
    country_code: str | None = Field(default=None, description="ISO 2-letter country code")
    country_name: str | None = Field(default=None, description="Full country name")
    city: str | None = Field(default=None, description="City location")
    asn: str | None = Field(default=None, description="Autonomous System Number (e.g. AS13335)")
    organization: str | None = Field(default=None, description="ISP, hosting provider, or Org")
    threat_score: int = Field(default=0, ge=0, le=100, description="Risk rating score 0-100")
    reputation: ReputationStatus = Field(default=ReputationStatus.UNKNOWN, description="Reputation rating")
    flags: list[str] = Field(default_factory=list, description="Security attribute tags")
    last_analyzed: str = Field(..., description="Timestamp of analysis")

    model_config = ConfigDict(from_attributes=True)


class BatchIPEnrichmentRequest(BaseModel):
    """Request payload to enrich multiple IP addresses simultaneously."""

    ips: list[str]


class BatchIPEnrichmentResponse(BaseModel):
    """Batch enrichment response mapping IP strings to intelligence schemas."""

    results: dict[str, IPIntelligenceSchema]
    total_processed: int

    model_config = ConfigDict(from_attributes=True)
