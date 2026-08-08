# Architect Scoping — Termine aus Dokument extrahieren

## Codebase-Kontext

- Router-Pattern: FastAPI-Router pro Feature (`app/routers/*.py`), DB-Zugriff **direkt im Router** via `AsyncSession` (kein bestehender Service-Layer trotz CLAUDE.md-Erwähnung — reale Codebasis hat aktuell keine `app/services/`-Dateien).
- Diese Story führt **das erste echte Service-Modul** ein (`app/services/document_extraction.py`), weil die Claude-API-Interaktion (Prompt bauen, Client aufrufen, Response parsen) zu viel Logik für den Router ist. Kein Rückbau bestehender Router nötig — reine Ergänzung.
- Events werden über `attendees: list[{initials, color}]` (JSON-Spalte) zugewiesen, nicht über `family_member_id`-FK wie bei Documents/Tasks.
- `_get_document_file()` in `documents.py` existiert bereits und liefert `(Document, Path)` inkl. 404-Handling — wiederverwenden.
- Frontend: API-Client ist kein zentraler Client, sondern pro Hook eigene `fetch`-Calls gegen `API_BASE` (siehe `useDocuments.ts`, `useEvents.ts`) — diesem Pattern folgen, keinen neuen "API-Layer" einführen.
- `EventFormModal.tsx` hat bereits robuste `extractDate`/`extractTime`-Helper (TD-05, `new Date()` + lokale Accessoren) — für den Review-Dialog wiederverwenden statt neu zu bauen.

## Dateien, die Dev anfassen soll

**Backend:**
1. `backend/requirements.txt` — Zeile `anthropic>=0.69.0` ergänzen (Sektion "Testing" bleibt unten).
2. `backend/.env.example` — `ANTHROPIC_API_KEY` (auskommentiert, mit Hinweis "optional, für Termine-aus-Dokument-Feature") und `ANTHROPIC_MODEL=claude-sonnet-5` ergänzen.
3. `backend/app/config.py` — zwei neue Felder auf `Settings`: `anthropic_api_key: str | None = None`, `anthropic_model: str = "claude-sonnet-5"`.
4. `backend/app/schemas/document.py` — `ExtractedEvent`(title: str, start_dt: datetime, end_dt: datetime) und `ExtractEventsResponse`(events: list[ExtractedEvent]) ergänzen.
5. **NEU:** `backend/app/services/__init__.py` (leer) + `backend/app/services/document_extraction.py`:
   - `class DocumentExtractionError(Exception)` mit `.status_code: int` und `.detail: str` für saubere Fehler-Mapping im Router.
   - `SUPPORTED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"}`
   - `async def extract_events(file_path: Path, content_type: str) -> list[ExtractedEvent]` — liest Datei, base64-encoded, baut Claude-Request, parsed Antwort.
6. `backend/app/routers/documents.py` — neuer Endpoint `POST /{document_id}/extract-events`, response_model `ExtractEventsResponse`. Nutzt bestehendes `_get_document_file()`.

**Frontend:**
7. `webapp/src/types/document.ts` — `ExtractedEventCandidate` Interface ergänzen (id: string [client-generated für React-key], title, startDt, endDt).
8. `webapp/src/hooks/useDocuments.ts` — `extractEvents(id: string): Promise<{ events: ExtractedEventCandidate[] } | { error: string }>` ergänzen.
9. **NEU:** `webapp/src/components/ExtractEventsModal/ExtractEventsModal.tsx` + `.module.css` — Review-Dialog.
10. `webapp/src/components/DocumentItem/DocumentItem.tsx` — neuer Action-Button "Termine extrahieren" (nur sichtbar bei unterstütztem `contentType`).
11. `webapp/src/pages/DocumentsPage.tsx` — State + Handler zum Verdrahten von Extraktion → Review-Dialog → Termine anlegen (nutzt `useEvents().createEvent`).

## Patterns, die Dev befolgen MUSS

- **Router bleibt dünn**: Die eigentliche Claude-API-Logik gehört in `services/document_extraction.py`, nicht in den Router. Router macht nur: Dokument laden, Content-Type validieren, Service aufrufen, Fehler mappen.
- **Structured Outputs verwenden** (`output_config={"format": {"type": "json_schema", "schema": {...}}}`) für die Claude-Response — kein Prompting auf "gib mir JSON zurück" + manuelles Regex-Parsing. Modell: `settings.anthropic_model` (Default `claude-sonnet-5`), Client: `anthropic.AsyncAnthropic` (async, passend zu FastAPI).
- **PDF/Bild als `document`/`image`-Content-Block** an die Messages API übergeben (base64), analog zur Doku im `python/claude-api/README.md` des `claude-api`-Skills — nicht die Datei als Text einlesen.
- **Fehlerbehandlung**: `DocumentExtractionError` mit sprechendem `status_code` (503 wenn kein API-Key, 502 bei `anthropic.APIStatusError`/`APIConnectionError`, 415 bei nicht unterstütztem Content-Type) — Router fängt das und wirft `HTTPException(status_code=e.status_code, detail=e.detail)`.
- **Keine Persistenz** der extrahierten Termine — `ExtractEventsResponse` ist eine reine Transport-Antwort, nichts wird in `calendar_events` geschrieben, bis der Nutzer im Frontend explizit "Termine übernehmen" klickt (das ruft den **bestehenden** `POST /api/events` auf, ein Request pro Termin).
- **Frontend-Datenfluss**: `DocumentsPage` hält den State (`extracting`, `extractionCandidates`, `extractionError`), nicht `DocumentItem` (Item bleibt zustandslos wie bisher — vgl. `previewDoc`-Pattern in `DocumentsPage.tsx`).
- **Zeit-Handling im Review-Dialog**: `extractDate`/`extractTime` aus `EventFormModal.tsx` wiederverwenden (kopieren als lokale Helper oder — bevorzugt — als benannte Funktionen aus `EventFormModal.tsx` exportieren und importieren, um Duplikation zu vermeiden).
- **CSS**: Bestehende Modal-Struktur von `EventFormModal.module.css`/`DocumentUploadModal.module.css` als Vorlage nehmen (Backdrop, Card, Header mit X-Button) — keine neuen globalen Tokens nötig, siehe `design-decision.md`.
- **Tests**: Backend-Tests für den neuen Endpoint mocken `app.services.document_extraction.extract_events` (monkeypatch, analog zum bestehenden `_use_tmp_upload_dir`-Fixture-Pattern in `test_documents.py`) — **keine echten API-Calls in Tests**.

## Explizite Constraints (was Dev NICHT tun soll)

- Kein neues DB-Modell/keine neue Tabelle für Kandidaten-Termine.
- Kein neuer Bulk-Create-Endpoint (`POST /api/events/bulk`) — sequenzielle Einzel-Calls im Frontend reichen für die erwarteten Mengen (typischerweise < 50 Termine pro Dokument).
- Keine Attendee-Auswahl im Review-Dialog (siehe Story "Out of Scope").
- Kein Hintergrund-Job/Queue/Polling — synchroner Request-Response reicht.
- Keine Änderungen an `android/` — v1 ist Web-only.
- Kein neuer globaler API-Client/Layer in `webapp/src/api/` — bestehendes Pro-Hook-`fetch`-Pattern beibehalten.

## Blocker-Check

Keine Architektur-Risiken, die eine menschliche Entscheidung erfordern — Service-Layer-Einführung ist eine additive, risikoarme Erweiterung, kein Umbau bestehender Strukturen.
