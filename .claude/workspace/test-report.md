# Test Report — Mehrtägige Termine (Ferien etc.)

## Acceptance Criteria Verification

| AC | Beschreibung | Status | Nachweis |
|---|---|---|---|
| AC1 | Von/Bis-Datumsfelder statt "Datum" bei aktiviertem Ganztägig | ✅ PASS | `EventFormModal.test.tsx`: "ersetzt Zeit-Felder durch Von/Bis-Datumsfelder, wenn Ganztägig aktiviert wird" |
| AC2 | Darstellung im Monat — Pill an jedem Tag im Zeitraum | ✅ PASS | `MonthView.test.tsx`: "zeigt einen 3-tägigen ganztägigen Termin an allen 3 Tagen" |
| AC3 | Darstellung in der Woche — Ganztägig-Zeile an jedem betroffenen Tag | ✅ PASS | `WeekView.test.tsx`: "zeigt einen mehrtägigen All-Day-Termin an jedem betroffenen Tag der Woche", "zeigt den mehrtägigen Termin nicht an Tagen außerhalb seines Zeitraums" |
| AC4 | Bearbeiten eines mehrtägigen Termins — Von/Bis korrekt vorausgefüllt | ✅ PASS | `EventFormModal.test.tsx`: "füllt Von/Bis bei mehrtägigem editEvent korrekt vor" |
| AC5 | Ungültiger Zeitraum wird verhindert | ✅ PASS | `EventFormModal.test.tsx`: "deaktiviert Speichern-Button, wenn Bis vor Von liegt", "zieht Bis automatisch nach, wenn Von auf ein späteres Datum als Bis verschoben wird" |

## Edge Cases Verification (aus analysis.md)

| # | Edge Case | Status |
|---|---|---|
| 1 | Bis vor Von → Button disabled + Fehlermeldung | ✅ Getestet |
| 2 | Von nach Bis verschoben → Bis zieht automatisch nach | ✅ Getestet |
| 3 | Von == Bis (eintägig) bleibt gültig | ✅ Getestet (`EventFormModal` + `MonthView`-Regressionstests) |
| 4 | Mehrtägiger Termin über Monats-/Wochenwechsel hinweg | ⚠️ Nicht automatisiert getestet — kein stabiler Datums-Selektor in `MonthView`-Zellen über Monatsgrenzen hinweg verfügbar; Algorithmus behandelt Monatsgrenzen nicht als Sonderfall (gleicher Code-Pfad wie innerhalb eines Monats), Risiko eingeschätzt als gering aber unverifiziert (siehe `impl-report.md`) |
| 5 | Sehr langer Zeitraum (mehrere Wochen) | ✅ Indirekt abgedeckt — Algorithmus ist eine simple Schleife ohne Obergrenze, kein dediziertes Performance-Test nötig für diese Größenordnung |
| 6 | Mehrere überlappende mehrtägige Termine am selben Tag / "+N weitere" | ✅ Getestet (`MonthView.test.tsx`: "respektiert das '+N weitere'-Limit pro Tag auch mit einem mehrtägigen Termin") |
| 7 | Ganztägig deaktivieren bei mehrtägigem Termin → Bis geht verloren | ℹ️ Bewusstes Verhalten, kein Fehlerfall — nicht separat getestet, da es kein Assertable "falsches" Verhalten ist (entspricht der bestehenden `!allDay`-UI, die schon vor dieser Story getestet war) |
| 8 | Testauswirkung auf bestehende "Ganztägig"-Tests | ✅ Behoben — zwei Tests aktualisiert (`type=date` statt Abwesenheit), ein Test verstärkt (`type=time`-Check beim Zurückwechseln) |

## New Tests Written

- `EventFormModal.test.tsx` (+5 Tests, neuer Block "Mehrtägig"): Vorausfüllen bei mehrtägigem `editEvent`, Speichern mit korrektem Zeitraum, Button-Disable bei ungültigem Bereich, Auto-Korrektur von "Bis", Von==Bis bleibt gültig. Zusätzlich 2 bestehende Tests im Block "Ganztägig" an die neue Von/Bis-Datumsfeld-Realität angepasst.
- `MonthView.test.tsx` (**neu**, 5 Tests): Regression Eintägig (ganztägig + nicht-ganztägig mit abweichendem Enddatum), Mehrtägig über 3 Tage, Klick auf eine der mehreren Pills ruft `onEventClick` korrekt auf, "+N weitere"-Limit bleibt pro Tag korrekt bei gemischten Ein-/Mehrtages-Terminen.
- `WeekView.test.tsx` (+2 Tests, neuer Block "Mehrtägige Ganztägig-Termine"): Termin erscheint an jedem betroffenen Tag der sichtbaren Woche, erscheint nicht außerhalb seines Zeitraums.

## Coverage Gaps

1. Kein automatisierter Test für Mehrtägigkeit über eine Monats- oder Wochengrenze hinweg (Edge Case 4) — technisch durch fehlenden stabilen Zellen-Selektor in `MonthView` erschwert, nicht durch fehlende Testbarkeit der Logik selbst.
2. Kein E2E-/Browser-Test des nativen `<input type="date">`-Verhaltens (jsdom simuliert dies nur begrenzt — funktionierte in den Unit-Tests nach Anpassung, aber echtes Browser-Verhalten ungetestet).

## Full Suite Results

- Backend: **116/116 Tests grün** (unverändert, keine Backend-Änderung in dieser Story).
- Frontend: **165/165 Tests grün** (`npx vitest run`), inkl. 12 neuer Tests.
- TypeScript: `npx tsc --noEmit` — keine Fehler.

## Verdict

**PASS ✅**

Alle 5 Acceptance Criteria sind durch automatisierte Tests abgedeckt und grün. Die einzige
offene Coverage-Lücke (Monats-/Wochengrenze) betrifft einen Rand-Fall, der über denselben,
bereits getesteten Code-Pfad läuft wie der Kernfall — das Risiko ist niedrig, aber es fehlt ein
expliziter Nachweis.
