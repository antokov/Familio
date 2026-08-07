# Design Decision — Dokumenten-Vorschau in der App

## Scope
Neues `DocumentPreviewModal`; `DocumentItem` (Ansehen-Button-Verhalten); `DocumentsPage` (Modal-State).

## Layout
- Backdrop/Modal-Grundgerüst identisch zu `DocumentUploadModal` (`position: fixed; inset: 0`, zentriert, `--radius-lg`, `--shadow-card`), aber **deutlich größer**: `max-width: 90vw`, `max-height: 90vh` statt der schmalen 420px-Formulare — Vorschau-Inhalt braucht Platz.
- Struktur: Header (Dateiname links, Download- + Close-Button rechts) — Body (Preview-Fläche, füllt Rest des Modals, `flex: 1`, `overflow: auto` für den Fallback-Fall, sonst `overflow: hidden` mit zentriertem Inhalt für Bild/PDF).
- Body-Innenbereich: `display: flex; align-items: center; justify-content: center` — sowohl für Bild (verhindert Verzerrung bei kleinen Bildern) als auch für den Fallback-Text/Icon.
- PDF-`<iframe>` und Bild-`<img>` nehmen volle Body-Fläche ein (`width: 100%; height: 100%` fürs iframe; `max-width/max-height: 100%; object-fit: contain` fürs Bild).

## Token Usage
- Modal-Hintergrund: `var(--color-surface)`, Border `var(--color-border)`, Radius `var(--radius-lg)`, Shadow `var(--shadow-card)` — 1:1 wie bestehende Modals.
- Header: `padding: var(--space-5) var(--space-6)`, `border-bottom: 1px solid var(--color-border)` — identisch zu `DocumentUploadModal`-Header.
- Dateiname im Header: `font-size: var(--font-size-md)`, `font-weight: 700`, `color: var(--color-text)` — wie `.modalTitle`.
- Fallback-Zustand: Icon (`FileText`, `size 48`) in `var(--color-text-muted)`, darunter Text `font-size: var(--font-size-sm)`, `color: var(--color-text-muted)`, darunter Download-Button im bestehenden `.saveBtn`-Stil (`var(--color-primary)`-Hintergrund).
- Body-Hintergrund bei PDF/Bild: `var(--color-bg)` (dunkler/neutraler als `--color-surface`, damit Bilder mit transparentem Hintergrund und PDFs sich vom Modal-Rahmen abheben).
- Download-Icon-Button im Header: exakt `.actionBtn` aus `DocumentItem.module.css` wiederverwenden (gleiche Maße/Hover).

## Interactions
- Öffnen: Klick auf "Ansehen"-Button in `DocumentItem` (jetzt `<button>` statt `<a target="_blank">`) → setzt `previewDoc` in `DocumentsPage`.
- Schließen: X-Button, Backdrop-Klick (bestehendes Pattern), **zusätzlich Escape-Taste** (neu, da Modal jetzt primär für "reinschauen" gedacht ist — schnelles Schließen wichtig).
- Kein Submit/Save-Flow nötig (reines Anzeige-Modal) — kein `saving`-State, kein Formular.
- Beim Wechsel des Dokuments (zweiter Preview-Klick während Modal offen): Body-Inhalt tauscht direkt aus, kein Flackern/Unmount-Remount-Effekt nötig (React re-rendert einfach mit neuen Props, da `previewDoc` einfach ersetzt statt Modal ge-toggled wird).

## Signature Element
**Der große, fast-fullscreen Preview-Body mit `--color-bg`-Hintergrund** — bewusst dunkler/ruhiger als die sonstigen `--color-surface`-Flächen der App, damit der Fokus komplett auf dem Dokumenteninhalt liegt (ähnliches Prinzip wie ein Lightbox-Pattern, aber ohne neue Farbtokens).

## Avoid
- Keine eigene PDF-Toolbar (Zoom, Seiten-Navigation) bauen — Browser-native iframe-Controls reichen (Story explizit Out-of-Scope).
- Keine Animation/Transition für das Öffnen bauen, die über die bestehende Modal-Konvention hinausgeht (kein Fade-In-Overengineering) — direktes Erscheinen wie bei den Form-Modals.
- Kein neuer Farbtoken für den Preview-Hintergrund — `--color-bg` reicht.
