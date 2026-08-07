# BA Analysis — Dokumenten-Vorschau in der App

## Business Rules

1. Vorschaufähige Typen sind auf Browser-nativ darstellbare Formate beschränkt: PDF (via `<iframe>`/`<embed>`, Browser-natives PDF-Rendering) und Bilder (`jpg`, `jpeg`, `png`, `gif`, `heic` via `<img>`).
2. Alle anderen erlaubten Upload-Typen (`doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt`, `zip`) zeigen einen Fallback-Hinweis statt eines Vorschauversuchs — kein Rendering-Versuch, der scheitern könnte.
3. Die Vorschau nutzt den bereits bestehenden `/api/documents/{id}/view`-Endpoint (inline `Content-Disposition`) — kein neuer Backend-Endpoint nötig.
4. Der bisherige "Ansehen"-Button (öffnet neuen Tab) wird durch das In-App-Modal **ersetzt**, nicht ergänzt — der Story-Auftrag ist explizit "kein neuer Tab".

## Edge Cases

1. **HEIC-Bilder:** Werden von den meisten Desktop-Browsern (Chrome/Firefox) NICHT nativ im `<img>`-Tag gerendert (fehlende Codec-Unterstützung) — obwohl HEIC in der Upload-Allowlist ist. Muss wie ein nicht-vorschaufähiger Typ behandelt werden (Fallback-Hinweis), sonst zeigt der Browser ein kaputtes Bild-Icon.
2. **PDF-Rendering schlägt fehl** (z. B. sehr alter Browser ohne PDF-Viewer-Plugin): Kein expliziter Error-Handler nötig für diesen Nischenfall — Browser zeigen in aller Regel einen eigenen "Download statt Anzeige"-Hinweis im iframe selbst. Kein Blocker.
3. **Sehr große Bilder/PDFs (nah am 20-MB-Limit):** Modal muss scrollbar sein, darf Viewport nicht sprengen — reines CSS-Constraint (`max-height`, `overflow`), kein funktionaler Edge Case.
4. **Datei auf Platte fehlt** (analog zum bestehenden Download-Fall): `/view`-Endpoint liefert bereits 404 — Frontend zeigt im Preview-Bereich einen Fehlertext statt eines kaputten iframe/img.
5. **Klick auf "Ansehen" bei bereits offenem Modal für ein anderes Dokument:** Modal-State ist an das ausgewählte Dokument gebunden (analog zu `editingTask`-Pattern in `TasksPage`) — zweiter Klick ersetzt einfach den Inhalt, kein Stacking mehrerer Modals.

## Data Model Implications

Keine. Reine Frontend-Änderung — nutzt bestehende `viewUrl()`-Funktion aus `useDocuments.ts` und das bestehende `contentType`-Feld aus `Document` (zur Entscheidung PDF vs. Bild vs. Fallback).

## Open Questions

1. **NON-BLOCKING:** HEIC-Behandlung als "nicht vorschaufähig" statt Rendering-Versuch — pragmatische Entscheidung wegen fehlender Browser-Unterstützung, konsistent mit AC3.

Keine BLOCKING-Fragen — Pipeline läuft ohne Eskalation weiter.
