"""Unit tests for the NetworkMonitor service."""

from collections import namedtuple
from datetime import datetime, timezone
import socket
from typing import Any
import psutil
import pytest

from app.monitoring.network_monitor import NetworkMonitor

MockAddr = namedtuple("MockAddr", ["ip", "port"])
MockConn = namedtuple("MockConn", ["fd", "family", "type", "laddr", "raddr", "status", "pid"])


def test_parse_tcp_connection() -> None:
    """Test parsing a standard IPv4 TCP established connection."""
    monitor = NetworkMonitor()
    conn = MockConn(
        fd=1,
        family=socket.AF_INET,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="192.168.1.100", port=50000),
        raddr=MockAddr(ip="93.184.216.34", port=443),
        status="ESTABLISHED",
        pid=None,
    )

    parsed = monitor._parse_connection(conn)
    assert parsed is not None
    assert parsed["protocol"] == "tcp"
    assert parsed["ip_version"] == "IPv4"
    assert parsed["local_ip"] == "192.168.1.100"
    assert parsed["local_port"] == 50000
    assert parsed["remote_ip"] == "93.184.216.34"
    assert parsed["remote_port"] == 443
    assert parsed["status"] == "ESTABLISHED"
    assert parsed["pid"] is None
    assert parsed["process_name"] is None


def test_parse_udp_connection() -> None:
    """Test parsing an IPv4 UDP socket without remote address."""
    monitor = NetworkMonitor()
    conn = MockConn(
        fd=2,
        family=socket.AF_INET,
        type=socket.SOCK_DGRAM,
        laddr=MockAddr(ip="0.0.0.0", port=53),
        raddr=(),
        status="NONE",
        pid=None,
    )

    parsed = monitor._parse_connection(conn)
    assert parsed is not None
    assert parsed["protocol"] == "udp"
    assert parsed["ip_version"] == "IPv4"
    assert parsed["local_ip"] == "0.0.0.0"
    assert parsed["local_port"] == 53
    assert parsed["remote_ip"] is None
    assert parsed["remote_port"] is None
    assert parsed["status"] == "NONE"


def test_parse_ipv6_connection() -> None:
    """Test parsing an IPv6 TCP listening socket."""
    monitor = NetworkMonitor()
    conn = MockConn(
        fd=3,
        family=socket.AF_INET6,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="::1", port=8080),
        raddr=None,
        status="LISTEN",
        pid=None,
    )

    parsed = monitor._parse_connection(conn)
    assert parsed is not None
    assert parsed["protocol"] == "tcp"
    assert parsed["ip_version"] == "IPv6"
    assert parsed["local_ip"] == "::1"
    assert parsed["local_port"] == 8080
    assert parsed["remote_ip"] is None
    assert parsed["remote_port"] is None
    assert parsed["status"] == "LISTEN"


def test_handle_missing_remote_address() -> None:
    """Ensure missing remote address (empty tuple or None) is handled cleanly."""
    monitor = NetworkMonitor()

    conn_empty_tuple = MockConn(
        fd=4,
        family=socket.AF_INET,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="127.0.0.1", port=3000),
        raddr=(),
        status="LISTEN",
        pid=None,
    )
    parsed = monitor._parse_connection(conn_empty_tuple)
    assert parsed is not None
    assert parsed["remote_ip"] is None
    assert parsed["remote_port"] is None

    conn_none_raddr = MockConn(
        fd=5,
        family=socket.AF_INET,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="127.0.0.1", port=3000),
        raddr=None,
        status="LISTEN",
        pid=None,
    )
    parsed_none = monitor._parse_connection(conn_none_raddr)
    assert parsed_none is not None
    assert parsed_none["remote_ip"] is None
    assert parsed_none["remote_port"] is None


