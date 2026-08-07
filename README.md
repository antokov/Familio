# Familio

Selbstgehostete Familien-App mit Kalender, Aufgaben und Einkaufslisten — läuft auf deinem eigenen NAS.

## Features

- 📅 **Familienkalender** — gemeinsame Termine, Wochen-/Monatsansicht
- ✅ **Aufgaben** — persönliche & gemeinsame To-Dos mit Zuweisung an Familienmitglieder, Wiederholungen
- 🛒 **Einkaufslisten** — mehrere Listen, Kategorien, Live-Sync zwischen Geräten
- 👨‍👩‍👧‍👦 **Familienmitglieder** — Profile mit Farb-Avataren

## Tech-Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12 + FastAPI + SQLAlchemy (async) |
| WebApp | TypeScript + React (Vite) |
| Android | Kotlin (Jetpack Compose) |
| Datenbank | SQLite (Dev) / PostgreSQL (Prod, NAS) |
| Auth | JWT |

## Projektstruktur

```
kovacevicapp/
  backend/    # FastAPI-Backend (API, Models, Services)
  webapp/     # React-WebApp (Vite)
  android/    # Android-App (Kotlin / Jetpack Compose)
  docker/     # Docker Compose für NAS-Deployment
```

Details zu Architektur & Konventionen: siehe [`CLAUDE.md`](./CLAUDE.md).

## Lokale Entwicklung

### Backend

```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload
```
→ läuft auf `http://localhost:8000` (API-Docs unter `/docs`)

### WebApp

```bash
cd webapp
npm install
npm run dev
```
→ läuft auf `http://localhost:3000`

Beide Server lassen sich auch per `start-dev.bat` gemeinsam starten.

## Tests

```bash
cd backend && pytest
cd webapp && npm test
```

## Deployment

Self-hosted via Docker Compose (Backend + PostgreSQL + Nginx Reverse Proxy) auf einem eigenen NAS. Details folgen unter `docker/`.
