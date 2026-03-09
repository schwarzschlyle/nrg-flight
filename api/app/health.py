from __future__ import annotations

import asyncio
import os
import shutil
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text

from app.core.db import engine


APP_START_MONOTONIC = time.monotonic()


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def app_uptime_seconds() -> float:
    return max(0.0, time.monotonic() - APP_START_MONOTONIC)


def _parse_meminfo_kb(meminfo_text: str) -> dict[str, int]:
    """Parse `/proc/meminfo` into a map of key->kB."""

    out: dict[str, int] = {}
    for raw in meminfo_text.splitlines():
        if not raw.strip():
            continue
        key, rest = raw.split(":", 1)
        parts = rest.strip().split()
        if not parts:
            continue
        # Example: "MemTotal:       16384256 kB"
        out[key] = int(parts[0])
    return out


def get_memory_metrics() -> dict[str, Any]:
    """Best-effort memory metrics.

    Uses `/proc/meminfo` which is available on Linux hosts/containers.
    """

    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as f:
            info = _parse_meminfo_kb(f.read())
    except OSError:  # pragma: no cover
        return {"total_bytes": None, "available_bytes": None, "used_bytes": None, "used_percent": None}

    total = int(info.get("MemTotal", 0)) * 1024
    available = int(info.get("MemAvailable", 0)) * 1024
    used = max(0, total - available)
    used_percent = round((used / total) * 100, 2) if total else None
    return {
        "total_bytes": total or None,
        "available_bytes": available or None,
        "used_bytes": used or None,
        "used_percent": used_percent,
    }


def get_disk_metrics(path: str = "/") -> dict[str, Any]:
    usage = shutil.disk_usage(path)
    used_percent = round((usage.used / usage.total) * 100, 2) if usage.total else None
    return {
        "path": path,
        "total_bytes": usage.total,
        "used_bytes": usage.used,
        "free_bytes": usage.free,
        "used_percent": used_percent,
    }


def get_load_average() -> dict[str, float] | None:
    # os.getloadavg is available on Unix.
    try:
        one, five, fifteen = os.getloadavg()
    except (AttributeError, OSError):  # pragma: no cover
        return None
    return {"1m": float(one), "5m": float(five), "15m": float(fifteen)}


def get_system_uptime_seconds() -> float | None:
    try:
        with open("/proc/uptime", "r", encoding="utf-8") as f:
            first = f.read().strip().split()[0]
            return float(first)
    except (OSError, ValueError, IndexError):  # pragma: no cover
        return None


def get_process_rss_bytes() -> int | None:
    """Resident memory of the current process.

    Uses `/proc/self/statm` on Linux.
    """

    try:
        with open("/proc/self/statm", "r", encoding="utf-8") as f:
            parts = f.read().strip().split()
            if len(parts) < 2:
                return None
            resident_pages = int(parts[1])
        page_size = os.sysconf("SC_PAGE_SIZE")
        return resident_pages * int(page_size)
    except (OSError, ValueError):  # pragma: no cover
        return None


def get_open_fds_count() -> int | None:
    try:
        return len(os.listdir("/proc/self/fd"))
    except OSError:  # pragma: no cover
        return None


def get_system_metrics() -> dict[str, Any]:
    return {
        "hostname": os.uname().nodename if hasattr(os, "uname") else None,  # pragma: no cover
        "cpu_count": os.cpu_count(),
        "load_average": get_load_average(),
        "uptime_seconds": get_system_uptime_seconds(),
        "memory": get_memory_metrics(),
        "disk": get_disk_metrics("/"),
    }


def get_process_metrics() -> dict[str, Any]:
    return {
        "pid": os.getpid(),
        "uptime_seconds": round(app_uptime_seconds(), 3),
        "rss_bytes": get_process_rss_bytes(),
        "open_fds": get_open_fds_count(),
    }


async def check_database(*, timeout_seconds: float = 1.0) -> dict[str, Any]:
    """Readiness check: DB connectivity + basic query.

    Returns a dict that can be embedded into a health response.
    """

    start = time.perf_counter()

    async def _ping() -> None:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    try:
        await asyncio.wait_for(_ping(), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        return {
            "status": "error",
            "latency_ms": round((time.perf_counter() - start) * 1000, 2),
            "error": "TimeoutError",
        }
    except Exception as exc:
        return {
            "status": "error",
            "latency_ms": round((time.perf_counter() - start) * 1000, 2),
            "error": type(exc).__name__,
        }

    return {"status": "ok", "latency_ms": round((time.perf_counter() - start) * 1000, 2)}


async def build_health_payload() -> dict[str, Any]:
    db = await check_database()
    overall = "ok" if db["status"] == "ok" else "error"
    return {
        "status": overall,
        "time": {"utc": utcnow_iso()},
        "system": get_system_metrics(),
        "process": get_process_metrics(),
        "checks": {"database": db},
    }
