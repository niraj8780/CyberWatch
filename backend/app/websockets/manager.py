"""WebSocket connection manager for handling real-time client subscriptions."""

import asyncio
from datetime import datetime, timezone
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections and broadcasting."""

    def __init__(self) -> None:
        self._active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    @property
    def active_connections_count(self) -> int:
        """Return the number of currently active WebSocket clients."""
        return len(self._active_connections)

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection and add it to the active pool."""
        await websocket.accept()
        async with self._lock:
            self._active_connections.append(websocket)
        logger.info(
            "websocket_client_connected",
            client=websocket.client.host if websocket.client else "unknown",
            total_active=len(self._active_connections),
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket from the pool."""
        async with self._lock:
            if websocket in self._active_connections:
                self._active_connections.remove(websocket)
        logger.info(
            "websocket_client_disconnected",
            total_active=len(self._active_connections),
        )

    async def send_json(self, websocket: WebSocket, data: dict[str, Any]) -> bool:
        """Send a JSON payload to a single WebSocket client safely."""
        try:
            await websocket.send_json(data)
            return True
        except Exception as exc:
            logger.debug("websocket_send_failed", error=str(exc))
            await self.disconnect(websocket)
            return False

    async def broadcast(self, data: dict[str, Any]) -> int:
        """Broadcast JSON payload to all active clients.
        
        Removes dead connections automatically. Returns count of successful deliveries.
        """
        async with self._lock:
            targets = list(self._active_connections)

        if not targets:
            return 0

        dead_connections: list[WebSocket] = []
        sent_count = 0

        for ws in targets:
            try:
                await ws.send_json(data)
                sent_count += 1
            except Exception:
                dead_connections.append(ws)

        if dead_connections:
            async with self._lock:
                for dead_ws in dead_connections:
                    if dead_ws in self._active_connections:
                        self._active_connections.remove(dead_ws)
            logger.info("cleaned_dead_websocket_connections", count=len(dead_connections))

        return sent_count


# Global singleton instance
ws_manager = ConnectionManager()
