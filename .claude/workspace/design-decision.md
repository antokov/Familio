# Design Decision — Ganztägige Termine

## Scope

- `EventFormModal.tsx` — neue Checkbox "Ganztägig" zwischen Datum-Feld und Zeit-Row.
- `WeekView.tsx` — neue "Ganztägig"-Zeile zwischen Tages-Header und scrollbarem Stunden-Raster.
- `MonthView.tsx` — **keine** Änderung.

## Layout

**EventFormModal — Checkbox:**
Eigene `.field`-Zeile (gleiches vertikales Rhythmus-Pattern wie Titel/Datum/Beschreibung), aber horizontal: natives `<input type="checkbox">` (18×18px, wie in `ExtractEventsModal` etabliert) + Label "Ganztägig" daneben, `gap: var(--space-2)`. Direkt unter dem Datum-Feld, vor der Zeit-Row — logische Lese-Reihenfolge: Titel → Datum → (Ganztägig?) → Zeiten.

Bei aktivierter Checkbox: die komplette `.timeRow`-Div (Von/Bis-Felder) wird aus dem DOM entfernt (`{!allDay && <div className={styles.timeRow}>…}`), kein Platzhalter, Formular wird kompakter — kein "leerer Bereich"-Effekt.

**WeekView — Ganztägig-Zeile:**
Neue Zeile mit identischem `grid-template-columns: 48px repeat(7, 1fr)` wie `.headerRow`/`.body`, direkt zwischen `.headerRow` und `.scrollArea` platziert, `border-bottom: 1px solid var(--color-border)` zur Abgrenzung vom Stunden-Raster darunter. **Wird nur gerendert, wenn mindestens ein All-Day-Event in der sichtbaren Woche existiert** — spart Platz in der Normalwoche ohne Geburtstage/Ferien.

- Linke Gutter-Zelle (48px): kleines, vertikal zentriertes Label „Ganztägig" (`--font-size-xs`, `--color-text-muted`, kein Rotieren — bei 48px Breite reicht normaler Zeilenumbruch/kleine Schrift), analog zur Google-Calendar-Konvention.
- Je Tagesspalte: vertikaler Stack aus Pills (max. 2 sichtbar, danach "+N weitere" analog `MonthView.moreLabel`), `padding: var(--space-1) var(--space-2)`, `gap: 2px` zwischen den Pills.

## Token Usage

| Element | Token |
|---|---|
| Checkbox-Akzent (EventFormModal) | `--color-primary` (`accent-color`, konsistent mit `ExtractEventsModal`) |
| Ganztägig-Zeile Trennlinie | `--color-border` (`border-bottom`, 1px) |
| Gutter-Label „Ganztägig" | `--color-text-muted`, `--font-size-xs` |
| Pill-Hintergrund | Event-Attendee-Farbe bzw. `--color-primary` Fallback (identische Logik zu `eventColor()` in `MonthView`/`WeekView`) |
| Pill-Text | `#fff` (wie bestehende `.pill`/`.eventTitle`) |
| Pill-Radius | `--radius-sm` |
| „+N weitere"-Text | `--color-text-muted`, `--font-size-xs` (wie `MonthView.moreLabel`) |
| Zeilen-Innenabstand | `--space-1`/`--space-2` |

## Interactions

- Checkbox-Toggle: sofortiges Aus-/Einblenden der Zeit-Row (kein Fade/Transition — konsistent mit dem Rest des Formulars, das keine Feld-Transitions verwendet).
- Ganztägig-Pills in `WeekView`: `onClick` öffnet das Bearbeiten-Modal (gleiche Handler-Signatur wie bestehende `eventBlock`-Pills), `hover: opacity 0.85` (identisch zu `.eventBlock:hover`).
- "+N weitere"-Label: rein informativ, kein Klick-Handler in v1 (konsistent mit `MonthView`, das ebenfalls keinen Klick auf das Label hat).

## Signature Element

Das kleine, vertikal zentrierte "Ganztägig"-Label im linken Gutter der neuen Zeile — macht auf einen Blick klar, was diese Zeile von der Stunden-Achse darunter unterscheidet, ohne zusätzliche Erklärung im UI.

## Avoid

- Keine Custom-Checkbox-Komponente — natives `<input type="checkbox">` reicht (gleiches Pattern wie `ExtractEventsModal`).
- Keine Animation/Transition beim Ein-/Ausblenden der Zeit-Row — Formular bleibt sofort reaktionsfähig, keine unnötige Bewegungs-Komplexität für ein Utility-Feature.
- Keine mehrtägigen Balken-Termine in der Ganztägig-Zeile (Out of Scope) — jede Zelle zeigt nur Termine dieses einen Tages.
- "New Tokens Needed": keine — alle benötigten Werte existieren bereits in `tokens.css`.
