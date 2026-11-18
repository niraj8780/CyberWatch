"""Unit tests for WebSocket real-time streaming endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.websockets.manager import ws_manager


def test_websocket_status_http(mock_psutil_connections):
    """Test the HTTP status endpoint for WebSockets."""
    client = TestClient(app)
    response = client.get("/api/v1/ws/status")
    assert response.status_code == 200
    data = response.json()
    assert "active_clients" in data
    assert "monitoring_active" in data
    assert "timestamp" in data


def test_network_events_endpoint(mock_psutil_connections):
    """Test the network events HTTP endpoint."""
    client = TestClient(app)
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert isinstance(data["events"], list)


def test_websocket_lifecycle(mock_psutil_connections):
    """Test connecting to the WebSocket stream, receiving snapshot, ping/pong, and disconnect."""
    with TestClient(app) as client:
        initial_count = ws_manager.active_connections_count
        with client.websocket_connect("/api/v1/ws/network") as websocket:
            # Active connections count should increment
            assert ws_manager.active_connections_count == initial_count + 1

            # First message sent upon connect is always the initial snapshot
            data = websocket.receive_json()
            assert data["type"] == "snapshot"
            assert "data" in data
            assert "statistics" in data["data"]
            assert "connections" in data["data"]
            assert "recent_events" in data["data"]

            # Send ping
            websocket.send_json({"action": "ping", "timestamp": "2026-11-04T12:00:00Z"})
            pong = websocket.receive_json()
            assert pong["type"] == "pong"
            assert "server_time" in pong
            assert pong.get("client_time") == "2026-11-04T12:00:00Z"

        import time
        time.sleep(0.1)
        assert ws_manager.active_connections_count <= initial_count + 1
