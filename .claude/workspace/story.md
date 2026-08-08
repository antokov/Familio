# User Story — Mehrtägige Termine (Ferien etc.)

**As a** Familienmitglied
**I want** beim Anlegen eines ganztägigen Termins einen Zeitraum über mehrere Tage angeben können (z. B. "Ferien 20.–31.07.")
**So that** ich nicht für jeden einzelnen Tag der Ferien einen eigenen Termin anlegen muss

## Acceptance Criteria

**AC1 — Von/Bis-Datumsfelder bei Ganztägig**
Given ich aktiviere "Ganztägig" beim Anlegen eines Termins,
When das Formular neu rendert,
Then sehe ich zwei Datumsfelder ("Von" und "Bis") statt eines einzelnen "Datum"-Felds.

**AC2 — Darstellung im Monat**
Given ich lege einen ganztägigen Termin mit "Von" 20.07. und "Bis" 31.07. an,
When ich die Monatsansicht öffne,
Then erscheint der Termin als Pill an jedem Tag im Zeitraum 20.–31.07. (inklusive), nicht nur am 20.07.

**AC3 — Darstellung in der Woche**
Given derselbe mehrtägige Termin liegt in der aktuell angezeigten Woche,
When ich die Wochenansicht öffne,
Then erscheint er in der "Ganztägig"-Zeile an jedem betroffenen Tag dieser Woche.

**AC4 — Bearbeiten eines mehrtägigen Termins**
Given ich bearbeite einen bestehenden mehrtägigen ganztägigen Termin,
When ich das Bearbeiten-Modal öffne,
Then sind "Von" und "Bis" korrekt mit dem gespeicherten Zeitraum vorausgefüllt.

**AC5 — Ungültiger Zeitraum wird verhindert**
Given ich setze "Bis" auf ein Datum vor "Von" (oder "Von" nach "Bis"),
When das passiert,
Then wird das verhindert bzw. validiert (Speichern-Button deaktiviert, Fehlermeldung), sodass kein ungültiger Zeitraum gespeichert werden kann.

## Out of Scope

- Mehrtägige Termine mit konkreter Uhrzeit (z. B. Geschäftsreise Tag 1 09:00 – Tag 3 17:00) — bleibt exklusiv für ganztägige Termine, wie bereits in "Ganztägige Termine" festgelegt.
- Durchgehende visuelle Balkendarstellung über mehrere Tage/Spalten hinweg (wie in Google Calendar) — v1 zeigt den Termin als wiederholte Pill an jedem betroffenen Tag, kein zusammenhängender Balken über Spaltengrenzen hinweg.
- Migration bestehender Termine — reine additive UI-Erweiterung, das Backend unterstützt beliebige Zeiträume bereits unverändert.
