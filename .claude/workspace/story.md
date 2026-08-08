# User Story — Ganztägige Termine

**As a** Familienmitglied
**I want** beim Erstellen/Bearbeiten eines Termins eine Option "Ganztägig" wählen können
**So that** ich für Termine ohne konkrete Uhrzeit (Geburtstage, Ferien, Feiertage) keine künstliche Uhrzeit eintragen muss

## Acceptance Criteria

**AC1 — Ganztägig aktivieren beim Anlegen**
Given ich lege einen neuen Termin an,
When ich die Checkbox "Ganztägig" aktiviere,
Then verschwinden die Uhrzeit-Felder (Von/Bis) und nur das Datum bleibt editierbar.

**AC2 — Darstellung im Kalender**
Given ich habe "Ganztägig" aktiviert und speichere,
When der Termin angelegt wird,
Then wird er ohne Uhrzeit dargestellt — in der Monatsansicht wie gehabt als Pill, in der Wochenansicht in einer eigenen "Ganztägig"-Zeile oberhalb des Stunden-Rasters, nicht als zeitgebundener Block darin.

**AC3 — Bearbeiten eines ganztägigen Termins**
Given ich bearbeite einen bestehenden ganztägigen Termin,
When ich das Bearbeiten-Modal öffne,
Then ist die Checkbox "Ganztägig" bereits aktiviert und die Uhrzeit-Felder sind ausgeblendet.

**AC4 — Ganztägig deaktivieren**
Given ich deaktiviere "Ganztägig" bei einem Termin (neu oder bestehend),
When ich die Checkbox abwähle,
Then erscheinen wieder Uhrzeit-Felder mit sinnvollen Standardwerten, die ich vor dem Speichern anpassen kann.

**AC5 — Mehrere ganztägige Termine am selben Tag**
Given mehrere ganztägige Termine liegen am selben Tag,
When ich die Wochenansicht öffne,
Then werden sie alle in der Ganztägig-Zeile für diesen Tag angezeigt, ohne den Stunden-Raster-Bereich zu verdecken oder zu überlappen.

## Out of Scope

- Mehrtägige, zusammenhängende ganztägige Termine (z. B. "Ferien 20.–31.07." als ein Balken über mehrere Tage) — v1 bleibt bei eintägigen ganztägigen Terminen, ein Termin pro Kalendertag.
- Automatische Umstellung bestehender Termine mit einem 00:00–23:59-Zeitraum (z. B. aus der Dokumenten-Extraktion) auf `all_day=true` — bestehende Daten bleiben unverändert.
- Datenbank-Migration via Alembic für die neue Spalte — folgt dem bestehenden, bekannten Muster (siehe Backlog FS-09), betrifft dieses Feature nicht anders als frühere Spalten-Änderungen.
