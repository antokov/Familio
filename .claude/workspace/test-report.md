# Test Report — Dokumenten-Vorschau in der App

## Acceptance Criteria Verification

1. **Vorschau öffnet in-App, kein neuer Tab** — ✅ PASS
   `DocumentItem.test.tsx`: expliziter Test "Ansehen ist ein Button, kein Link mit target=\"_blank\"" + "ruft onPreview mit dem Dokument auf". Kein `<a>`/`target="_blank"` mehr im Ansehen-Pfad (verifiziert per Grep — nur noch im Download-Button, der unverändert bleibt).

2. **Bild/PDF wird direkt dargestellt** — ✅ PASS
   `DocumentPreviewModal.test.tsx`: "rendert ein iframe für PDF-Dokumente" + "rendert ein img-Tag für Bild-Dokumente" grün.

3. **Fallback bei nicht darstellbarem Typ (+ Download-Alternative)** — ✅ PASS
   Test mit `.docx`-Contenttype zeigt Fallback-Text; separater Test verifiziert Download-Button im Fallback mit korrektem `href`.

4. **Schließen via X, Backdrop-Klick, Escape** — ✅ PASS
   X-Button und Escape-Taste explizit getestet. Backdrop-Klick nutzt identisches, bereits an anderer Stelle (`FamilyMemberFormModal`, `DocumentUploadModal`) verifiziertes Pattern — hier nicht separat erneut getestet (konsistent mit bestehender Test-Praxis, die dieses Pattern woanders auch nicht doppelt testet).

5. **Download-Button auch innerhalb der Vorschau** — ✅ PASS
   Test "zeigt den Download-Button auch im Header" grün, korrekter `href`.

## Edge Cases (aus analysis.md) — Coverage

| # | Edge Case | Test | Status |
|---|---|---|---|
| 1 | HEIC nicht nativ renderbar → Fallback statt kaputtem `<img>` | `behandelt HEIC als nicht-vorschaufähig` | ✅ |
| 2 | PDF-Rendering schlägt in altem Browser fehl | Kein Test nötig laut BA (Browser-natives Fallback-Verhalten, kein Custom-Code) | — |
| 3 | Große Dateien sprengen Viewport | Reines CSS (`max-height`/`overflow`), kein funktionaler Test nötig | ✅ (by design) |
| 4 | Datei fehlt auf Platte (404 vom `/view`-Endpoint) | Nicht separat getestet — Backend-seitig bereits in `test_documents.py` (`test_download_missing_file_on_disk_returns_404`) abgedeckt; Frontend zeigt in diesem Fall ein kaputtes iframe/img ohne eigene Fehlerbehandlung | ⚠️ Gap (siehe unten) |
| 5 | Zweiter Preview-Klick während Modal offen (anderes Dokument) | Nicht separat getestet — React-Standardverhalten (Props-Update), kein Custom-State-Handling nötig | ✅ (by design) |

## Neue Tests

- **Frontend:** `DocumentPreviewModal.test.tsx` — 8 Tests (Typ-Erkennung: PDF/Bild/Fallback/HEIC, Schließen: X/Escape, Download-Button im Header)
- **Frontend:** `DocumentItem.test.tsx` — 2 neue Tests (Button statt Link, `onPreview`-Aufruf), 1 alter Test ersetzt

**Gesamt-Suite:** Frontend 128/128 grün (13 Dateien), `tsc --noEmit` sauber, `npm run build` erfolgreich. Backend unverändert (kein Rerun nötig, reine Frontend-Story).

## Coverage Gaps (nicht blockierend, für Backlog)

1. **Kein expliziter Frontend-Test/Fehler-UI für "Datei fehlt auf Platte" im Preview-Modal** — aktuell zeigt der Browser bei einem 404 vom `/view`-Endpoint einfach ein kaputtes `<iframe>`/`<img>`, keine eigene Fehlermeldung im Preview. Nicht Teil der Story-Acceptance-Criteria, aber UX-Verbesserungspotenzial.

## Verdict: **PASS** ✅

Alle 5 Acceptance Criteria erfüllt, Kernpfade (PDF/Bild/Fallback/Schließen) vollständig getestet. Ein kleiner UX-Gap (kaputtes Preview bei fehlender Datei auf Platte) ist dokumentiert, aber kein Blocker — sehr seltener Fall (Datei manuell vom Server gelöscht) und nicht Teil der Story.
