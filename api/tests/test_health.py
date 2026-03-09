from __future__ import annotations

import asyncio
import io
from collections import namedtuple

import pytest

import app.health as health


def test_parse_meminfo_kb_handles_blank_and_empty_lines():
    sample = """MemTotal: 1000 kB

Empty:
MemAvailable: 250 kB
"""
    assert health._parse_meminfo_kb(sample) == {"MemTotal": 1000, "MemAvailable": 250}


def test_get_memory_metrics_happy_path(monkeypatch):
    sample = "MemTotal: 1000 kB\nMemAvailable: 250 kB\n"
    monkeypatch.setattr(health, "open", lambda *args, **kwargs: io.StringIO(sample))
    m = health.get_memory_metrics()
    assert m["total_bytes"] == 1000 * 1024
    assert m["available_bytes"] == 250 * 1024
    assert m["used_bytes"] == 750 * 1024
    assert m["used_percent"] == 75.0


def test_get_memory_metrics_oserror(monkeypatch):
    def _raise(*_args, **_kwargs):
        raise OSError("no proc")

    monkeypatch.setattr(health, "open", _raise)
    assert health.get_memory_metrics() == {
        "total_bytes": None,
        "available_bytes": None,
        "used_bytes": None,
        "used_percent": None,
    }


def test_get_disk_metrics(monkeypatch):
    DiskUsage = namedtuple("DiskUsage", "total used free")
    monkeypatch.setattr(
        health.shutil,
        "disk_usage",
        lambda _path: DiskUsage(total=100, used=40, free=60),
    )

    d = health.get_disk_metrics("/")
    assert d["path"] == "/"
    assert d["total_bytes"] == 100
    assert d["used_bytes"] == 40
    assert d["free_bytes"] == 60
    assert d["used_percent"] == 40.0


def test_get_load_average_happy_path(monkeypatch):
    monkeypatch.setattr(health.os, "getloadavg", lambda: (1.0, 2.0, 3.0))
    assert health.get_load_average() == {"1m": 1.0, "5m": 2.0, "15m": 3.0}


def test_get_load_average_error(monkeypatch):
    def _boom():
        raise OSError("no load")

    monkeypatch.setattr(health.os, "getloadavg", _boom)
    assert health.get_load_average() is None


def test_get_system_uptime_seconds_happy_path(monkeypatch):
    monkeypatch.setattr(health, "open", lambda *args, **kwargs: io.StringIO("123.45 0.00\n"))
    assert health.get_system_uptime_seconds() == 123.45


def test_get_system_uptime_seconds_error(monkeypatch):
    def _raise(*_args, **_kwargs):
        raise OSError("no uptime")

    monkeypatch.setattr(health, "open", _raise)
    assert health.get_system_uptime_seconds() is None


def test_get_process_rss_bytes_happy_path(monkeypatch):
    monkeypatch.setattr(health, "open", lambda *args, **kwargs: io.StringIO("100 2 0 0 0 0 0\n"))
    monkeypatch.setattr(health.os, "sysconf", lambda _name: 4096)
    assert health.get_process_rss_bytes() == 8192


def test_get_process_rss_bytes_missing_resident_pages(monkeypatch):
    monkeypatch.setattr(health, "open", lambda *args, **kwargs: io.StringIO("100\n"))
    assert health.get_process_rss_bytes() is None


def test_get_process_rss_bytes_value_error(monkeypatch):
    monkeypatch.setattr(health, "open", lambda *args, **kwargs: io.StringIO("100 x\n"))
    assert health.get_process_rss_bytes() is None


def test_get_open_fds_count_happy_path(monkeypatch):
    monkeypatch.setattr(health.os, "listdir", lambda _path: ["0", "1", "2"])
    assert health.get_open_fds_count() == 3


def test_get_open_fds_count_error(monkeypatch):
    def _boom(_path: str):
        raise OSError("no fd")

    monkeypatch.setattr(health.os, "listdir", _boom)
    assert health.get_open_fds_count() is None


@pytest.mark.asyncio
async def test_check_database_ok_monkeypatched(monkeypatch):
    class _Conn:
        async def execute(self, _stmt):
            return None

    class _Ctx:
        async def __aenter__(self):
            return _Conn()

        async def __aexit__(self, _exc_type, _exc, _tb):
            return False

    class _Engine:
        def connect(self):
            return _Ctx()

    monkeypatch.setattr(health, "engine", _Engine())
    out = await health.check_database(timeout_seconds=0.1)
    assert out["status"] == "ok"
    assert isinstance(out["latency_ms"], float)


@pytest.mark.asyncio
async def test_check_database_exception(monkeypatch):
    class _Conn:
        async def execute(self, _stmt):
            raise RuntimeError("boom")

    class _Ctx:
        async def __aenter__(self):
            return _Conn()

        async def __aexit__(self, _exc_type, _exc, _tb):
            return False

    class _Engine:
        def connect(self):
            return _Ctx()

    monkeypatch.setattr(health, "engine", _Engine())
    out = await health.check_database(timeout_seconds=0.1)
    assert out["status"] == "error"
    assert out["error"] == "RuntimeError"


@pytest.mark.asyncio
async def test_check_database_timeout(monkeypatch):
    class _Conn:
        async def execute(self, _stmt):
            await asyncio.sleep(0.01)

    class _Ctx:
        async def __aenter__(self):
            return _Conn()

        async def __aexit__(self, _exc_type, _exc, _tb):
            return False

    class _Engine:
        def connect(self):
            return _Ctx()

    monkeypatch.setattr(health, "engine", _Engine())
    out = await health.check_database(timeout_seconds=0.001)
    assert out["status"] == "error"
    assert out["error"] == "TimeoutError"


@pytest.mark.asyncio
async def test_build_health_payload_error_when_db_error(monkeypatch):
    async def _fake_check_database(*, timeout_seconds: float = 1.0):
        return {"status": "error", "latency_ms": 0.01, "error": "Boom"}

    monkeypatch.setattr(health, "check_database", _fake_check_database)
    payload = await health.build_health_payload()
    assert payload["status"] == "error"
    assert payload["checks"]["database"]["status"] == "error"
