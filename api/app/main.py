from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.exceptions.handlers import register_exception_handlers
from app.health import build_health_payload


def create_app() -> FastAPI:
    app = FastAPI(title="NRG Flight API", version="1.0.0")

    register_exception_handlers(app)

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        """Liveness + readiness + machine metrics.

        This endpoint is intended for load balancers and monitoring.
        It reports:
        - system metrics (CPU count, load avg, disk/memory usage)
        - process metrics (pid, uptime, rss, open fds)
        - readiness checks (database)
        """

        return await build_health_payload()

    return app


app = create_app()
