"""Network monitoring service utilizing psutil for real system network inspection."""

import asyncio
from datetime import datetime, timezone
import socket
from typing import Any

import psutil
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class NetworkMonitor:
    """Collects real network connection data using psutil."""

    def __init__(self, interval: float | None = None, max_history: int | None = None) -> None:
        settings = get_settings()
        self._interval = interval if interval is not None else settings.MONITOR_INTERVAL_SECONDS
        self._max_history = max_history if max_history is not None else settings.MAX_CONNECTIONS_HISTORY
        self._running = False
        self._connections: list[dict[str, Any]] = []
        self._last_scan_time: datetime | None = None
        self._lock = asyncio.Lock()
        self._task: asyncio.Task[None] | None = None

    @property
    def is_running(self) -> bool:
        """Indicate whether the background monitoring task is currently active."""
        return self._running

    @property
    def last_scan_time(self) -> datetime | None:
        """Timestamp of the most recent network scan."""
        return self._last_scan_time

    async def start(self) -> None:
        """Start the background monitoring loop and perform an initial collection."""
        if self._running:
            return

        self._running = True
        logger.info("starting_network_monitor", interval=self._interval)
        # Perform an initial collection synchronously in executor so connections are immediately populated
        try:
            await self._collect_connections()
        except Exception as e:
            logger.warning("initial_network_collection_error", error=str(e))

        self._task = asyncio.create_task(self._monitor_loop())

    async def stop(self) -> None:
        """Stop the background monitoring loop cleanly."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except (asyncio.CancelledError, Exception):
                pass
            self._task = None
        logger.info("stopped_network_monitor")

    async def _monitor_loop(self) -> None:
        """Loop periodically polling system network connections."""
        while self._running:
            try:
                await asyncio.sleep(self._interval)
                if not self._running:
                    break
                await self._collect_connections()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("network_monitor_loop_iteration_failed", error=str(e))

    async def _collect_connections(self) -> None:
        """Collect all active network connections asynchronously via thread executor."""
        loop = asyncio.get_running_loop()
        connections = await loop.run_in_executor(None, self._get_connections_sync)
        async with self._lock:
            self._connections = connections[: self._max_history]
            self._last_scan_time = datetime.now(timezone.utc)
        logger.debug("network_connections_collected", count=len(connections))

    def _get_connections_sync(self) -> list[dict[str, Any]]:
        """Synchronous connection collection with full error and permission handling."""
        results: list[dict[str, Any]] = []
        connections = []

        try:
            connections = psutil.net_connections(kind="all")
        except (psutil.AccessDenied, PermissionError):
            logger.warning("access_denied_kind_all_falling_back_to_inet")
            try:
                connections = psutil.net_connections(kind="inet")
            except (psutil.AccessDenied, PermissionError, Exception) as inner_exc:
                logger.error("failed_to_retrieve_inet_connections", error=str(inner_exc))
                return []
        except Exception as exc:
            logger.error("unexpected_error_retrieving_connections", error=str(exc))
            return []

        for conn in connections:
            try:
                entry = self._parse_connection(conn)
                if entry:
                    results.append(entry)
            except Exception as parse_exc:
                logger.debug("failed_to_parse_connection", error=str(parse_exc))
                continue

        return results

    def _parse_connection(self, conn: Any) -> dict[str, Any] | None:
        """Parse a single psutil connection into a standardized dictionary."""
        # Extract local address (handle empty, tuple, or namedtuple)
        local_ip: str | None = None
        local_port: int | None = None
        if conn.laddr:
            if hasattr(conn.laddr, "ip"):
                local_ip = conn.laddr.ip
                local_port = getattr(conn.laddr, "port", None)
            elif isinstance(conn.laddr, (tuple, list)) and len(conn.laddr) >= 2:
                local_ip = str(conn.laddr[0])
                local_port = int(conn.laddr[1])

        # Extract remote address (handle empty for listening/UDP)
        remote_ip: str | None = None
        remote_port: int | None = None
        if conn.raddr:
            if hasattr(conn.raddr, "ip"):
                remote_ip = conn.raddr.ip
                remote_port = getattr(conn.raddr, "port", None)
            elif isinstance(conn.raddr, (tuple, list)) and len(conn.raddr) >= 2:
                remote_ip = str(conn.raddr[0])
                remote_port = int(conn.raddr[1])

        # Determine protocol
        protocol = "tcp" if getattr(conn, "type", None) == socket.SOCK_STREAM else "udp"

        # Determine IP version
        ip_version = "IPv6" if getattr(conn, "family", None) == socket.AF_INET6 else "IPv4"

        # Extract status safely
        status = getattr(conn, "status", "NONE")
        if not status:
            status = "NONE"

        # Get process info safely
        process_name: str | None = None
        process_pid: int | None = getattr(conn, "pid", None)
        if process_pid:
            try:
                proc = psutil.Process(process_pid)
                process_name = proc.name()
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                process_name = "Unknown"
            except Exception:
                process_name = "Unknown"

        return {
            "local_ip": local_ip,
            "local_port": local_port,
            "remote_ip": remote_ip,
            "remote_port": remote_port,
            "protocol": protocol,
            "ip_version": ip_version,
            "status": status,
            "pid": process_pid,
            "process_name": process_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def get_connections(
        self,
        protocol: str | None = None,
        status: str | None = None,
        process_name: str | None = None,
        limit: int = 500,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """Return filtered and paginated connections along with the total matched count."""
        if not self._connections and self._last_scan_time is None:
            await self._collect_connections()

        async with self._lock:
            items = list(self._connections)

        filtered = items

        if protocol:
            target_proto = protocol.strip().lower()
            filtered = [
                c for c in filtered if c.get("protocol", "").lower() == target_proto
            ]

        if status:
            target_status = status.strip().upper()
            filtered = [
                c for c in filtered if c.get("status", "").upper() == target_status
            ]

        if process_name:
            target_pname = process_name.strip().lower()
            filtered = [
                c
                for c in filtered
                if target_pname in (c.get("process_name") or "").lower()
            ]

        total = len(filtered)
        paginated = filtered[offset : offset + limit]
        return paginated, total

    async def get_statistics(self) -> dict[str, Any]:
        """Compute summary statistics for connections by protocol, family, and state."""
        if not self._connections and self._last_scan_time is None:
            await self._collect_connections()

        async with self._lock:
            items = list(self._connections)
            scan_time = self._last_scan_time

        states: dict[str, int] = {}
        tcp_count = 0
        udp_count = 0
        ipv4_count = 0
        ipv6_count = 0
        listening_ports = 0
        established = 0

        for conn in items:
            proto = conn.get("protocol", "").lower()
            if proto == "tcp":
                tcp_count += 1
            elif proto == "udp":
                udp_count += 1

            ip_ver = conn.get("ip_version", "IPv4")
            if ip_ver == "IPv6":
                ipv6_count += 1
            else:
                ipv4_count += 1

            st = (conn.get("status") or "NONE").upper()
            states[st] = states.get(st, 0) + 1

            if st == "LISTEN":
                listening_ports += 1
            elif st == "ESTABLISHED":
                established += 1

        ts = (
            scan_time.isoformat()
            if scan_time
            else datetime.now(timezone.utc).isoformat()
        )

        return {
            "total_connections": len(items),
            "tcp_connections": tcp_count,
            "udp_connections": udp_count,
            "ipv4_connections": ipv4_count,
            "ipv6_connections": ipv6_count,
            "listening_ports": listening_ports,
            "established": established,
            "states": states,
            "timestamp": ts,
        }

    async def get_listening_ports(self) -> list[dict[str, Any]]:
        """Return all sockets currently in LISTEN state."""
        if not self._connections and self._last_scan_time is None:
            await self._collect_connections()

        async with self._lock:
            items = list(self._connections)

        listening: list[dict[str, Any]] = []
        for conn in items:
            if conn.get("status", "").upper() == "LISTEN":
                listening.append(
                    {
                        "port": conn.get("local_port") or 0,
                        "protocol": conn.get("protocol", "tcp"),
                        "ip_version": conn.get("ip_version", "IPv4"),
                        "local_ip": conn.get("local_ip"),
                        "pid": conn.get("pid"),
                        "process_name": conn.get("process_name"),
                    }
                )

        return listening

    async def get_interfaces(self) -> list[dict[str, Any]]:
        """Retrieve real network interface details using psutil."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._get_interfaces_sync)

    def _get_interfaces_sync(self) -> list[dict[str, Any]]:
        """Synchronously query system interfaces and stats."""
        interfaces: list[dict[str, Any]] = []
        try:
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()
        except Exception as exc:
            logger.error("error_retrieving_interfaces", error=str(exc))
            return []

        for if_name, addr_list in addrs.items():
            parsed_addrs: list[dict[str, Any]] = []
            for addr in addr_list:
                family_str = "Unknown"
                if addr.family == socket.AF_INET:
                    family_str = "IPv4"
                elif addr.family == socket.AF_INET6:
                    family_str = "IPv6"
                elif hasattr(psutil, "AF_LINK") and addr.family == psutil.AF_LINK:
                    family_str = "MAC"

                parsed_addrs.append(
                    {
                        "family": family_str,
                        "address": addr.address,
                        "netmask": addr.netmask,
                        "broadcast": addr.broadcast,
                    }
                )

            stat = stats.get(if_name)
            interfaces.append(
                {
                    "name": if_name,
                    "addresses": parsed_addrs,
                    "is_up": stat.isup if stat else True,
                    "speed": stat.speed if stat else 0,
                    "mtu": stat.mtu if stat else 1500,
                }
            )

        return interfaces


# Module-level singleton
network_monitor = NetworkMonitor()
