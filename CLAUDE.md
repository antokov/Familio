# Project Context (CLAUDE.md)

This file is automatically read by Claude Code at startup.
Keep it up to date so all agents have accurate project context.

---

## Project Overview

**Name:** Familio
**Type:** Full-Stack: React WebApp + Android App + FastAPI Backend
**Purpose:** Gemeinsame Familienapp mit Kalender, Aufgaben und Einkaufslisten, self-hosted auf eigenem NAS.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12 + FastAPI + SQLAlchemy (async) |
| WebApp | TypeScript + React (Vite) |
| Android | Kotlin (Jetpack Compose) |
| Datenbank | PostgreSQL (auf NAS) |
| Auth | JWT (FastAPI Users oder eigene Implementierung) |
| Testing (API) | pytest + httpx |
| Testing (Web) | Vitest + React Testing Library |
| Package Manager | pip / uv (Python), npm (Web) |

---

## Monorepo-Struktur

```
kovacevicapp/
  backend/           # FastAPI Python-Backend
    app/
      routers/       # API-Endpunkte (calendar, tasks, shopping)
      models/        # SQLAlchemy-Modelle
      schemas/       # Pydantic-Schemas
      services/      # Geschäftslogik
      auth/          # Authentifizierung & Berechtigungen
    tests/
    main.py
    requirements.txt

  webapp/            # React TypeScript WebApp
    src/
      components/    # Wiederverwendbare UI-Komponenten
      pages/         # Seiten (Calendar, Tasks, Shopping)
      api/           # API-Client (fetch/axios)
      store/         # State Management (Zustand o.ä.)
    index.html
    package.json
    vite.config.ts

  android/           # Android App (Kotlin / Jetpack Compose)
    app/src/main/
      kotlin/com/kovacevic/
        ui/          # Compose Screens
        data/        # Repository + API-Calls (Retrofit)
        domain/      # Use Cases

  docker/            # Docker Compose für NAS-Deployment
    docker-compose.yml
    nginx/
```

---

## Kern-Features

1. **Familienkalender** — gemeinsame Termine, Wiederholungen, Erinnerungen
2. **Aufgaben** — persönliche & gemeinsame To-Dos mit Zuweisung an Familienmitglieder
3. **Einkaufslisten** — mehrere Listen, Kategorien, Live-Sync zwischen Geräten
4. **Dokumente** — Datei-Upload (PDF/Office/Bilder, max. 20 MB) mit Zuweisung an ein Familienmitglied, Download, Löschen

---

## Key Patterns

- **Repository Pattern:** Alle DB-Zugriffe über Repository-Klassen (`app/services/`)
- **Schema-first:** Pydantic-Schemas definieren API-Vertrag, getrennt von DB-Modellen
- **Feature-Router:** Je Feature ein eigener FastAPI-Router (`routers/calendar.py` etc.)
- **Shared Types:** TypeScript-Typen werden aus dem OpenAPI-Schema generiert (openapi-ts)

---

## Naming Conventions

- Python-Dateien: `snake_case.py`
- TypeScript-Dateien: `kebab-case.ts` / `PascalCase.tsx` für Komponenten
- Kotlin-Dateien: `PascalCase.kt`
- DB-Tabellen: `snake_case` plural (z.B. `calendar_events`)

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI App-Einstiegspunkt |
| `backend/app/models/` | SQLAlchemy ORM-Modelle |
| `backend/app/schemas/` | Pydantic Request/Response-Schemas |
| `webapp/src/api/` | Typsicherer API-Client |
| `webapp/src/pages/ShoppingPage.tsx` | Einkaufsliste — inkl. QuickAddBar (Schnellerfassung) |
| `webapp/src/components/QuickAddBar/QuickAddBar.tsx` | Fixe Eingabeleiste am Seitenende (Tab-Nav, Enter-Submit) |
| `backend/app/routers/documents.py` | Dokumenten-Upload/-Download (multipart), lokales Dateisystem-Storage unter `settings.upload_dir` |
| `docker/docker-compose.yml` | NAS-Deployment |

---

## Environment Variables

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL Connection String | Yes |
| `SECRET_KEY` | JWT Signing Key | Yes |
| `ALLOWED_ORIGINS` | CORS-Whitelist (WebApp-URL) | Yes |
| `POSTGRES_USER` | DB-User (Docker) | Yes |
| `POSTGRES_PASSWORD` | DB-Passwort (Docker) | Yes |
| `UPLOAD_DIR` | Verzeichnis für Dokumenten-Uploads (Default `./uploads`) | No |
| `MAX_UPLOAD_SIZE_MB` | Max. Upload-Dateigröße in MB (Default `20`) | No |

---

## Infrastruktur (NAS)

- Self-hosted auf eigenem NAS
- Docker Compose für alle Services (Backend, PostgreSQL, Nginx Reverse Proxy)
- HTTPS über Nginx + Let's Encrypt (oder lokales Zertifikat)
- Android App verbindet sich über lokale IP oder DynDNS

---

## Agent Constraints

- **Nie anfassen:** `docker/secrets/` (enthält Credentials)
- **Tests laufen mit:** `pytest` (Backend), `npm test` (WebApp)
- **Lint/Format:** `ruff` (Python), `eslint + prettier` (TypeScript)
- **Dev-Server:** `uvicorn app.main:app --reload` (Backend), `npm run dev` (WebApp)

---

## Current State

Dashboard zeigt ausschließlich echte DB-Daten (Kalender, Aufgaben, Einkauf — kein Mock mehr). Einkaufsliste mit Backend-API, `useShoppingListApi`-Hook und `QuickAddBar` (fixiert am Viewport-Rand). Kalender (MonthView + WeekView), Aufgaben (CRUD + Recurrence), Familienmitglieder (CRUD), Dokumente (Upload/Download/Zuweisung/Löschen, In-App-Vorschau für PDF/Bilder via `DocumentPreviewModal`, lokales Dateisystem-Storage) und Settings-Seite aktiv. **Auto-Cleanup aktiv:** Erledigte Aufgaben und gecheckte Einkaufseinträge werden nach 6h beim nächsten GET gelöscht (Lazy Deletion, kein Scheduler). Guard: nur Einträge mit gesetztem `completed_at`/`checked_at` werden gelöscht — Altdaten bleiben. Backend: SQLite (Dev) / PostgreSQL (Prod). **Deployment-Hinweis:** Coolify-Backend braucht ein persistentes Volume auf `/app/uploads`, sonst gehen Dokumente bei jedem Redeploy verloren (siehe Backlog FS-27). Nächster Schritt: E2E-Tests oder Android-App.
