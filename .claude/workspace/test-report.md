# Test Report — Ganztägige Termine

## Acceptance Criteria Verification

| AC | Beschreibung | Status | Nachweis |
|---|---|---|---|
| AC1 | Ganztägig aktivieren beim Anlegen → Zeit-Felder verschwinden | ✅ PASS | `EventFormModal.test.tsx`: "blendet Zeit-Felder aus, wenn Ganztägig aktiviert wird" |
| AC2 | Darstellung im Kalender (Monat: Pill wie gehabt, Woche: eigene Ganztägig-Zeile statt Zeit-Block) | ✅ PASS | `WeekView.test.tsx`: "zeigt die Ganztägig-Zeile mit dem Termin-Titel…", "All-Day-Event erscheint nicht als zeitgebundener Block im Stunden-Raster"; `MonthView` unverändert (zeigt Pills bereits titelbasiert, kein Test nötig da keine Code-Änderung) |
| AC3 | Bearbeiten eines ganztägigen Termins → Checkbox vorausgewählt, Zeit-Felder ausgeblendet | ✅ PASS | `EventFormModal.test.tsx`: "Checkbox ist bei ganztägigem editEvent bereits aktiviert und Zeit-Felder ausgeblendet" |
| AC4 | Ganztägig deaktivieren → Zeit-Felder erscheinen wieder | ✅ PASS | `EventFormModal.test.tsx`: "zeigt Zeit-Felder wieder, wenn Ganztägig bei bestehendem Termin deaktiviert wird" |
| AC5 | Mehrere ganztägige Termine am selben Tag in der Wochenansicht | ✅ PASS | `WeekView.test.tsx`: "zeigt mehrere All-Day-Events desselben Tages nebeneinander", "zeigt '+N weitere' wenn mehr als 2 All-Day-Events am selben Tag liegen" |

## Edge Cases Verification (aus analysis.md)

| # | Edge Case | Status |
|---|---|---|
| 1 | Ganztägig aktiviert, Datum geändert → nur Datum zählt, Zeit-States werden beim Submit überschrieben | ✅ Durch Code-Pfad sichergestellt (`handleSubmit` setzt `00:00`/`23:59` unabhängig vom Zeit-State); indirekt durch "speichert mit 00:00–23:59…"-Test abgedeckt |
| 2 | Ganztägig deaktiviert → vorherige Zeit-Werte bleiben erhalten (kein Reset) | ✅ Getestet ("zeigt Zeit-Felder wieder…" prüft Wiedererscheinen; Werte bleiben durch unverändertes State-Handling erhalten, kein Reset-Code vorhanden) |
| 3 | Mehrere All-Day-Termine am selben Tag → alle in der Zeile | ✅ Getestet |
| 4 | Sehr viele All-Day-Termine (>2) → "+N weitere" | ✅ Getestet |
| 5 | All-Day- und zeitgebundener Termin am selben Tag | ⚠️ Nicht explizit getestet — durch die Filterlogik (`eventsByDay` filtert `!allDay`, `allDayEventsByDay` filtert `allDay`) strukturell garantiert überschneidungsfrei, aber kein dedizierter Kombinations-Test |
| 6 | `EventUpdate`: `all_day` optional aktualisierbar, `exclude_unset` funktioniert weiter | ✅ Getestet (Backend: `test_update_all_day_true`, `test_update_without_all_day_leaves_it_unchanged`, `test_update_all_day_false`) |
| 7 | Bekanntes 500-Risiko ohne Alembic bei neuer Spalte auf bestehender DB | ℹ️ Nicht automatisiert testbar (betrifft nur bestehende lokale/Produktions-DB-Dateien, nicht die In-Memory-Test-DB) — dokumentiert in `impl-report.md`, bekanntes Muster aus FS-09 |

## New Tests Written

**Backend** (`backend/tests/test_events.py`, +5 Tests in `TestAllDay`):
- Default `all_day=False` bei neuem Termin.
- Erstellen mit `all_day=True`.
- Update setzt `all_day=True`.
- Update ohne `all_day`-Feld lässt bestehenden Wert unverändert (`exclude_unset`).
- Update setzt `all_day=False` zurück.

**Frontend:**
- `EventFormModal.test.tsx` (+6 Tests, neuer Block "Ganztägig"): Default unchecked, Zeit-Felder verschwinden bei Aktivierung, Checkbox vorausgewählt + Felder ausgeblendet bei ganztägigem `editEvent`, Felder erscheinen wieder bei Deaktivierung, korrekter `onSave`-Payload (00:00/23:59 + `allDay:true`), Submit-Button unabhängig von Zeitwerten aktiv.
- `WeekView.test.tsx` (+6 Tests, neuer Block "Ganztägig-Zeile"): Zeile nicht sichtbar ohne All-Day-Events, Zeile mit Titel sichtbar, kein Zeit-Text im Stunden-Raster für All-Day-Events, mehrere Termine nebeneinander, "+N weitere"-Begrenzung, Klick auf Pill ruft `onEventClick` auf.

## Coverage Gaps

1. Keine dedizierte Kombination "All-Day- und zeitgebundener Termin am selben Tag gleichzeitig sichtbar" getestet (Edge Case 5) — strukturell durch die disjunkte Filterlogik abgesichert, aber kein expliziter Regressionstest.
2. Keine E2E-/visuelle Prüfung, dass die Ganztägig-Zeile bei sehr vielen Terminen (>2) korrekt umbricht statt abzuschneiden — nur die "+N weitere"-Logik ist getestet, nicht das visuelle Layout.
3. `useEvents.ts`-Hook selbst hat weiterhin keine eigenen Tests (bestehendes TD, siehe Backlog TD-08/FS-17-Familie) — die `all_day`-Erweiterung dort ist nur indirekt über die Component-Tests abgedeckt.

## Full Suite Results

- Backend: **116/116 Tests grün** (`py -m pytest`), inkl. 5 neuer Tests.
- Frontend: **153/153 Tests grün** (`npx vitest run`), inkl. 12 neuer Tests.
- TypeScript: `npx tsc --noEmit` — keine Fehler.

## Verdict

**PASS ✅**

Alle 5 Acceptance Criteria sind durch automatisierte Tests abgedeckt und grün. Die
identifizierten Coverage-Gaps betreffen einen strukturell bereits abgesicherten Kombinations-
Fall und rein visuelles Verhalten, das ohne Browser-Rendering nicht sinnvoll unit-testbar ist —
kein AC ist davon betroffen.
