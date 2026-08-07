# Dev Implementation Report — Dokumenten-Vorschau in der App

## Approach

Reine Frontend-Änderung. Neues `DocumentPreviewModal` (Fast-Fullscreen-Modal, `90vw`×`90vh`) rendert je nach `doc.contentType` entweder ein `<iframe>` (PDF), ein `<img>` (Bild, außer HEIC/HEIF) oder einen Fallback-Hinweis mit Download-Button. Der bisherige "Ansehen"-Link (`<a target="_blank">`) in `DocumentItem` wurde durch einen `<button onClick={() => onPreview(doc)}>` ersetzt — kein neuer Tab mehr. `DocumentsPage` hält den `previewDoc`-State analog zum bestehenden `editingTask`-Pattern in `TasksPage`.

## Files Changed

**Neu:**
- `webapp/src/components/DocumentPreviewModal/DocumentPreviewModal.tsx` — Preview-Modal mit PDF/Bild/Fallback-Branching
- `webapp/src/components/DocumentPreviewModal/DocumentPreviewModal.module.css`
- `webapp/src/components/DocumentPreviewModal/DocumentPreviewModal.test.tsx` — 8 Tests

**Geändert:**
- `webapp/src/components/DocumentItem/DocumentItem.tsx` — `viewUrl`-Prop entfernt, neue `onPreview`-Prop, Ansehen-Button statt -Link
- `webapp/src/components/DocumentItem/DocumentItem.test.tsx` — Tests auf neues Button-Verhalten angepasst (kein `target="_blank"` mehr), 2 neue Tests
- `webapp/src/pages/DocumentsPage.tsx` — `previewDoc`-State, rendert `DocumentPreviewModal` bedingt, `viewUrl` wird jetzt nur noch fürs Preview-Modal statt für `DocumentItem` gebraucht

## Assumptions Made

- Typ-Erkennung ausschließlich über `contentType` (MIME-Type aus der DB), nicht über Dateiendung — robuster, da bereits im `Document`-Typ vorhanden.
- HEIC/HEIF wird wie in `analysis.md` festgelegt als "nicht vorschaufähig" behandelt (Fallback), obwohl es in der Upload-Allowlist ist — Browser-Rendering-Limitation, kein Bug.
- Kein Backend-Change nötig — der bestehende `/api/documents/{id}/view`-Endpoint (aus dem vorherigen Feature) liefert bereits `Content-Disposition: inline`, was für `<iframe src>`/`<img src>` korrekt funktioniert.

## Deviations from arch-decision.md

Keine.

## Technical Debt / Follow-up

Keine neuen Items — nutzt ausschließlich bestehende Patterns/Tokens, keine neuen Lücken.

## Open Items

Keine, die eine Entscheidung des Menschen erfordern.
