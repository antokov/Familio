# Architect Scoping — Mehrtägige Termine (Ferien etc.)

## Codebase-Kontext

- **Reines Frontend-Feature.** `start_dt`/`end_dt` im Backend sind bereits beliebige Datumsspannen-fähig (`end_dt > start_dt` ist die einzige Validierung) — kein Modell-/Schema-/Router-Change, keine neue DB-Spalte, kein Alembic-Risiko wie beim letzten Feature.
- `MonthView.tsx` baut aktuell eine `Map<dateStr, CalendarEvent[]>` ausschließlich über `ev.startDt.slice(0, 10)` — jedes Event landet nur in der Zelle seines Starttags. Muss auf "jeder Tag im Bereich" erweitert werden.
- `WeekView.tsx`s `allDayEventsByDay(day)` filtert aktuell exakt `ev.startDt.slice(0, 10) === dateStr` — muss auf Bereichs-Zugehörigkeit erweitert werden. `eventsByDay()` (nicht-ganztägige, zeitgebundene Events) bleibt **unverändert**, da Mehrtägigkeit exklusiv für `allDay=true` gilt.
- `EventFormModal.tsx` hat aktuell ein einzelnes `date`-Feld ("Datum") plus `startTime`/`endTime` (nur bei `!allDay` sichtbar). YYYY-MM-DD-Strings sind lexikographisch sortierbar — Bereichsvergleiche (`dateStr >= start && dateStr <= end`) funktionieren als reiner String-Vergleich, keine `Date`-Objekt-Arithmetik nötig.
- `.timeRow`-CSS-Klasse (`EventFormModal.module.css`) ist eine generische 2-Spalten-Grid-Utility (`grid-template-columns: 1fr 1fr`) — für die neue Von/Bis-Datums-Zeile wiederverwendbar (als neue, gleich-definierte Klasse `.dateRow`, um die Namensgebung sauber zu halten, siehe `design-decision.md`).

## Dateien, die Dev anfassen soll

1. `webapp/src/components/EventFormModal/EventFormModal.tsx` — neuer State `endDate`; bei `allDay=true` wird statt des einzelnen "Datum"-Felds eine Von/Bis-Datums-Zeile gerendert; Validierung (`isDateRangeValid`) und `handleSubmit` nutzen `date`/`endDate` für `startDt`/`endDt`; Auto-Korrektur wenn "Von" nach "Bis" verschoben wird oder "Ganztägig" mit ungültigem Bestandszustand aktiviert wird.
2. `webapp/src/components/EventFormModal/EventFormModal.module.css` — neue Klasse `.dateRow` (identisches Grid-Layout wie `.timeRow`).
3. `webapp/src/components/MonthView/MonthView.tsx` — Event-zu-Tag-Zuordnung (`eventsByDay`-Map-Aufbau) erweitert: für `allDay`-Events jeden Tag im Bereich `[startDt, endDt]` in die Map eintragen, nicht nur den Starttag. Nicht-ganztägige Events bleiben bei Einzeltag-Zuordnung.
4. `webapp/src/components/WeekView/WeekView.tsx` — `allDayEventsByDay(day)` von exaktem Datums-Vergleich auf Bereichs-Zugehörigkeit (`dateStr >= startDateStr && dateStr <= endDateStr`) umgestellt.
5. `webapp/src/components/EventFormModal/EventFormModal.test.tsx` — **zwei bestehende Tests müssen angepasst werden** (siehe `analysis.md` Edge Case 8): "blendet Zeit-Felder aus…" und "Checkbox ist bei ganztägigem editEvent…" gehen aktuell von "keine Von/Bis-Felder bei Ganztägig" aus — müssen auf "Von/Bis existieren weiterhin, aber `type=date`" umgestellt werden. Neue Testfälle für Mehrtägigkeit ergänzen.
6. **NEU:** `webapp/src/components/MonthView/MonthView.test.tsx` — MonthView hat aktuell keine Tests (bekanntes TD aus FS-16); da diese Story die Kern-Bucketing-Logik ändert, braucht sie jetzt gezielte Tests (Regression: Eintages-Event landet nur an seinem Tag; neu: Mehrtages-Event landet an jedem Tag im Bereich, auch über Monatsgrenzen der Grid-Anzeige hinweg).
7. `webapp/src/components/WeekView/WeekView.test.tsx` — neue Testfälle für Mehrtages-Events in der Ganztägig-Zeile ergänzen (bestehende Tests bleiben unverändert gültig).

## Patterns, die Dev befolgen MUSS

- **String-Vergleich statt Date-Arithmetik** für Bereichs-Zugehörigkeit — `dateStr >= ev.startDt.slice(0, 10) && dateStr <= ev.endDt.slice(0, 10)` funktioniert korrekt für ISO-Datumsstrings (YYYY-MM-DD), keine Zeitzonen-Fallstricke, kein `new Date()`-Overhead pro Zelle.
- **"Von"/"Bis" als Label-Text wiederverwendet**, auch für die Datums-Variante (bisher nur für Uhrzeit genutzt) — konsistent mit dem generischen "von…bis"-Konzept, keine neuen Label-Texte einführen. Da Zeit- und Datums-Variante sich gegenseitig ausschließen (`allDay`-Flag), gibt es keine Kollision im DOM.
- **`.dateRow` als eigene CSS-Klasse**, nicht `.timeRow` direkt wiederverwenden — gleiche Werte, aber semantisch getrennt, falls eine der beiden später unabhängig angepasst wird.
- **Auto-Korrektur statt Blockieren** bei Datums-Widersprüchen (siehe `analysis.md` Edge Case 2) — wenn "Von" nach "Bis" verschoben wird, "Bis" automatisch nachziehen, nicht nur die Eingabe verweigern.
- **`MonthView`/`WeekView` bleiben reine Präsentationskomponenten** — keine neue Zustandslogik, nur erweiterte Tag-Zuordnung beim Rendern.

## Explizite Constraints (was Dev NICHT tun soll)

- Keine Backend-Änderungen (Modell, Schema, Router, Migration) — dieses Feature braucht keine.
- Keine mehrtägigen Termine mit Uhrzeit (`allDay=false`) — bleibt exklusiv für ganztägige Termine (Out of Scope laut Story).
- Kein durchgehender visueller Balken über mehrere Tage/Spalten (Out of Scope) — Pill-Wiederholung pro Tag reicht für v1.
- Keine Änderung an `document_extraction.py` oder `ExtractEventsModal` — Dokumenten-Extraktion bleibt bei eintägigen Terminen (bereits als FS-30 im Backlog erfasst, nicht Teil dieser Story).
- Keine Änderungen an `android/`.

## Blocker-Check

Keine Architektur-Risiken, die eine menschliche Entscheidung erfordern. Reine Frontend-Erweiterung ohne Datenmodell-Impact — niedrigstes Risiko-Profil der bisherigen Kalender-Features.
