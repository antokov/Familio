# User Story — Android-App-Download in den Einstellungen

**As a** Familienmitglied, das die Webapp nutzt
**I want** in den Einstellungen einen Download-Link für die native Android-App finden
**So that** ich die App auf mein Android-Gerät installieren kann, ohne die APK-Datei manuell suchen zu müssen

---

## Acceptance Criteria

1. **Given** ich bin auf der Einstellungen-Seite der Webapp,
   **When** die Seite geladen ist,
   **Then** sehe ich einen neuen Abschnitt "App" (o.ä.) mit einem Button/Link "Android-App herunterladen".

2. **Given** der Download-Bereich ist sichtbar,
   **When** ich auf "Android-App herunterladen" klicke,
   **Then** startet der Download von `/downloads/familio.apk` (bzw. wird die Datei in einem neuen Tab geöffnet, je nach Browser-Verhalten), ohne dass die Seite neu geladen oder die SPA-Navigation ausgelöst wird.

3. **Given** die APK-Datei liegt unter `webapp/public/downloads/familio.apk`,
   **When** die Webapp gebaut/deployed wird (Vite `public/`-Verzeichnis),
   **Then** ist die Datei unverändert unter `/downloads/familio.apk` erreichbar (Vite kopiert `public/`-Inhalte 1:1 ins Build-Output).

4. **Given** ich nutze bereits die native Android-App,
   **When** ich den Download-Link in der Webapp sehe,
   **Then** ist klar erkennbar, dass es sich um die Android-App handelt (z. B. Hinweistext/Icon), damit iOS-/Desktop-Nutzer nicht verwirrt werden.

5. **Given** Darstellung im Light- und Dark-Theme,
   **When** ich den neuen Settings-Abschnitt betrachte,
   **Then** folgt er optisch den bestehenden Settings-Karten (gleiche Tokens, gleicher Card-Stil wie "Darstellung"/"Familie").

---

## Out of Scope

- Kein automatisches Erkennen der Nutzer-Plattform (z. B. User-Agent-Sniffing, um den Button nur auf Android-Geräten anzuzeigen) — der Link wird immer angezeigt.
- Kein Versions-/Update-Hinweis (z. B. "Version 1.2.3", Changelog, Update-Notification bei neuer APK) — reiner statischer Download-Link.
- Kein automatisierter Build-/Upload-Prozess, der die APK bei jedem Release automatisch nach `webapp/public/downloads/` kopiert — die Datei wird weiterhin manuell dort abgelegt.
- Keine Änderung an der Android-App selbst (kein In-App-Update-Check).
- Kein Download-Zähler oder Analytics-Tracking für den Klick.