def test_handle_access_denied(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test fallback to kind='inet' when psutil.net_connections(kind='all') raises AccessDenied."""
    monitor = NetworkMonitor()

    fallback_conn = MockConn(
        fd=10,
        family=socket.AF_INET,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="127.0.0.1", port=80),
        raddr=(),
        status="LISTEN",
        pid=None,
    )

    def mock_net_connections(kind: str = "all") -> list[MockConn]:
        if kind == "all":
            raise psutil.AccessDenied()
        elif kind == "inet":
            return [fallback_conn]
        return []

    monkeypatch.setattr(psutil, "net_connections", mock_net_connections)

    results = monitor._get_connections_sync()
    assert len(results) == 1
    assert results[0]["local_port"] == 80
    assert results[0]["protocol"] == "tcp"


def test_handle_no_such_process(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure NoSuchProcess gracefully falls back to process_name='Unknown'."""
    monitor = NetworkMonitor()

    conn = MockConn(
        fd=11,
        family=socket.AF_INET,
        type=socket.SOCK_STREAM,
        laddr=MockAddr(ip="127.0.0.1", port=4444),
        raddr=(),
        status="LISTEN",
        pid=88888,
    )

    def mock_process(pid: int) -> Any:
        raise psutil.NoSuchProcess(pid)

    monkeypatch.setattr(psutil, "Process", mock_process)

    parsed = monitor._parse_connection(conn)
    assert parsed is not None
    assert parsed["pid"] == 88888
    assert parsed["process_name"] == "Unknown"


@pytest.mark.asyncio
async def test_get_statistics(sample_connection_data: list[dict[str, Any]]) -> None:
    """Test statistics aggregation based on active connections."""
    monitor = NetworkMonitor()
    monitor._connections = sample_connection_data
    monitor._last_scan_time = datetime.now(timezone.utc)

    stats = await monitor.get_statistics()
    assert stats["total_connections"] == 5
    assert stats["tcp_connections"] == 3
    assert stats["udp_connections"] == 2
    assert stats["ipv4_connections"] == 3
    assert stats["ipv6_connections"] == 2
    assert stats["listening_ports"] == 2
    assert stats["established"] == 1
    assert stats["states"]["LISTEN"] == 2
    assert stats["states"]["ESTABLISHED"] == 1
    assert stats["states"]["NONE"] == 2
    assert "timestamp" in stats


@pytest.mark.asyncio
async def test_get_listening_ports(sample_connection_data: list[dict[str, Any]]) -> None:
    """Test filtering listening sockets."""
    monitor = NetworkMonitor()
    monitor._connections = sample_connection_data
    monitor._last_scan_time = datetime.now(timezone.utc)

    ports = await monitor.get_listening_ports()
    assert len(ports) == 2
    port_numbers = {p["port"] for p in ports}
    assert 80 in port_numbers
    assert 443 in port_numbers


@pytest.mark.asyncio
async def test_connection_filtering(sample_connection_data: list[dict[str, Any]]) -> None:
    """Test filtering by protocol, status, process_name, and pagination."""
    monitor = NetworkMonitor()
    monitor._connections = sample_connection_data
    monitor._last_scan_time = datetime.now(timezone.utc)

    # Filter by protocol
    tcp_conns, total_tcp = await monitor.get_connections(protocol="tcp")
    assert total_tcp == 3
    assert len(tcp_conns) == 3

    udp_conns, total_udp = await monitor.get_connections(protocol="udp")
    assert total_udp == 2
    assert len(udp_conns) == 2

    # Filter by status
    est_conns, total_est = await monitor.get_connections(status="ESTABLISHED")
    assert total_est == 1
    assert len(est_conns) == 1
    assert est_conns[0]["status"] == "ESTABLISHED"

    # Filter by process name
    python_conns, total_py = await monitor.get_connections(process_name="python")
    assert total_py == 2
    assert len(python_conns) == 2

    # Pagination
    page_1, total_all = await monitor.get_connections(limit=2, offset=0)
    assert total_all == 5
    assert len(page_1) == 2

    page_2, total_all_2 = await monitor.get_connections(limit=2, offset=2)
    assert total_all_2 == 5
    assert len(page_2) == 2
    assert page_1[0] != page_2[0]
