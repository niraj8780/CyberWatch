"""Pytest configuration and shared fixtures for unit and integration tests."""

from collections import namedtuple
import socket
from typing import Any, AsyncGenerator

import httpx
import psutil
import pytest

from app.main import app
from app.monitoring.network_monitor import NetworkMonitor, network_monitor

MockAddr = namedtuple("MockAddr", ["ip", "port"])
MockConn = namedtuple("MockConn", ["fd", "family", "type", "laddr", "raddr", "status", "pid"])


@pytest.fixture
def sample_connection_data() -> list[dict[str, Any]]:
    """Fixture providing a diverse set of parsed connection dictionaries."""
    return [
        {
            "local_ip": "127.0.0.1",
            "local_port": 8000,
            "remote_ip": "127.0.0.1",
            "remote_port": 54321,
            "protocol": "tcp",
            "ip_version": "IPv4",
            "status": "ESTABLISHED",
            "pid": 1234,
            "process_name": "python.exe",
            "timestamp": "2026-11-03T18:00:00Z",
        },
        {
            "local_ip": "0.0.0.0",
            "local_port": 80,
            "remote_ip": None,
            "remote_port": None,
            "protocol": "tcp",
            "ip_version": "IPv4",
            "status": "LISTEN",
            "pid": 1234,
            "process_name": "python.exe",
            "timestamp": "2026-11-03T18:00:00Z",
        },
        {
            "local_ip": "::",
            "local_port": 443,
            "remote_ip": None,
            "remote_port": None,
            "protocol": "tcp",
            "ip_version": "IPv6",
            "status": "LISTEN",
            "pid": 5678,
            "process_name": "nginx.exe",
            "timestamp": "2026-11-03T18:00:00Z",
        },
        {
            "local_ip": "0.0.0.0",
            "local_port": 53,
            "remote_ip": None,
            "remote_port": None,
            "protocol": "udp",
            "ip_version": "IPv4",
            "status": "NONE",
            "pid": 9101,
            "process_name": "dns.exe",
            "timestamp": "2026-11-03T18:00:00Z",
        },
        {
            "local_ip": "::1",
            "local_port": 5353,
            "remote_ip": None,
            "remote_port": None,
            "protocol": "udp",
            "ip_version": "IPv6",
            "status": "NONE",
            "pid": None,
            "process_name": None,
            "timestamp": "2026-11-03T18:00:00Z",
        },
    ]


@pytest.fixture(autouse=True)
def mock_psutil_connections(monkeypatch: pytest.MonkeyPatch) -> list[MockConn]:
    """Fixture patching psutil.net_connections with mock connection tuples."""
    mock_conns = [
        MockConn(
            fd=-1,
            family=socket.AF_INET,
            type=socket.SOCK_STREAM,
            laddr=MockAddr(ip="127.0.0.1", port=8000),
            raddr=MockAddr(ip="127.0.0.1", port=52345),
            status="ESTABLISHED",
            pid=1234,
        ),
        MockConn(
            fd=-1,
            family=socket.AF_INET,
            type=socket.SOCK_STREAM,
            laddr=MockAddr(ip="0.0.0.0", port=80),
            raddr=(),
            status="LISTEN",
            pid=5678,
        ),
        MockConn(
            fd=-1,
            family=socket.AF_INET6,
            type=socket.SOCK_STREAM,
            laddr=MockAddr(ip="::", port=443),
            raddr=(),
            status="LISTEN",
            pid=5678,
        ),
        MockConn(
            fd=-1,
            family=socket.AF_INET,
            type=socket.SOCK_DGRAM,
            laddr=MockAddr(ip="0.0.0.0", port=53),
            raddr=(),
            status="NONE",
            pid=9999,
        ),
    ]

    def _mock_net_connections(kind: str = "all") -> list[MockConn]:
        return mock_conns

    class MockProcess:
        def __init__(self, pid: int = 1):
            self.pid = pid
            self.info = {"pid": pid, "name": "python.exe", "status": "running"}
        def name(self) -> str:
            return "python.exe"
        def cpu_percent(self, *args, **kwargs) -> float:
            return 1.2
        def memory_percent(self, *args, **kwargs) -> float:
            return 2.5
        def memory_info(self):
            info = namedtuple("pmem", ["rss", "vms"])
            return info(rss=50 * 1024 * 1024, vms=100 * 1024 * 1024)
        def create_time(self) -> float:
            return 1700000000.0
        def status(self) -> str:
            return "running"
        def exe(self) -> str:
            return "C:\\python.exe"
        def cmdline(self) -> list[str]:
            return ["python", "app.py"]
        def net_connections(self, kind: str = "all") -> list[MockConn]:
            return mock_conns

    def _mock_process(pid: int = 1):
        if pid == 999999999:
            raise psutil.NoSuchProcess(pid)
        return MockProcess(pid)

    def _mock_process_iter(attrs=None):
        return [MockProcess(1234), MockProcess(5678)]

    monkeypatch.setattr(psutil, "net_connections", _mock_net_connections)
    monkeypatch.setattr(psutil, "Process", _mock_process)
    monkeypatch.setattr(psutil, "process_iter", _mock_process_iter)
    return mock_conns


@pytest.fixture
async def app_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Async HTTP client fixture configured for testing against the FastAPI application."""
    await network_monitor.start()

    transport_kwargs: dict[str, Any] = {}
    if hasattr(httpx, "ASGITransport"):
        transport_kwargs["transport"] = httpx.ASGITransport(app=app)
    else:
        transport_kwargs["app"] = app

    async with httpx.AsyncClient(**transport_kwargs, base_url="http://testserver") as client:
        yield client

    await network_monitor.stop()
