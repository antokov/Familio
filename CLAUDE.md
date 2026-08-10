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
      kotlin/com/kovacevic/familio/
        ui/          # Compose Screens + ViewModels (dashboard, calendar, tasks, shopping, documents, settings)
        data/        # model/ (DTOs), remote/ (Retrofit ApiService), local/ (DataStore), repository/
        di/          # AppContainer (manueller DI-Container, kein Hilt)

  docker/            # Docker Compose für NAS-Deployment
    docker-compose.yml
    nginx/
```

---

## Kern-Features

1. **Familienkalender** — gemeinsame Termine, Wiederholungen, Erinnerungen, ganztägige Termine (eigene "Ganztägig"-Zeile in der Wochenansicht statt Zeit-Block), inkl. **mehrtägiger** ganztägiger Termine (z. B. "Ferien 20.–31.07.") — erscheinen als Pill an jedem betroffenen Tag in Monats- und Wochenansicht
2. **Aufgaben** — persönliche & gemeinsame To-Dos mit Zuweisung an Familienmitglieder
3. **Einkaufslisten** — mehrere Listen, Kategorien, Live-Sync zwischen Geräten
4. **Dokumente** — Datei-Upload (PDF/Office/Bilder, max. 20 MB) mit Zuweisung an ein Familienmitglied, Download, Löschen. Für PDF/Bild-Dokumente zusätzlich: **Termine aus Dokument extrahieren** — Claude API analysiert das Dokument, Nutzer prüft/bearbeitet die Vorschläge in einem Review-Dialog, erst nach Bestätigung werden Kalendertermine angelegt (kein Autocreate ohne Review)

---

## Key Patterns

- **Router-First:** DB-Zugriffe laufen direkt im Router (`AsyncSession` inline) — kein DB-Repository-Layer. `app/services/` (seit "Termine aus Dokument extrahieren") kapselt stattdessen Business-Logik ohne direkten DB-Bezug, aktuell die Claude-API-Anbindung (`document_extraction.py`); Router bleiben dünn und rufen den Service auf
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
| `backend/app/services/document_extraction.py` | Claude-API-Anbindung für "Termine aus Dokument extrahieren" — PDF/Bild als Content-Block, Structured Output (JSON-Schema), keine Persistenz |
| `webapp/src/components/ExtractEventsModal/ExtractEventsModal.tsx` | Review-Dialog für extrahierte Terminvorschläge (editierbar, ab-/anwählbar, inkl. Ganztägig- und Personen-Zuweisungs-Toggle pro Zeile) — Pflicht-Schritt vor `POST /api/events` |
| `webapp/src/pages/DocumentsPage.tsx` | Dokumentenliste, gruppiert nach zugewiesener Person (`groupDocuments()`, exportierte pure Function) — "Allgemein" zuerst, dann Familienmitglieder in ihrer Reihenfolge, leere Gruppen entfallen |
| `docker/docker-compose.yml` | NAS-Deployment |
| `android/app/src/main/kotlin/com/kovacevic/familio/data/remote/ApiService.kt` | Retrofit-Interface, spiegelt alle Backend-Endpunkte |
| `android/app/src/main/kotlin/com/kovacevic/familio/di/AppContainer.kt` | Manueller DI-Container (Retrofit/OkHttp/Repositories/Coil) |
| `android/app/src/main/kotlin/com/kovacevic/familio/data/local/SettingsDataStore.kt` | Server-URL (Settings-Screen) + Theme-Mode, persistiert via DataStore |

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
| `ANTHROPIC_API_KEY` | Claude-API-Key für "Termine aus Dokument extrahieren" — ohne Key liefert der Endpoint 503 | No |
| `ANTHROPIC_MODEL` | Claude-Modell für Dokumenten-Extraktion (Default `claude-sonnet-5`) | No |

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

Dashboard zeigt ausschließlich echte DB-Daten (Kalender, Aufgaben, Einkauf — kein Mock mehr). Einkaufsliste mit Backend-API, `useShoppingListApi`-Hook und `QuickAddBar` (fixiert am Viewport-Rand). Kalender (MonthView + WeekView, inkl. **ganztägige Termine** — eigene Zeile über dem Stunden-Raster in WeekView — und **mehrtägige** ganztägige Termine, die als Pill an jedem betroffenen Tag erscheinen; CRUD jetzt vollständig — **Termin löschen** über Löschen-Button mit 2-stufiger Inline-Bestätigung im Edit-Modal, Backend-Endpoint existierte bereits ungenutzt), Aufgaben (CRUD + Recurrence), Familienmitglieder (CRUD), Dokumente (Upload/Download/Zuweisung/Löschen, In-App-Vorschau für PDF/Bilder via `DocumentPreviewModal`, lokales Dateisystem-Storage, **Termine aus Dokument extrahieren** via Claude API mit verpflichtendem Review-Dialog vor Anlage, inkl. Übernahme der dem Dokument zugewiesenen Person als vorausgewählter Termin-Teilnehmer, im Dialog pro Termin änderbar; Dokumentenliste **gruppiert nach zugewiesener Person** — "Allgemein" für unzugewiesene Dokumente zuerst, dann ein Abschnitt je Familienmitglied mit mindestens einem Dokument, leere Abschnitte entfallen, analog zur bereits bestehenden Android-Gruppierung) und Settings-Seite aktiv (inkl. neuer "App"-Sektion mit Android-APK-Download-Link `/downloads/familio.apk`, statisches Vite-`public/`-Asset — die Binärdatei selbst muss manuell vor jedem Deploy nach `webapp/public/downloads/familio.apk` gelegt werden, siehe Backlog FS-35). **Auto-Cleanup aktiv:** Erledigte Aufgaben und gecheckte Einkaufseinträge werden nach 6h beim nächsten GET gelöscht (Lazy Deletion, kein Scheduler). Guard: nur Einträge mit gesetztem `completed_at`/`checked_at` werden gelöscht — Altdaten bleiben. Backend: SQLite (Dev) / PostgreSQL (Prod). **Deployment-Hinweis:** Coolify-Backend hat ein persistentes Directory Mount auf `/app/uploads` (Host: `/mnt/data/familio/uploads`, HDD statt System-SSD) — Dokumente überleben Redeploys (FS-27 erledigt). Für die Dokumenten-Extraktion muss auf dem Server zusätzlich `ANTHROPIC_API_KEY` gesetzt werden (sonst 503 beim Extrahieren, alles andere funktioniert unverändert). **Bekanntes Risiko ohne Alembic (FS-09 offen):** neue Spalten wie `calendar_events.all_day` können auf einer bereits existierenden lokalen/Produktions-DB zu 500-Fehlern führen, bis die Spalte nachgezogen wird — **ist in Produktion bereits eingetreten** ("Kalender konnte nicht geladen werden" nach dem `all_day`-Rollout, behoben via manuellem `ALTER TABLE calendar_events ADD COLUMN all_day BOOLEAN NOT NULL DEFAULT false;`), zweiter realer Vorfall dieses Musters nach `completed_at` bei Tasks. **Timezone-Fix (behoben):** `calendar_events.start_dt`/`end_dt` sind `DateTime(timezone=True)`-Spalten, aber die App behandelt Termine überall als naive Wanduhrzeit (WebApp schickt z.B. `"...T17:00:00"` ohne Offset). Auf SQLite (Dev) ist das ein No-op, auf PostgreSQL (Prod) taggt die DB gelesene Werte mit der Session-Zeitzone — das Frontend interpretierte das beim erneuten Parsen fälschlich als UTC und rechnete in Lokalzeit um, wodurch Termine um den UTC-Offset (1-2h, je nach Sommer-/Winterzeit) verschoben ankamen (sichtbar u.a. bei **Termine aus Dokument extrahieren**). Fix in `app/schemas/event.py`: `EventCreate`/`EventUpdate`/`EventResponse` strippen jetzt konsequent `tzinfo` an beiden Schema-Grenzen (Input und Output), damit die Uhrzeit-Ziffern unabhängig vom DB-Backend unverändert durchgereicht werden. Zusätzlich erkennt die Dokumenten-Extraktion jetzt selbst, ob ein Termin ganztägig ist (`ExtractedEvent.all_day`, gesetzt wenn `document_extraction._combine()` mangels Uhrzeit auf 00:00–23:59 zurückfällt) — der Review-Dialog zeigt dafür keine Zeit-Eingaben mehr, sondern einen (vom Nutzer umschaltbaren) "Ganztägig"-Toggle, und legt den Termin mit `all_day: true` an statt als getimter 00:00–23:59-Termin.

**Android-App (native, Kotlin/Compose) fertig gebaut** — bildet alle Webapp-Features 1:1 nach: Dashboard, Kalender (Monat/Woche, Custom-Grid), Aufgaben, Einkauf (inkl. Quick-Add-Bar), Dokumente (Upload/Download/Vorschau/Zuweisung), Settings (Familie-CRUD, Theme, **konfigurierbare Server-URL** — im Gegensatz zur Webapp, die `VITE_API_URL` fix zur Buildzeit setzt, braucht die Android-App das zur Laufzeit, da sie sich von unterschiedlichen Geräten/Netzwerken aus mit dem NAS verbindet). Architektur: MVVM, manueller DI-Container (kein Hilt), Retrofit+kotlinx.serialization (snake_case↔camelCase automatisch über `JsonNamingStrategy.SnakeCase`), Server-URL zur Laufzeit änderbar über einen OkHttp-Interceptor, der die Zielhost umschreibt (Retrofit selbst bleibt auf einer Platzhalter-Base-URL). Kein Auth (Backend hat aktuell keins). Build-Setup siehe Memory `android_build_setup`. Noch nicht erledigt: manuelles Durchklicken auf echtem Gerät/Emulator (nur `assembleDebug` lokal verifiziert), automatisierte Tests. Nächster Schritt: App auf Gerät/Emulator testen, danach ggf. E2E-Tests (Web) oder Auth.
