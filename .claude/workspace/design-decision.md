# Design Decision — Mehrtägige Termine (Ferien etc.)

## Scope

- `EventFormModal.tsx` — Von/Bis-Datums-Zeile ersetzt das einzelne "Datum"-Feld, wenn "Ganztägig" aktiv ist.
- `MonthView.tsx` / `WeekView.tsx` — **keine visuellen Änderungen**, nur erweiterte Datenzuordnung (bestehende Pill-Darstellung wird pro Tag wiederverwendet, siehe Story "Out of Scope": kein durchgehender Balken in v1).

## Layout

**EventFormModal — Von/Bis-Datums-Zeile:**
Exakt das gleiche Grid-Layout wie die bestehende Zeit-Row (`grid-template-columns: 1fr 1fr; gap: var(--space-3)`), nur mit zwei `type="date"`-Inputs statt `type="time"`. Ersetzt positionsgleich das bisherige einzelne "Datum"-Feld — kein Layout-Sprung, die Checkbox "Ganztägig" bleibt an ihrer Stelle direkt darunter.

```
[ Von-Datum ]  [ Bis-Datum ]
      ☐ Ganztägig
```

wird bei aktivem Ganztägig zu derselben Position, nur mit zwei Feldern statt einem:

```
[ Von-Datum ]  [ Bis-Datum ]
      ☑ Ganztägig
```

Fehlermeldung bei ungültigem Bereich exakt im gleichen Stil wie die bestehende Zeit-Validierung ("Endzeit muss nach Startzeit liegen" → "Enddatum muss am oder nach dem Startdatum liegen"), unter dem "Bis"-Feld.

## Token Usage

Keine neuen Tokens — alle Werte aus der bestehenden `.timeRow`/`.input`/`.inputError`/`.timeErrorMsg`-Definition werden 1:1 für die neue `.dateRow`-Klasse übernommen (`--space-3` Gap, `--color-accent` für Fehlerzustand, `--font-size-xs` für Fehlertext).

## Interactions

- Auto-Korrektur (siehe `arch-decision.md`): Wenn "Von" nach "Bis" verschoben wird, springt "Bis" automatisch mit — kein blockierender Fehlerzustand für diesen häufigsten Fall, nur echte manuelle Rückwärts-Eingabe im "Bis"-Feld selbst zeigt den Fehlerzustand (roter Rand + Text), analog zur bestehenden Zeit-Validierung.
- Keine Animation beim Wechsel Datum↔Von/Bis (konsistent mit der bereits getroffenen Entscheidung aus "Ganztägige Termine": kein Transition-Overhead für ein Utility-Formular).
- MonthView/WeekView-Pills: unverändertes Hover-/Klick-Verhalten, jetzt einfach an mehreren Tagen statt nur einem sichtbar.

## Signature Element

Keins — dieses Feature erweitert bestehende, bereits etablierte visuelle Muster (Pills in Monat/Woche) rein datentechnisch, ohne neues visuelles Element einzuführen. Konsistenz mit dem Bestehenden ist hier wichtiger als ein neues Signature-Element.

## Avoid

- Kein durchgehender Balken über mehrere Tage/Wochen-Spalten hinweg (Out of Scope) — würde `grid-column`-Spanning-CSS in `WeekView` und tageübergreifende Positionsberechnung in `MonthView` erfordern; deutlich höherer Aufwand für v1 ohne entsprechenden AC.
- Keine neue Datums-Picker-Komponente — natives `<input type="date">` reicht, wie überall sonst im Formular.
- "New Tokens Needed": keine.
