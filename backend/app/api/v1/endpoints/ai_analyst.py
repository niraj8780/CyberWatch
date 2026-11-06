"""FastAPI endpoints for the AI Security Analyst assistant."""

from fastapi import APIRouter

from app.ai.analyst import ai_analyst
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIThreatAnalysisRequest,
    AIThreatAnalysisResponse,
)

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AIThreatAnalysisResponse,
    summary="Automated AI threat investigation",
    description="Run deep AI analysis mapping an incident to MITRE ATT&CK tactics, root causes, and containment CLI commands.",
)
async def analyze_threat(payload: AIThreatAnalysisRequest) -> AIThreatAnalysisResponse:
    """Analyze a threat event or alert with the AI Security Analyst."""
    return ai_analyst.analyze_threat(payload)


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="Chat with AI Security Analyst",
    description="Interactive conversational interface for cybersecurity questions, triage playbooks, and advice.",
)
async def chat_with_analyst(payload: AIChatRequest) -> AIChatResponse:
    """Send a query to the AI Security Analyst."""
    return ai_analyst.chat(payload)


@router.get(
    "/quick-prompts",
    summary="Get recommended security prompt templates",
    description="Retrieve one-click prompt templates for rapid SOC analysis.",
)
async def get_quick_prompts() -> list[dict[str, str]]:
    """Return pre-configured SOC investigation prompt templates."""
    return [
        {
            "id": "prompt-1",
            "title": "Explain Port 4444 Risks",
            "prompt": "Why is destination port 4444 flagged as high severity in CyberWatch?",
        },
        {
            "id": "prompt-2",
            "title": "Investigate LOLBin Injection",
            "prompt": "How do adversaries abuse notepad.exe or calc.exe for C2 network beaconing?",
        },
        {
            "id": "prompt-3",
            "title": "Port Scanning Mitigation",
            "prompt": "What are the recommended steps when a port scan is detected on internal subnets?",
        },
        {
            "id": "prompt-4",
            "title": "SOC Triage Playbook",
            "prompt": "Give me the standard incident triage workflow for resolving new alerts.",
        },
    ]
