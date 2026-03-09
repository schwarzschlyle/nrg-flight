from __future__ import annotations

import uuid

import pytest

from app.core.db import GUID


class _Dialect:
    def __init__(self, name: str):
        self.name = name

    def type_descriptor(self, t):
        # SQLAlchemy dialects return a compiled type; for this unit test we just return the object.
        return t


def test_guid_load_dialect_impl_sqlite():
    guid = GUID()
    dialect = _Dialect("sqlite")
    impl = guid.load_dialect_impl(dialect)
    # For non-postgres, we expect CHAR(36)
    assert impl.length == 36


def test_guid_load_dialect_impl_postgresql():
    guid = GUID()
    dialect = _Dialect("postgresql")
    impl = guid.load_dialect_impl(dialect)
    assert impl.as_uuid is True


def test_guid_process_bind_param_none():
    guid = GUID()
    dialect = _Dialect("sqlite")
    assert guid.process_bind_param(None, dialect) is None


def test_guid_process_bind_param_postgresql_passthrough():
    guid = GUID()
    dialect = _Dialect("postgresql")
    value = uuid.uuid4()
    assert guid.process_bind_param(value, dialect) == value


def test_guid_process_bind_param_non_uuid_string_to_uuid_string():
    guid = GUID()
    dialect = _Dialect("sqlite")
    value = str(uuid.uuid4())
    assert guid.process_bind_param(value, dialect) == value


def test_guid_process_result_value_none():
    guid = GUID()
    dialect = _Dialect("sqlite")
    assert guid.process_result_value(None, dialect) is None


def test_guid_process_result_value_uuid_passthrough():
    guid = GUID()
    dialect = _Dialect("sqlite")
    value = uuid.uuid4()
    assert guid.process_result_value(value, dialect) == value


def test_guid_process_result_value_string_to_uuid():
    guid = GUID()
    dialect = _Dialect("sqlite")
    value = str(uuid.uuid4())
    out = guid.process_result_value(value, dialect)
    assert isinstance(out, uuid.UUID)
    assert str(out) == value


def test_guid_process_bind_param_invalid_uuid_raises():
    guid = GUID()
    dialect = _Dialect("sqlite")
    with pytest.raises(ValueError):
        guid.process_bind_param("not-a-uuid", dialect)
