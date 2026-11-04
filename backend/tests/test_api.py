"""Integration tests for all CyberWatch FastAPI endpoints."""

import httpx
import pytest


@pytest.mark.asyncio
async def test_health_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test health check endpoint on both /api/v1/health and /health."""
    response = await app_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "CyberWatch"
    assert "version" in data
    assert data["uptime_seconds"] >= 0
    assert isinstance(data["monitoring_active"], bool)

    # Test root alias
    root_health = await app_client.get("/health")
    assert root_health.status_code == 200
    assert root_health.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_system_info_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test host system information endpoint."""
    response = await app_client.get("/api/v1/system/info")
    assert response.status_code == 200
    data = response.json()
    assert "hostname" in data
    assert "platform" in data
    assert "memory_total_gb" in data
    assert "memory_available_gb" in data
    assert "memory_percent" in data
    assert "boot_time" in data
    assert "python_version" in data
    assert data["memory_total_gb"] > 0


@pytest.mark.asyncio
async def test_network_connections_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test retrieving active network connections list."""
    response = await app_client.get("/api/v1/network/connections")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "connections" in data
    assert "timestamp" in data
    assert isinstance(data["connections"], list)
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_network_statistics_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test network connection statistics aggregation endpoint."""
    response = await app_client.get("/api/v1/network/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "total_connections" in data
    assert "tcp_connections" in data
    assert "udp_connections" in data
    assert "ipv4_connections" in data
    assert "ipv6_connections" in data
    assert "listening_ports" in data
    assert "established" in data
    assert "states" in data
    assert "timestamp" in data
    assert isinstance(data["states"], dict)


@pytest.mark.asyncio
async def test_network_interfaces_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test network interfaces listing endpoint."""
    response = await app_client.get("/api/v1/network/interfaces")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        first_if = data[0]
        assert "name" in first_if
        assert "addresses" in first_if
        assert "is_up" in first_if
        assert "speed" in first_if
        assert "mtu" in first_if


@pytest.mark.asyncio
async def test_listening_ports_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test listening sockets endpoint."""
    response = await app_client.get("/api/v1/network/listening-ports")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for port_info in data:
        assert "port" in port_info
        assert "protocol" in port_info
        assert "ip_version" in port_info


@pytest.mark.asyncio
async def test_processes_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test system processes listing endpoint."""
    response = await app_client.get("/api/v1/processes?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "processes" in data
    assert isinstance(data["processes"], list)
    assert data["total"] > 0
    if data["processes"]:
        p = data["processes"][0]
        assert "pid" in p
        assert "name" in p
        assert "status" in p
        assert "connections_count" in p
        assert "connections" in p


@pytest.mark.asyncio
async def test_process_detail_not_found(app_client: httpx.AsyncClient) -> None:
    """Test process detail returns 404 for a non-existent PID."""
    # Use an impossibly high PID
    response = await app_client.get("/api/v1/processes/999999999")
    assert response.status_code == 404
    detail = response.json().get("detail", "")
    assert "999999999" in detail
    assert "not found" in detail.lower()


@pytest.mark.asyncio
async def test_root_endpoint(app_client: httpx.AsyncClient) -> None:
    """Test root application metadata endpoint."""
    response = await app_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "app": "CyberWatch",
        "version": "0.1.0",
        "docs": "/docs",
    }
