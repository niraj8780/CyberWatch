"""Network-related Pydantic response and request schemas."""

from pydantic import BaseModel, ConfigDict


class ConnectionSchema(BaseModel):
    """Schema representing an individual network connection."""

    local_ip: str | None = None
    local_port: int | None = None
    remote_ip: str | None = None
    remote_port: int | None = None
    protocol: str
    ip_version: str
    status: str
    pid: int | None = None
    process_name: str | None = None
    timestamp: str

    model_config = ConfigDict(from_attributes=True)


class ConnectionListResponse(BaseModel):
    """Response schema for listing network connections with total count and timestamp."""

    total: int
    connections: list[ConnectionSchema]
    timestamp: str

    model_config = ConfigDict(from_attributes=True)


class NetworkStatisticsResponse(BaseModel):
    """Response schema summarizing overall network connection statistics."""

    total_connections: int
    tcp_connections: int
    udp_connections: int
    ipv4_connections: int
    ipv6_connections: int
    listening_ports: int
    established: int
    states: dict[str, int]
    timestamp: str

    model_config = ConfigDict(from_attributes=True)


class InterfaceAddressSchema(BaseModel):
    """Schema representing a network address bound to an interface."""

    family: str
    address: str
    netmask: str | None = None
    broadcast: str | None = None

    model_config = ConfigDict(from_attributes=True)


class NetworkInterfaceSchema(BaseModel):
    """Schema representing a network interface with addresses and stats."""

    name: str
    addresses: list[InterfaceAddressSchema]
    is_up: bool
    speed: int
    mtu: int

    model_config = ConfigDict(from_attributes=True)


class ListeningPortSchema(BaseModel):
    """Schema representing a listening socket port with its owning process."""

    port: int
    protocol: str
    ip_version: str
    local_ip: str | None = None
    pid: int | None = None
    process_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
