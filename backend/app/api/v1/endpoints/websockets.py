"""WebSocket endpoint for real-time network telemetry streaming."""

import asyncio
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

from app.monitoring.network_monitor import network_monitor
from app.websockets.manager import ws_manager

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.websocket("/ws/network")
@router.websocket("/ws/live")
async def websocket_network_stream(websocket: WebSocket) -> None:
    """Stream real-time network connections, statistics, and delta updates to subscribed clients."""
    await ws_manager.connect(websocket)
    
    try:
        # Send initial snapshot upon successful handshake
        stats = await network_monitor.get_statistics()
        conns, total = await network_monitor.get_connections(limit=30)
        recent_events = await network_monitor.get_recent_events(limit=20)
        
        snapshot_payload = {
            "type": "snapshot",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "statistics": stats,
                "connections": conns,
                "total_connections": total,
                "recent_events": recent_events,
            },
        }
        await websocket.send_json(snapshot_payload)

        # Maintain connection and listen for client messages (e.g., ping/pong or filter requests)
        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action", "")

                if action == "ping":
                    # Respond with pong and current server timestamp for latency calculation
                    await websocket.send_json(
                        {
                            "type": "pong",
                            "client_time": data.get("timestamp"),
                            "server_time": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                elif action == "get_snapshot":
                    current_stats = await network_monitor.get_statistics()
                    current_conns, total_c = await network_monitor.get_connections(limit=50)
                    events = await network_monitor.get_recent_events(limit=20)
                    await websocket.send_json(
                        {
                            "type": "snapshot",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "data": {
                                "statistics": current_stats,
                                "connections": current_conns,
                                "total_connections": total_c,
                                "recent_events": events,
                            },
                        }
                    )
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.debug("websocket_receive_message_error", error=str(e))
                break
    except WebSocketDisconnect:
        logger.info("websocket_client_disconnected_normal")
    except Exception as exc:
        logger.warning("websocket_session_error", error=str(exc))
    finally:
        await ws_manager.disconnect(websocket)


@router.get("/ws/status", tags=["WebSockets"])
async def get_websocket_status() -> dict[str, Any]:
    """Retrieve current WebSocket manager status and client count."""
    return {
        "active_clients": ws_manager.active_connections_count,
        "monitoring_active": network_monitor.is_running,
        "last_scan_time": (
            network_monitor.last_scan_time.isoformat()
            if network_monitor.last_scan_time
            else None
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/events", tags=["Network"])
async def get_recent_network_events(limit: int = 50) -> dict[str, Any]:
    """Retrieve recent connection/disconnection events recorded by the monitor."""
    events = await network_monitor.get_recent_events(limit=limit)
    return {
        "total": len(events),
        "events": events,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
