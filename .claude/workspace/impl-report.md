# Implementation Report — Ganztägige Termine

## Approach

Neues `all_day: boolean`-Feld (Default `false`) auf `CalendarEvent` — rein additiv, fließt
über das bestehende `model_dump()`/`setattr`-Pattern automatisch durch `create_event`/
`update_event`, **keine Router-Code-Änderung nötig**. `EventFormModal` bekommt eine
"Ganztägig"-Checkbox: aktiviert blendet sie die Zeit-Row komplett aus dem DOM aus und setzt
beim Speichern `startDt`/`endDt` hart auf `00:00`/`23:59` desselben Tages. `WeekView` filtert
All-Day-Termine aus dem stunden-basierten Grid heraus und zeigt sie stattdessen in einer neuen,
nur bei Bedarf sichtbaren "Ganztägig"-Zeile oberhalb des Stunden-Rasters (mit "+N weitere"-
Begrenzung analog zu `MonthView`). `MonthView` blieb unverändert, da die Pill-Darstellung dort
bereits unabhängig von der Uhrzeit funktioniert.

## Files Changed

**Backend:**
- `backend/app/models/event.py` — Spalte `all_day` (`Boolean`, `nullable=False`, `default=False`).
- `backend/app/schemas/event.py` — `all_day` auf `EventCreate`/`EventUpdate`/`EventResponse`.
- `backend/app/routers/events.py` — **unverändert** (generisches `model_dump()`-Pattern deckt das neue Feld bereits ab).

**Frontend:**
- `webapp/src/types/event.ts` — `allDay: boolean` auf `CalendarEvent`/`CreateEventInput`.
- `webapp/src/hooks/useEvents.ts` — `toSnakeCase`/`fromApi` um `all_day`↔`allDay` erweitert.
- `webapp/src/components/EventFormModal/EventFormModal.tsx` (+ `.module.css`) — Checkbox
  "Ganztägig", bedingtes Ausblenden der Zeit-Row, harte 00:00/23:59-Werte beim Submit,
  Validierung (`isValid`) übergeht die Zeit-Prüfung bei aktiviertem `allDay`.
- `webapp/src/components/WeekView/WeekView.tsx` (+ `.module.css`) — neue All-Day-Zeile
  (`allDayEventsByDay()`, `hasAllDayEvents`), `eventsByDay()` filtert jetzt `!ev.allDay`
  heraus, sodass `computeEventLayout()` **unverändert** bleibt.
- `webapp/src/components/ExtractEventsModal/ExtractEventsModal.tsx` — `allDay: false`
  beim `createEvent()`-Aufruf ergänzt (Pflichtfeld-Kompatibilität; bewusst `false`, siehe
  Assumptions).
- `webapp/src/components/EventFormModal/EventFormModal.test.tsx`,
  `webapp/src/components/WeekView/WeekView.test.tsx` — Test-Fixtures um `allDay: false`
  ergänzt, damit bestehende Suiten kompilieren.

## Assumptions Made

- Extrahierte Termine aus der Dokumenten-Extraktion (`ExtractEventsModal`) werden weiterhin
  mit `allDay: false` angelegt, auch wenn ihr Zeitraum 00:00–23:59 beträgt — keine automatische
  Rückwirkung auf bestehende Logik (explizit Out of Scope laut Story).
- Default-Zeiten beim Deaktivieren von "Ganztägig": die zuvor im State gehaltenen Werte bleiben
  erhalten (kein Reset auf 09:00–10:00) — der Zeit-State wird beim Toggle nie verändert, nur
  die Sichtbarkeit der Row. Bei einem neuen Termin ist der Ausgangswert ohnehin 09:00–10:00
  (bestehender Default), bei einem bestehenden Termin die zuvor gespeicherte Zeit — das
  entspricht dem in `analysis.md` angenommenen Verhalten, ohne einen zusätzlichen Reset-Effekt
  einzuführen.
- Lokale Dev-Datenbank (`backend/kovacevic.db`) wurde **nicht** automatisch gelöscht — das
  bekannte 500-Risiko aus FS-09 besteht weiterhin für bestehende lokale/Produktions-DBs mit der
  neuen Spalte, bis sie manuell neu erstellt oder migriert wird (siehe Backlog FS-09).

## Deviations from arch-decision.md

Keine. Alle in `arch-decision.md` benannten Dateien wurden wie vorgesehen angefasst.

## Technical Debt / Follow-up

- `document_extraction.py` markiert Termine mit Ganztags-Zeitraum weiterhin nicht als
  `all_day=true` — potenzielle Folge-Story, um beide Features zu verbinden (Extraktion könnte
  `all_day` direkt setzen, statt nur den Zeitraum zu simulieren).
- Keine Alembic-Migration für die neue Spalte (bewusst, siehe FS-09).
- Android-Parität für "Ganztägig" fehlt (Web-only in v1, wie bei vorherigen Features).

## Open Items

Keine offenen Fragen, die eine menschliche Entscheidung erfordern.
