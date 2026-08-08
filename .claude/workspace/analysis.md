# BA Analysis — Ganztägige Termine

## Business Rules

1. Ein Termin bekommt ein neues Feld `all_day: boolean` (Default `false`) — rein additiv, keine bestehenden Daten werden reinterpretiert.
2. Bei `all_day=true` werden `start_dt`/`end_dt` weiterhin gespeichert (00:00:00–23:59:00 desselben Tages, analog zum bereits etablierten Ganztags-Fallback in `document_extraction.py`) — die bestehende Backend-Validierung `end_dt > start_dt` bleibt unverändert gültig, keine Sonderlogik nötig.
3. Die "Ganztägig"-Checkbox im `EventFormModal` steuert nur die UI (Zeit-Felder ein-/ausblenden). Beim Speichern mit aktivierter Checkbox werden Start-/Endzeit clientseitig hart auf `00:00`/`23:59` gesetzt — unabhängig vom (jetzt ausgeblendeten) Zeit-Feld-State.
4. In der Wochenansicht werden Termine mit `allDay=true` aus dem stunden-basierten Grid-Layout (`computeEventLayout`) ausgeschlossen und stattdessen in einer neuen, separaten Zeile oberhalb des Stunden-Rasters dargestellt.
5. In der Monatsansicht ist keine Änderung nötig — die Pills zeigen ausschließlich den Titel, unabhängig von Uhrzeit oder `all_day`-Status.
6. Bestehende Termine ohne das neue Feld gelten als `all_day=false` (DB-Default) — keine rückwirkende Neuinterpretation vorhandener 00:00–23:59-Termine (z. B. aus der Dokumenten-Extraktion).

## Edge Cases

1. Nutzer aktiviert "Ganztägig", ändert danach das Datum → beim Speichern zählt nur `date`, die (ausgeblendeten) Zeit-States werden ignoriert und mit 00:00/23:59 überschrieben.
2. Nutzer deaktiviert "Ganztägig" bei einem Termin → Zeit-Felder erscheinen wieder mit Default `09:00–10:00` (gleicher Default wie bei "Neuer Termin" ohne `initialTime`-Prop) statt der technischen 00:00/23:59-Werte — 00:00–23:59 wäre ein schlechter UX-Default für einen echten Zeittermin.
3. Mehrere ganztägige Termine am selben Tag in der Wochenansicht → Zeile muss mehrere Pills darstellen, nicht nur den ersten.
4. Sehr viele ganztägige Termine an einem Tag (selten) → analog zum bestehenden "+N weitere"-Muster aus `MonthView` begrenzen, damit die Zeile nicht unbegrenzt wächst (kompaktere Zeile als im Monat, daher niedrigerer Schwellwert: 2 sichtbar + "+N weitere").
5. Ganztägiger Termin und zeitgebundener Termin am selben Tag → zeitgebundener Termin bleibt normal im Stunden-Raster, ganztägiger Termin erscheint zusätzlich in der neuen Zeile — keine Konfliktprüfung (konsistent mit bestehendem Verhalten ohne Konflikterkennung).
6. `EventUpdate`-Schema: `all_day` muss wie andere Felder optional aktualisierbar sein (`exclude_unset`-Pattern bleibt unverändert funktionsfähig, da rein additiv).
7. **Bekanntes, bereits dokumentiertes Risiko:** Ohne Alembic (offenes FS-09) führt eine neue Spalte auf einer bereits existierenden lokalen/Produktions-SQLite-DB zu 500-Fehlern, bis die DB-Datei manuell gelöscht/neu erstellt wird — exakt das gleiche Muster wie beim historischen `completed_at`-Vorfall (siehe Architecture Log "Bugfix tasks 500"). Kein neues Risiko, sondern bekanntes, in FS-09 verfolgtes Verhalten — wird im Impl-Report als Hinweis vermerkt, ist aber kein Blocker für dieses Feature.

## Data Model Implications

- **Backend:** `CalendarEvent`-Modell bekommt neue Spalte `all_day: Mapped[bool]` (SQLAlchemy `Boolean`, `nullable=False`, `default=False`).
- **Backend-Schemas:** `EventCreate.all_day: bool = False`, `EventUpdate.all_day: Optional[bool] = None`, `EventResponse.all_day: bool`.
- **Backend-Router:** Keine Code-Änderung nötig — `create_event`/`update_event` verwenden bereits `data.model_dump()`/`model_dump(exclude_unset=True)`, das neue Feld fließt automatisch durch.
- **Frontend-Types:** `CalendarEvent.allDay: boolean`, `CreateEventInput.allDay: boolean` (camelCase, konsistent mit restlichem Pattern).
- **Frontend-Hook:** `useEvents.ts`s `toSnakeCase`/`fromApi` um `all_day`/`allDay` erweitert (gleiches Pattern wie bestehende Felder).

## Open Questions

**BLOCKING:** Keine.

**NON-BLOCKING (Annahmen, dokumentiert):**
- Default-Zeiten beim Deaktivieren von "Ganztägig": `09:00–10:00` (Standard-Neu-Termin-Default), nicht die technischen Ganztags-Werte.
- Mehrtägige ganztägige Termine explizit Out of Scope — keine Entscheidung in v1 nötig.
- "+N weitere"-Schwellwert in der Wochenansicht-Ganztägig-Zeile: 2 sichtbar (statt 3 wie im Monat), da die Zeile kompakter ist als eine Monats-Zelle.
