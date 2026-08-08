# BA Analysis — Mehrtägige Termine (Ferien etc.)

## Business Rules

1. **Kein Backend-Change nötig** — `start_dt`/`end_dt` unterstützen bereits beliebige Datumsspannen; die einzige bestehende Validierung (`end_dt > start_dt`) lässt Mehrtägigkeit bereits zu. Reines Frontend-Feature.
2. Mehrtägigkeit ist ausschließlich für `allDay=true` verfügbar. Bei nicht-ganztägigen Terminen bleibt die bisherige Ein-Tages-UI (Datum + Von/Bis-Uhrzeit) unverändert.
3. Beim Aktivieren von "Ganztägig" wird das einzelne "Datum"-Feld durch zwei Felder "Von" und "Bis" (beide `type="date"`) ersetzt. Beim Deaktivieren erscheint wieder das einzelne "Datum"-Feld (übernimmt den "Von"-Wert) plus die Zeit-Felder.
4. Validierung: "Bis" muss `>= "Von"` sein — Gleichstand ist erlaubt und entspricht dem bisherigen eintägigen ganztägigen Termin (Rückwärtskompatibilität zur letzten Story).
5. **MonthView:** ein Termin erscheint als eigene Pill an jedem Tag im Bereich `[start, end]` (inklusive Endpunkte), nicht nur am Starttag — betrifft nur `allDay=true`-Termine, da nicht-ganztägige Termine laut vorheriger Story ohnehin eintägig bleiben.
6. **WeekView-Ganztägig-Zeile:** gleiches Prinzip — der Termin erscheint an jedem Tag im Bereich, der in der sichtbaren Woche liegt.
7. Das bestehende "+N weitere"-Muster (MonthView: 3 sichtbar, WeekView-Ganztägig-Zeile: 2 sichtbar) gilt unverändert **pro Tag** — ein mehrtägiger Termin zählt an jedem Tag, an dem er erscheint, separat zur dortigen Tages-Terminliste.

## Edge Cases

1. Nutzer setzt "Bis" vor "Von" → Speichern-Button deaktiviert (analog zur bestehenden Zeit-Validierung), Fehlermeldung "Enddatum muss am oder nach dem Startdatum liegen".
2. Nutzer ändert "Von" auf ein Datum nach dem aktuellen "Bis" → automatische Korrektur: "Bis" wird auf den neuen "Von"-Wert nachgezogen (verhindert einen sofort ungültigen Zustand, ohne den Nutzer zu blockieren).
3. Ein-Tages-ganztägiger-Termin ("Von" == "Bis") → unverändertes bestehendes Verhalten aus der letzten Story, keine Regression.
4. Mehrtägiger Termin über einen Monats-/Wochenwechsel hinweg (z. B. 28.07.–03.08.) → erscheint korrekt in beiden Monats-/Wochenansichten für die jeweils sichtbaren Tage im Bereich, auch über Grid-Grenzen (anderer Monat/andere Woche) hinweg.
5. Sehr langer Zeitraum (z. B. 6 Wochen Sommerferien) → keine Obergrenze in v1; Performance vernachlässigbar (Datums-Iteration über wenige Dutzend Tage).
6. Mehrere überlappende mehrtägige Termine am selben Tag → bestehendes "+N weitere"-Pattern greift unverändert.
7. Bearbeiten eines mehrtägigen Termins + gleichzeitiges Deaktivieren von "Ganztägig" → "Bis" geht im Formular verloren (nur clientseitig, nicht im Backend, bis gespeichert wird); Termin wird dann als eintägiger Zeittermin am "Von"-Datum gespeichert — bewusstes Verhalten, da Mehrtägigkeit exklusiv an "Ganztägig" gekoppelt ist (siehe Story Out of Scope).
8. **Testauswirkung:** Zwei bestehende Tests aus "Ganztägige Termine" (`EventFormModal.test.tsx`) gehen davon aus, dass bei aktiviertem "Ganztägig" **gar keine** Von/Bis-Felder existieren (nur noch "Datum" implizit weg, kein Ersatz). Das ändert sich jetzt bewusst — Von/Bis existieren weiterhin, aber als `type="date"` statt `type="time"`. Diese zwei Tests müssen von Dev angepasst werden (kein Verhaltensbruch, sondern erwartete Weiterentwicklung).

## Data Model Implications

- **Keine.** Backend (Modell, Schema, Router) bleibt vollständig unverändert.
- Frontend: `EventFormModal` bekommt neuen State `endDate` (zusätzlich zum bestehenden `date`, das semantisch zu "Von" wird).
- `MonthView`/`WeekView`: Event-zu-Tag-Zuordnung für ganztägige Termine wird von "nur Starttag" auf "jeder Tag im Bereich `[start, end]`" erweitert — reine Rendering-Logik, kein Datenmodell-Impact.

## Open Questions

**BLOCKING:** Keine.

**NON-BLOCKING:**
- Kein durchgehender visueller Balken über mehrere Tage in v1 (Out of Scope) — Pill-Wiederholung pro Tag ist der pragmatische v1-Ansatz, konsistent mit den bereits etablierten Pill-Mustern in beiden Views.
