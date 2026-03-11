# Docker (reviewer-friendly)

This repo publishes pre-built images to **GitHub Container Registry (GHCR)**.

## Quick start (no local builds)

1) Clone:

```bash
git clone https://github.com/schwarzschlyle/nrg-flight.git
cd nrg-flight
```

2) Add env files

- `api/.env`
- `ai-service/.env`
- `client/.env`

Templates exist:

```bash
cp api/.env.example api/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

3) Run:

```bash
docker compose up
```

If your Docker Compose version doesn’t support `pull_policy: always`, run:

```bash
docker compose pull
docker compose up
```

## URLs

- Client: http://localhost:5173
- API: http://localhost:8000/health and http://localhost:8000/docs
- AI service: http://localhost:3000/health

## Notes

- The Python services mount their `.env` files into `/app/.env` so that **quoted values**
  (e.g. `DATABASE_URL='postgresql://...'`) are parsed correctly by pydantic-settings.
- `ai-service` will **start even without** `OPENAI_API_KEY`, but the chat endpoint will return
  a clear “disabled” response until you set the key and restart.

## Local development (build images locally)

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```
