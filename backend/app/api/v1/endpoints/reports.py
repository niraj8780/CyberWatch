"""FastAPI endpoints for Executive Security Reports and Audit Export."""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.reports.generator import report_generator
from app.schemas.report import ExecutiveReportSchema

router = APIRouter()


@router.get(
    "/executive",
    response_model=ExecutiveReportSchema,
    summary="Get executive cybersecurity audit digest",
    description="Generate a high-level security posture summary, compliance scorecards, and key remediation directives.",
)
async def get_executive_report() -> ExecutiveReportSchema:
    """Retrieve full executive security report."""
    return await report_generator.generate_executive_report()


@router.get(
    "/export/csv",
    summary="Export security audit log as CSV",
    description="Download a structured CSV containing all active sockets, security detections, and incident alerts.",
)
async def export_csv() -> PlainTextResponse:
    """Download audit records in CSV format."""
    csv_content = await report_generator.generate_csv()
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cyberwatch_audit_report.csv"},
    )
