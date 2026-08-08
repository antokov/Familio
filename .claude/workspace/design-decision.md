# Design Decision — Termine aus Dokument extrahieren

## Scope

- `DocumentItem.tsx` — neuer Action-Button in der bestehenden Icon-Button-Reihe (Ansehen/Herunterladen/Löschen).
- Neue Komponente `ExtractEventsModal` — Review-Dialog, größer als die kompakten Formulare (`EventFormModal`), da eine Liste mit potenziell vielen Zeilen dargestellt wird — näher an `DocumentPreviewModal` (großformatig) als an `EventFormModal` (kompakt).
- `DocumentsPage.tsx` — Ladezustand/Fehlerbanner während der Extraktion, analog zum bestehenden `errorBanner`.

## Layout

**Action-Button (DocumentItem):** Icon `CalendarPlus` (lucide-react), gleiche Größe/Stil wie bestehende `.actionBtn` (15px Icon, gleicher Hover). Nur gerendert wenn `isExtractable(doc.contentType)` true ist — kein disabled-Grau-Button für nicht unterstützte Typen, sondern komplett ausgeblendet (Reihe bleibt aufgeräumt, keine Erklärungslast im UI für einen Rand-Fall).

**ExtractEventsModal:** Backdrop + zentrierte Card wie `DocumentPreviewModal` (90vw, aber `max-width: 640px` — es ist eine Liste, kein Dokumenten-Viewer, braucht keine volle Breite). Struktur von oben nach unten:
1. Header: Titel `"Termine aus „{filename}“"` + X-Button (`--space-5` Padding, `--color-border` Trennlinie darunter — exakt wie `EventFormModal`-Header).
2. Scrollbarer Body (`max-height: 60vh; overflow-y: auto`) mit einer Zeile pro Terminvorschlag:
   - Checkbox (links, `--color-primary` beim Check) — Standard: alle vorausgewählt.
   - Titel-Input (flex: 1, editierbar, Klartext).
   - Datum-Input (`type="date"`) + Start-/Endzeit (`type="time"`) in einer Reihe darunter, `gap: var(--space-2)` — exakt das gleiche Zeilen-Layout wie im bestehenden `EventFormModal` (Datum + Zeit-Felder nebeneinander).
   - Zeilen durch `--color-border` (1px, `border-bottom`) getrennt, letzte Zeile ohne.
3. Footer (sticky/fixed am unteren Card-Rand, `border-top: 1px solid var(--color-border)`): links `"{n} von {total} ausgewählt"` (`--font-size-sm`, `--color-text-muted`), rechts zwei Buttons — `"Abbrechen"` (sekundär, wie überall) und `"Termine übernehmen"` (primär, `--color-primary`, disabled wenn `n === 0` oder während des Speicherns).

**Leerer/Fehler-Zustand innerhalb des Modals:** Wenn `candidates.length === 0` → Body zeigt zentrierten Hinweistext `"Keine Termine im Dokument gefunden."` statt der Liste, Footer zeigt nur `"Schließen"`.

## Token Usage

| Element | Token |
|---|---|
| Modal-Backdrop | bestehende `.backdrop`-Klasse aus `EventFormModal.module.css` übernehmen (rgba-Overlay, kein neuer Token) |
| Card-Hintergrund | `--color-surface` |
| Card-Radius | `--radius-lg` |
| Card-Shadow | `--shadow-drawer` |
| Zeilen-Trennlinie | `--color-border` |
| Primär-Button | `--color-primary` bg, weißer Text |
| Sekundär-Button | transparent bg, `--color-border` |
| "X von Y ausgewählt"-Text | `--color-text-muted`, `--font-size-sm` |
| Checkbox-Akzent | `--color-primary` (analog zur runden Task-Checkbox als bekanntes Signature-Pattern — hier aber eckig/nativ, kein neues Custom-Checkbox-Widget für v1) |
| Spacing zwischen Zeilen | `--space-3` vertical padding pro Zeile |
| Icon-Button (DocumentItem) | bestehende `.actionBtn`-Klasse, keine Änderung |

## Interactions

- Checkbox-Toggle: sofortiges visuelles Feedback (Zeile bei unchecked leicht abgedunkelt/`opacity: 0.55`, damit klar ist "wird nicht übernommen" — Text bleibt aber lesbar, keine harte Ausblendung).
- Titel-/Datum-/Zeit-Inputs: Standard-Input-Fokus-Ring wie im Rest der App (`EventFormModal`-Inputs als Vorlage).
- "Termine übernehmen"-Button während des sequenziellen Anlegens: Text wechselt zu `"Übernehme … ({i}/{n})"`, Button disabled — gibt dem Nutzer Fortschritts-Feedback statt eines stummen Spinners, da bei vielen Terminen mehrere Sequenzielle Requests laufen.
- Nach erfolgreichem Übernehmen: Modal schließt automatisch, `DocumentsPage` zeigt kurze Erfolgsmeldung (gleiche `.errorBanner`-Optik, aber mit `--color-success` statt Fehlerfarbe — neue Klasse `.successBanner` in `DocumentsPage.module.css`, keine neue globale Komponente).
- "Termine extrahieren"-Button in `DocumentItem` während laufender Extraktion: Icon wird durch dezenten Spinner ersetzt (gleiches Pattern wie `loading`-Text auf `DocumentsPage`, hier aber inline im Button statt Seiten-weit), Button disabled.

## Signature Element

Die **Fortschritts-Anzeige im "Termine übernehmen"-Button** (`"Übernehme … (2/5)"`) — macht den sequenziellen, nachvollziehbaren Anlage-Prozess sichtbar statt eines anonymen Ladebalkens, passend zum Grundsatz des Features: der Nutzer behält die Kontrolle, sieht genau was passiert, statt einer Blackbox-Automatisierung.

## Avoid

- Keine neue globale Checkbox-Komponente bauen — natives `<input type="checkbox">` mit Custom-Styling via CSS reicht für diese eine Stelle.
- Kein Konfetti/Erfolgsanimation — die App hat bisher keine solchen Effekte, würde stilistisch nicht passen (ruhiger, funktionaler Look).
- Keine Skeleton-Loader für die Kandidaten-Liste — die Extraktion läuft *vor* dem Öffnen des Modals (Ladezustand ist auf `DocumentsPage`-Ebene, nicht im Modal selbst), das Modal öffnet erst wenn Daten da sind.
- "New Tokens Needed": keine — alle benötigten Farben/Spacing/Radius existieren bereits in `tokens.css`.
