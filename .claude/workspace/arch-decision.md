# Architect Scope — Dokumenten-Vorschau in der App

## Reuse / Extend

- Modal-Pattern (`.backdrop`/`.modal`/Header mit Close-Button) von `DocumentUploadModal`/`FamilyMemberFormModal` — aber breiter/höher dimensioniert für Inhalts-Darstellung statt Formular.
- Bestehende `viewUrl()` aus `useDocuments.ts` (liefert bereits `Content-Disposition: inline` vom Backend) — kein Backend-Change nötig.
- `doc.contentType` (bereits im `Document`-Typ vorhanden) zur Typ-Erkennung, statt Dateiendung zu parsen.
- State-Pattern von `TasksPage.tsx` (`editingTask`-State + bedingtes Modal-Rendering) als Vorlage für `previewDoc`-State in `DocumentsPage.tsx`.

## Neue Dateien

1. `webapp/src/components/DocumentPreviewModal/DocumentPreviewModal.tsx` + `.module.css` — neues Preview-Modal

## Geänderte Dateien

2. `webapp/src/components/DocumentItem/DocumentItem.tsx` — "Ansehen"-Link (`<a target="_blank">`) wird zu `<button onClick={() => onPreview(doc)}>`; neue Prop `onPreview: (doc: Document) => void` ersetzt die bisherige Verwendung von `viewUrl` in diesem Component (wird nicht mehr direkt hier gebraucht — wandert ins Modal)
3. `webapp/src/pages/DocumentsPage.tsx` — neuer State `previewDoc: Document | undefined`, rendert `DocumentPreviewModal` bedingt, reicht `onPreview` an `DocumentItem` durch
4. `webapp/src/components/DocumentItem/DocumentItem.test.tsx` — bestehender "Ansehen-Link öffnet neuen Tab"-Test muss auf neues Button-Verhalten angepasst werden (kein `target="_blank"` mehr)

## Patterns, die Dev befolgen MUSS

- **Typ-Erkennung rein über `contentType`** (nicht Dateiendung): `contentType === 'application/pdf'` → PDF-Branch; `contentType.startsWith('image/') && contentType !== 'image/heic' && contentType !== 'image/heif'` → Bild-Branch; sonst Fallback.
- **PDF-Rendering:** `<iframe src={viewUrl} title={doc.filename} />`, volle Breite/Höhe des Modal-Body.
- **Bild-Rendering:** `<img src={viewUrl} alt={doc.filename} />` mit `max-width: 100%; max-height: 100%; object-fit: contain`.
- **Fallback:** Text "Vorschau für diesen Dateityp nicht verfügbar" + Download-Button (gleiche Aktion wie der bestehende Download-Button in `DocumentItem`).
- **Schließen:** Backdrop-Klick + X-Button (bestehendes Pattern aus `FamilyMemberFormModal`) — zusätzlich Escape-Taste ergänzen (`useEffect` mit `keydown`-Listener), da laut AC4 explizit gefordert.
- **Download-Button innerhalb des Modals:** normaler `<a href={downloadUrl}>`-Link wie in `DocumentItem`, keine neue Logik.
- **`onPreview`-Prop-Signatur:** `(doc: Document) => void` — reicht das ganze Dokument-Objekt durch (analog `onEdit: (task: Task) => void` in `TaskItem`), damit `DocumentsPage` sowohl `contentType` für die Typ-Erkennung als auch `viewUrl(doc.id)`/`downloadUrl(doc.id)` daraus ableiten kann.

## Explizite Constraints (was Dev NICHT tun soll)

- Kein `target="_blank"` mehr irgendwo im Ansehen-Flow — das ist der explizite Auftrag dieser Story.
- Keine PDF.js-Integration oder externe Preview-Library — natives Browser-`<iframe>`-PDF-Rendering reicht (jeder moderne Browser kann PDFs in iframes rendern).
- Kein HEIC-zu-JPEG-Konvertierungsversuch (weder client- noch serverseitig) — HEIC bleibt Fallback-Fall.
- Download-Button in `DocumentItem` selbst bleibt unverändert (weiterhin normaler `<a>`-Download-Link, kein Modal-Bezug).

## Dev-Kontext (max. Dateien für Implementierung)

`DocumentItem.tsx`, `DocumentUploadModal.tsx` + `.module.css` (Modal-Pattern-Vorlage), `DocumentsPage.tsx`, `types/document.ts`, `TasksPage.tsx` (State-Pattern-Vorlage)
