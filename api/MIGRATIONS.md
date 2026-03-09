# Alembic migrations (production workflow)

This project uses **Alembic** to manage schema changes.

## 1) Configure environment

Set `DATABASE_URL` in `api/.env`.

Neon provides URLs like:

```text
postgresql://user:pass@host/db?sslmode=require
```

Important notes:

- **Do not wrap** the URL in single-quotes in `.env`. Use:

  ```dotenv
  DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
  ```

  not:

  ```dotenv
  DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'
  ```

- Our async SQLAlchemy setup strips libpq-only params like `sslmode`/`channel_binding`
  and converts them into asyncpg-compatible `connect_args`.

- Alembic must connect with the **real password**. Internally we use
  `URL.render_as_string(hide_password=False)` for online migrations because
  `str(URL)` masks passwords (replaces them with `***`).

The app automatically normalizes `postgresql://` to `postgresql+asyncpg://` for runtime.

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
