# Implementation Report — Termine aus Dokument extrahieren

## Approach

Neuer Endpoint `POST /api/documents/{id}/extract-events` liest das bereits gespeicherte
Dokument, schickt es (PDF als `document`-Block, Bild als `image`-Block, jeweils base64) an
die Claude API und erzwingt via Structured Outputs (`output_config.format`, JSON-Schema) ein
striktes Ergebnisformat. Die Antwort wird **nicht** persistiert — sie geht als Response an
das Frontend, das sie in einem neuen Review-Dialog (`ExtractEventsModal`) anzeigt. Erst wenn
der Nutzer dort explizit "Termine übernehmen" klickt, werden die ausgewählten Vorschläge
sequenziell über den bereits bestehenden `POST /api/events`-Endpoint als echte Kalendertermine
angelegt.

## Files Changed

**Backend:**
- `backend/requirements.txt` — `anthropic`-SDK ergänzt.
- `backend/.env.example` — `ANTHROPIC_API_KEY` (optional) + `ANTHROPIC_MODEL` dokumentiert.
- `backend/app/config.py` — `anthropic_api_key`, `anthropic_model` (Default `claude-sonnet-5`).
- `backend/app/schemas/document.py` — `ExtractedEvent`, `ExtractEventsResponse` ergänzt.
- `backend/app/services/__init__.py`, `backend/app/services/document_extraction.py` (neu) —
  erstes Service-Modul der Codebasis; kapselt Claude-API-Aufruf, JSON-Schema, Prompt,
  Datum/Uhrzeit-Zusammenbau (inkl. Ganztags-Fallback) und typisierte Fehler
  (`DocumentExtractionError`).
- `backend/app/routers/documents.py` — neuer Endpoint, nutzt bestehendes `_get_document_file()`.

**Frontend:**
- `webapp/src/types/document.ts` — `ExtractedEventCandidate`, `isExtractable()`-Helper
  (Content-Type-Whitelist: PDF, JPEG, PNG, GIF, WebP).
- `webapp/src/hooks/useDocuments.ts` — `extractEvents(id)` ergänzt (gleiches
  Error-Handling-Pattern wie `uploadDocument`/`reassignDocument`).
- `webapp/src/components/EventFormModal/EventFormModal.tsx` — `extractDate`/`extractTime`
  jetzt `export`, um Duplikation im neuen Review-Dialog zu vermeiden.
- `webapp/src/components/ExtractEventsModal/ExtractEventsModal.tsx` + `.module.css` (neu) —
  Review-Dialog: editierbare Titel/Datum/Zeit pro Vorschlag, Checkbox zum Ab-/Anwählen
  (Default: alle ausgewählt), Fortschrittsanzeige beim sequenziellen Anlegen
  (`"Übernehme … (2/5)"`).
- `webapp/src/components/DocumentItem/DocumentItem.tsx` (+ `.module.css`) — neuer
  Action-Button "Termine extrahieren" (nur bei extrahierbarem `contentType` sichtbar,
  Spinner während Extraktion).
- `webapp/src/components/DocumentItem/DocumentItem.test.tsx` — bestehende Test-Helper an die
  zwei neuen Pflicht-Props (`extracting`, `onExtractEvents`) angepasst, damit Build/Tests
  grün bleiben (neue Testfälle folgen im Tester-Report).
- `webapp/src/pages/DocumentsPage.tsx` (+ `.module.css`) — State/Handler für Extraktion,
  Erfolgs-/Fehler-Banner, Verdrahtung von `ExtractEventsModal` mit `useEvents().createEvent`.

## Assumptions Made

- Fehlt zu einem erkannten Termin eine Uhrzeit (oder ist sie ungültig/End vor Start), wird er
  als ganztägig (00:00–23:59) behandelt statt eine Uhrzeit zu raten (Business Rule 6 aus
  `analysis.md`).
- Extrahierte Termine werden ohne `attendees` angelegt — Zuweisung erfolgt bei Bedarf danach
  über die normale Kalender-Bearbeitung (Out of Scope laut Story).
- Jeder erkannte Termin ist eintägig (ein `date`-Feld im Extraktions-Schema) — mehrtägige
  Termine aus dem Dokument würden aktuell nur mit ihrem Start-Datum übernommen. Nicht
  Teil der Story-Acceptance-Criteria, aber als Folge-Story-Kandidat vermerkt (siehe Backlog).
- `id` der `ExtractedEventCandidate` im Frontend ist rein client-seitig (`candidate-{index}`,
  React-Key) — die Backend-Response trägt keine ID, da nichts persistiert wird.

## Deviations from arch-decision.md

Keine. Alle in `arch-decision.md` benannten Dateien wurden wie vorgesehen angefasst, keine
zusätzlichen Dateien außerhalb der Liste geändert (Ausnahme: `DocumentItem.test.tsx` musste
minimal angepasst werden, damit die bestehende Suite mit den zwei neuen Pflicht-Props weiter
kompiliert — das war implizit in "Write or update unit tests alongside implementation"
vorgesehen).

## Technical Debt / Follow-up

- Keine Backend-Tests für `document_extraction.py` selbst in dieser Runde geschrieben (folgt
  in Tester-Phase mit gemocktem Anthropic-Client).
- Kein Test für den `ExtractEventsModal`-Komponenten-Flow (folgt in Tester-Phase).
- Mehrtägige Termine im Quellendokument werden nur mit ihrem Startdatum übernommen (siehe
  Assumptions) — als Folge-Story vermerken, falls in der Praxis relevant.
- Android-Parität für dieses Feature fehlt noch (Out of Scope laut Story, aber wie bei
  Dokumente/Vorschau bereits als Muster: Web zuerst, Android als Folge-Story).

## Open Items

Keine offenen Fragen, die eine menschliche Entscheidung erfordern.
