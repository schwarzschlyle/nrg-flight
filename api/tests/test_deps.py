from __future__ import annotations

import pytest
from sqlalchemy import text

from app.api.deps import get_db


@pytest.mark.asyncio
async def test_get_db_yields_session():
    agen = get_db()
    session = await agen.__anext__()
    try:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar_one() == 1
    finally:
        await agen.aclose()
