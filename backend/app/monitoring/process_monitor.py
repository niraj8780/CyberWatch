"""Process monitoring service for inspecting system processes and correlated network sockets."""

import asyncio
from collections import defaultdict
from datetime import datetime, timezone
import socket
from typing import Any

import psutil
import structlog

from app.monitoring.network_monitor import network_monitor

logger = structlog.get_logger(__name__)


class ProcessMonitor:
    """Monitors system processes with real-time network connection mapping."""

    async def get_processes(
        self,
        name_filter: str | None = None,
        has_connections: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """Retrieve system processes filtered by name and connection activity."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            self._get_processes_sync,
            name_filter,
            has_connections,
            limit,
            offset,
        )

    def _get_processes_sync(
        self,
        name_filter: str | None,
        has_connections: bool,
        limit: int,
        offset: int,
    ) -> tuple[list[dict[str, Any]], int]:
        """Synchronously scan processes and correlate with cached connections."""
        pid_connections: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for conn in network_monitor._connections:
            pid = conn.get("pid")
            if pid:
                pid_connections[pid].append(
                    {
                        "local_ip": conn.get("local_ip"),
                        "local_port": conn.get("local_port"),
                        "remote_ip": conn.get("remote_ip"),
                        "remote_port": conn.get("remote_port"),
                        "protocol": conn.get("protocol", "tcp"),
                        "status": conn.get("status", "NONE"),
                    }
                )

        processes: list[dict[str, Any]] = []
        filter_str = name_filter.strip().lower() if name_filter else None

        for proc in psutil.process_iter(["pid", "name", "status"]):
            try:
                info = proc.info
                pid = info.get("pid")
                if pid is None:
                    continue

                name = info.get("name") or "Unknown"
                status = info.get("status") or "unknown"
                conns = pid_connections.get(pid, [])

                if has_connections and len(conns) == 0:
                    continue

                if filter_str and filter_str not in name.lower():
                    continue

                processes.append(
                    {
                        "pid": pid,
                        "name": name,
                        "status": status,
                        "connections_count": len(conns),
                        "connections": conns,
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            except Exception as exc:
                logger.debug("error_iterating_process", error=str(exc))
                continue

        total = len(processes)
        paginated = processes[offset : offset + limit]
        return paginated, total

    async def get_process_detail(self, pid: int) -> dict[str, Any] | None:
        """Retrieve detailed process statistics, metadata, and active connections."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._get_process_detail_sync, pid)

    def _get_process_detail_sync(self, pid: int) -> dict[str, Any] | None:
        """Synchronously retrieve detailed info for a single process with error handling."""
        try:
            proc = psutil.Process(pid)
        except (psutil.NoSuchProcess, ValueError):
            return None

        # Confirm existence
        try:
            proc_name = proc.name()
        except (psutil.NoSuchProcess, psutil.ZombieProcess):
            return None
        except psutil.AccessDenied:
            proc_name = "Unknown"

        # Safe status extraction
        try:
            status = proc.status()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            status = "unknown"

        # CPU percent
        try:
            cpu_percent = proc.cpu_percent(interval=0.0)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            cpu_percent = 0.0

        # Memory percent
        try:
            memory_percent = proc.memory_percent()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            memory_percent = 0.0

        # Memory RSS in MB
        try:
            mem_info = proc.memory_info()
            memory_rss_mb = round(mem_info.rss / (1024 * 1024), 2)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            memory_rss_mb = 0.0

        # Create time
        try:
            ctime = proc.create_time()
            create_time = datetime.fromtimestamp(ctime, tz=timezone.utc).isoformat()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            create_time = datetime.now(timezone.utc).isoformat()

        # Executable path
        try:
            exe = proc.exe()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            exe = None

        # Command line arguments
        try:
            cmdline = proc.cmdline()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            cmdline = []

        # Find connections for this process
        connections: list[dict[str, Any]] = []
        for conn in network_monitor._connections:
            if conn.get("pid") == pid:
                connections.append(
                    {
                        "local_ip": conn.get("local_ip"),
                        "local_port": conn.get("local_port"),
                        "remote_ip": conn.get("remote_ip"),
                        "remote_port": conn.get("remote_port"),
                        "protocol": conn.get("protocol", "tcp"),
                        "status": conn.get("status", "NONE"),
                    }
                )

        if not connections:
            try:
                proc_conns = proc.net_connections(kind="all")
                for pc in proc_conns:
                    lip = (
                        pc.laddr.ip
                        if pc.laddr and hasattr(pc.laddr, "ip")
                        else (pc.laddr[0] if pc.laddr else None)
                    )
                    lport = (
                        pc.laddr.port
                        if pc.laddr and hasattr(pc.laddr, "port")
                        else (pc.laddr[1] if pc.laddr else None)
                    )
                    rip = (
                        pc.raddr.ip
                        if pc.raddr and hasattr(pc.raddr, "ip")
                        else (pc.raddr[0] if pc.raddr else None)
                    )
                    rport = (
                        pc.raddr.port
                        if pc.raddr and hasattr(pc.raddr, "port")
                        else (pc.raddr[1] if pc.raddr else None)
                    )
                    proto = (
                        "tcp"
                        if getattr(pc, "type", None) == socket.SOCK_STREAM
                        else "udp"
                    )
                    st = getattr(pc, "status", "NONE") or "NONE"
                    connections.append(
                        {
                            "local_ip": lip,
                            "local_port": lport,
                            "remote_ip": rip,
                            "remote_port": rport,
                            "protocol": proto,
                            "status": st,
                        }
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess, Exception):
                pass

        return {
            "pid": pid,
            "name": proc_name,
            "status": status,
            "cpu_percent": float(cpu_percent),
            "memory_percent": float(memory_percent),
            "memory_rss_mb": float(memory_rss_mb),
            "create_time": create_time,
            "exe": exe,
            "cmdline": cmdline,
            "connections": connections,
        }


# Module-level singleton
process_monitor = ProcessMonitor()
