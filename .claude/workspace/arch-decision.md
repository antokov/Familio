# Architect Scoping — Ganztägige Termine

## Codebase-Kontext

- `CalendarEvent`-Backend-Modell (`backend/app/models/event.py`) ist bewusst schlank: `title`, `description`, `start_dt`, `end_dt`, `attendees` (JSON), `created_at`. Neues `all_day`-Feld fügt sich als weitere einfache Spalte ein.
- `create_event`/`update_event` in `backend/app/routers/events.py` nutzen `data.model_dump()` bzw. `model_dump(exclude_unset=True)` und setzen die Felder generisch via `setattr`/Konstruktor — **kein Router-Code-Change nötig**, sobald das Schema erweitert ist.
- Frontend-Datenfluss ist etabliert: `types/event.ts` (camelCase) → `useEvents.ts` (`toSnakeCase`/`fromApi`-Mapping) → `EventFormModal` (Formular-State) → `CalendarPage` (Verdrahtung, unverändert) → `MonthView`/`WeekView` (Darstellung).
- `WeekView.computeEventLayout()` ist reine, exportierte, getestete Funktion (`WeekView.test.tsx`) — arbeitet nur mit zeitgebundenen Events. All-Day-Events müssen **vor** dem Aufruf herausgefiltert werden, nicht in der Funktion selbst behandelt werden (Funktion bleibt unverändert, keine Regression-Gefahr für bestehende Tests).
- `MonthView.tsx` zeigt Pills rein titelbasiert — **keine Änderung nötig**.
- Bekanntes Muster/Risiko: Neue DB-Spalte ohne Alembic (FS-09 offen) kann auf bestehender lokaler `backend/kovacevic.db` zu 500 führen, bis die Datei gelöscht wird (siehe Architecture-Log-Eintrag "Bugfix tasks 500"). Für automatisierte Tests irrelevant (In-Memory-SQLite pro Testlauf), aber Dev sollte lokale Verifikation ggf. nach Löschen der `kovacevic.db` durchführen.

## Dateien, die Dev anfassen soll

**Backend:**
1. `backend/app/models/event.py` — neue Spalte `all_day: Mapped[bool]` (`Boolean`, `nullable=False`, `default=False`).
2. `backend/app/schemas/event.py` — `all_day` auf `EventCreate` (`bool = False`), `EventUpdate` (`Optional[bool] = None`), `EventResponse` (`bool`) ergänzen.

**Frontend:**
3. `webapp/src/types/event.ts` — `allDay: boolean` auf `CalendarEvent` und `CreateEventInput`.
4. `webapp/src/hooks/useEvents.ts` — `toSnakeCase`/`fromApi` um `all_day`↔`allDay` erweitern.
5. `webapp/src/components/EventFormModal/EventFormModal.tsx` (+ `.module.css`) — Checkbox "Ganztägig"; bei aktiviert: Zeit-Row (`.timeRow`) ausblenden, beim Submit `startDt`/`endDt` hart auf `00:00`/`23:59` setzen.
6. `webapp/src/components/WeekView/WeekView.tsx` (+ `.module.css`) — neue "Ganztägig"-Zeile zwischen Header und Scroll-Bereich; `eventsByDay()` liefert weiterhin alle Events, aber vor `computeEventLayout()` nach `!ev.allDay` gefiltert; All-Day-Events separat pro Tag gesammelt und in der neuen Zeile gerendert.
7. `webapp/src/components/WeekView/WeekView.test.tsx` — `makeEvent`-Helper um `allDay: false` ergänzen (sonst TS-Fehler durch neues Pflichtfeld), neue Testfälle für Filterung/Zeile.
8. `webapp/src/components/EventFormModal/EventFormModal.test.tsx` — Testfälle für Checkbox-Verhalten ergänzen.

**Kein Router-Code-Change** (`backend/app/routers/events.py` bleibt unverändert — siehe Codebase-Kontext).

## Patterns, die Dev befolgen MUSS

- **Backend-Schema treibt Verhalten**, keine Sonderfälle im Router — `all_day` ist einfach ein weiteres Feld in `EventCreate`/`EventUpdate`/`EventResponse`, genau wie `title`/`description`.
- **`computeEventLayout()` bleibt unverändert** — All-Day-Filterung passiert im aufrufenden Code (`WeekView`-Komponente), nicht in der Layout-Funktion selbst. Bestehende `WeekView.test.tsx`-Tests für `computeEventLayout` dürfen nicht angepasst werden müssen (nur der `makeEvent`-Helper wegen des neuen Pflichtfelds).
- **Checkbox blendet aus, disabled nicht** — analog zur Design-Entscheidung: Zeit-Row komplett aus dem DOM entfernen (`{!allDay && (...)}`), keine gegrauten disabled-Inputs (spart Platz, ist eindeutiger).
- **Harte Zeit-Werte beim Submit, nicht beim Toggle** — `startTime`/`endTime`-States bleiben beim Umschalten unangetastet (falls Nutzer wieder deaktiviert, sind die vorherigen Werte noch da); erst `handleSubmit` überschreibt sie für den API-Call, wenn `allDay` aktiv ist.
- **"+N weitere"-Pattern aus `MonthView` wiederverwenden** für die neue Ganztägig-Zeile in `WeekView` (Schwellwert 2 statt 3, siehe `analysis.md`).
- **Keine neuen globalen Tokens** — Pill-Styling aus `MonthView.module.css` (`.pill`, `.moreLabel`) als Vorlage für die neuen `WeekView`-Klassen übernehmen (siehe `design-decision.md`).
- **Tests:** Bestehende Testfälle (Backend `test_events.py`, Frontend `EventFormModal.test.tsx`/`WeekView.test.tsx`) dürfen nicht durch das neue Pflichtfeld brechen — `all_day` in Backend-Tests optional lassen (Default greift), `allDay` in Frontend-Test-Fixtures ergänzen.

## Explizite Constraints (was Dev NICHT tun soll)

- Keine Alembic-Migration einführen — das ist Scope von FS-09, nicht dieser Story.
- Keine Änderung an `MonthView.tsx` — funktioniert bereits korrekt für ganztägige Termine.
- Keine mehrtägigen All-Day-Termine (Balken über mehrere Tage) implementieren (Out of Scope laut Story).
- Keine Änderungen an `android/` — Android-Parität ist wie bei vorherigen Features eine separate Folge-Story.
- Keine Änderung an `document_extraction.py` — die dortige 00:00–23:59-Fallback-Logik bleibt unverändert und setzt `all_day` NICHT automatisch (Out of Scope, siehe Story); das ist ein bewusster Cut, kein Bug.

## Blocker-Check

Keine Architektur-Risiken, die eine menschliche Entscheidung erfordern. Additive Spalte, additive UI-Erweiterung, keine bestehende Struktur wird umgebaut.
