# User Story — Termine aus Dokument extrahieren

**As a** Familienmitglied
**I want** aus einem bereits hochgeladenen Dokument (z. B. Kita-/Schul-Quartalsplan als PDF oder Foto) automatisiert Terminvorschläge generieren lassen, die ich vor der Übernahme prüfen und bearbeiten kann
**So that** ich nicht jeden Termin einzeln manuell in den Kalender eintragen muss

## Acceptance Criteria

**AC1 — Extraktion starten**
Given ein PDF- oder Bild-Dokument ist bereits in der Dokumente-Liste hochgeladen,
When ich auf "Termine extrahieren" klicke,
Then wird das Dokument an die Claude API geschickt und die App zeigt einen Ladezustand, während die Extraktion läuft.

**AC2 — Review vor Übernahme (Pflicht-Schritt)**
Given die Extraktion war erfolgreich,
When das Ergebnis zurückkommt,
Then zeigt die App einen Review-Dialog mit allen erkannten Terminvorschlägen (Titel, Datum, Start-/Endzeit), jeder Vorschlag ist editierbar und einzeln ab-/anwählbar — es wird noch NICHTS gespeichert.

**AC3 — Termine übernehmen**
Given ich habe die Vorschläge im Review-Dialog geprüft,
When ich auf "Termine übernehmen" klicke,
Then werden nur die ausgewählten Termine als echte Kalendereinträge über die bestehende Events-API angelegt, und ich sehe eine Bestätigung (z. B. "3 Termine angelegt").

**AC4 — Keine Termine gefunden**
Given das Dokument enthält keine erkennbaren Termine,
When die Extraktion abgeschlossen ist,
Then zeigt die App eine verständliche Meldung ("Keine Termine im Dokument gefunden") statt eines leeren oder kaputten Dialogs.

**AC5 — Fehlerfall**
Given die Claude-API meldet einen Fehler (kein API-Key konfiguriert, Netzwerkfehler, Rate-Limit, nicht unterstütztes Dateiformat),
When das passiert,
Then zeigt die App eine verständliche Fehlermeldung und legt keine Termine an.

## Out of Scope

- Automatisches Anlegen von Terminen **ohne** Review-Schritt — der Review ist bewusst verpflichtend (Sicherheitsnetz gegen Fehlextraktion), kein "One-Click-Autocreate".
- Extraktion aus Office-Formaten (.doc/.docx/.xls/.xlsx/.ppt/.pptx) — nur PDF und Bilder (JPEG/PNG/GIF/WebP) in v1. Diese Formate bleiben weiterhin normal hochladbar, nur der "Termine extrahieren"-Button ist dafür nicht verfügbar.
- Erkennung/Anlage von wiederkehrenden Terminen — jeder erkannte Termin wird als einzelner, nicht-wiederkehrender Termin angelegt.
- Automatische Zuweisung an ein Familienmitglied im Review-Dialog — Zuweisung erfolgt bei Bedarf danach wie gewohnt über die Kalender-Bearbeitung.
- Android-App — v1 ist Web-only, Android-Parität ist eine Folge-Story.
- Konflikterkennung mit bestehenden Terminen im Kalender.
