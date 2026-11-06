"""Pydantic schemas for Executive Security Reports & Audit Export."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ComplianceScoreSchema(BaseModel):
    """Compliance alignment indicator for enterprise standards."""

    framework: str
    score: int = Field(..., ge=0, le=100)
    status: str  # Compliant, Needs Attention, At Risk
    details: str

    model_config = ConfigDict(from_attributes=True)


class ExecutiveReportSchema(BaseModel):
    """Complete executive posture report document."""

    report_id: str
    generated_at: str
    hostname: str
    overall_posture_score: int = Field(..., ge=0, le=100)
    risk_tier: str  # LOW, MODERATE, ELEVATED, CRITICAL
    total_sockets_audited: int
    threats_detected_count: int
    open_alerts_count: int
    resolved_incidents_count: int
    compliance_evaluations: list[ComplianceScoreSchema]
    top_flagged_processes: list[dict[str, Any]]
    top_targeted_ports: list[dict[str, Any]]
    executive_summary: str
    strategic_recommendations: list[str]

    model_config = ConfigDict(from_attributes=True)
