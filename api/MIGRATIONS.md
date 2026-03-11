# Alembic migrations (production workflow)

This project uses **Alembic** to manage schema changes.

## 1) Configure environment

Set `DATABASE_URL` in `api/.env`.


## 2) Apply migrations

```bash
poetry run alembic upgrade head
```

## 3) Create a new migration

Prefer **autogenerate** for routine schema changes:

```bash
poetry run alembic revision --autogenerate -m "add something"
```

Then review the generated file under `app/alembic/versions/`.

## 4) Downgrade (development only)

```bash
poetry run alembic downgrade -1
```

## Best practices

- Keep migrations small and focused.
- Always review autogen output.
- Avoid destructive changes in production unless you have a rollback plan.
- Treat migrations as immutable once deployed.
