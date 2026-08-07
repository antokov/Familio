# User Story — Dokumenten-Vorschau in der App

**As a** Familienmitglied
**I want** ein Dokument direkt in der App ansehen können, ohne dass sich ein neuer Browser-Tab öffnet
**So that** ich schnell reinschauen kann (z. B. "welches Dokument ist das nochmal?"), ohne die App zu verlassen oder Tabs aufzuräumen

## Acceptance Criteria

1. **Given** ich bin auf der Dokumente-Seite
   **When** ich bei einem Dokument auf "Ansehen" klicke
   **Then** öffnet sich eine Vorschau **innerhalb der App** (Modal/Overlay) — es öffnet sich **kein** neuer Browser-Tab

2. **Given** das Dokument ist ein Bild (jpg/jpeg/png/gif/heic) oder PDF
   **When** die Vorschau öffnet
   **Then** wird der Inhalt direkt sichtbar dargestellt (Bild bzw. gerendertes PDF)

3. **Given** das Dokument ist ein Dateityp, der sich nicht sinnvoll im Browser darstellen lässt (z. B. .docx, .xlsx, .zip)
   **When** die Vorschau öffnet
   **Then** wird ein Hinweis "Vorschau für diesen Dateityp nicht verfügbar" angezeigt, mit einem Download-Button als Alternative — kein leeres/kaputtes Preview-Fenster

4. **Given** die Vorschau ist offen
   **When** ich auf Schließen (X-Button, Klick außerhalb, oder Escape) klicke
   **Then** schließt sich die Vorschau und ich bin wieder auf der Dokumente-Liste

5. **Given** die Vorschau ist offen
   **When** ich stattdessen die Datei herunterladen will
   **Then** gibt es einen Download-Button auch innerhalb der Vorschau

## Out of Scope

- Zoom/Pan-Steuerung für Bilder oder PDFs (Browser-native PDF-Controls reichen)
- Mehrseitige PDF-Navigation über eigene UI (Browser-natives PDF-Rendering übernimmt das)
- Vorschau-Generierung für Office-Dokumente (Thumbnails/Konvertierung serverseitig)
- Ändern des bestehenden Download-Buttons (bleibt wie er ist)
