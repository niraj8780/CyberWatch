"""Pydantic schemas for the Phase 4 AI Security Analyst engine."""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class MitreTacticSchema(BaseModel):
    """MITRE ATT&CK framework mapping entry."""

    id: str = Field(..., description="Technique ID (e.g. T1046)")
    name: str = Field(..., description="Technique Name")
    tactic: str = Field(..., description="ATT&CK Tactic Category")

    model_config = ConfigDict(from_attributes=True)


class AIThreatAnalysisRequest(BaseModel):
    """Payload to trigger comprehensive AI deep investigation of an event or alert."""

    event_id: str | None = None
    title: str
    description: str
    source_ip: str | None = None
    dest_ip: str | None = None
    dest_port: int | None = None
    process_name: str | None = None
    pid: int | None = None
    evidence: dict[str, Any] = Field(default_factory=dict)
    api_key: str | None = None
    model: str | None = "gemini-1.5-flash"


class AIThreatAnalysisResponse(BaseModel):
    """Structured AI investigation report produced by the LLM analyst."""

    analysis_id: str
    incident_summary: str
    mitre_techniques: list[MitreTacticSchema]
    severity_assessment: str
    root_cause_analysis: str
    potential_impact: str
    threat_actor_attribution: str
    containment_checklist: list[str]
    suggested_commands: list[str]
    provider: str = "CyberWatch SOC Intelligence"
    generated_at: str

    model_config = ConfigDict(from_attributes=True)


class AIChatMessage(BaseModel):
    """Single turn in a conversation with the AI Security Analyst."""

    role: str  # user, assistant, system
    content: str
    timestamp: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AIChatRequest(BaseModel):
    """Interactive chat prompt sent to the AI Security Analyst."""

    message: str
    history: list[AIChatMessage] = Field(default_factory=list)
    context: dict[str, Any] | None = None
    api_key: str | None = None
    model: str | None = "gemini-1.5-flash"


class AIChatResponse(BaseModel):
    """Response returned by the AI Security Analyst."""

    reply: str
    suggested_followups: list[str] = Field(default_factory=list)
    provider: str = "CyberWatch SOC Intelligence"
    timestamp: str

    model_config = ConfigDict(from_attributes=True)
