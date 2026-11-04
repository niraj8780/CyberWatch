"""Process-related Pydantic response schemas."""

from pydantic import BaseModel, ConfigDict


class ProcessConnectionSchema(BaseModel):
    """Network connection associated with a specific process."""

    local_ip: str | None = None
    local_port: int | None = None
    remote_ip: str | None = None
    remote_port: int | None = None
    protocol: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class ProcessSchema(BaseModel):
    """Schema representing basic process information and active connection summary."""

    pid: int
    name: str
    status: str
    connections_count: int
    connections: list[ProcessConnectionSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ProcessDetailSchema(BaseModel):
    """Schema representing detailed process statistics, resources, and connections."""

    pid: int
    name: str
    status: str
    cpu_percent: float
    memory_percent: float
    memory_rss_mb: float
    create_time: str
    exe: str | None = None
    cmdline: list[str] = []
    connections: list[ProcessConnectionSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ProcessListResponse(BaseModel):
    """Response schema for process listing."""

    total: int
    processes: list[ProcessSchema]

    model_config = ConfigDict(from_attributes=True)
