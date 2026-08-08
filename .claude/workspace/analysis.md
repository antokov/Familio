# BA Analysis — Termine aus Dokument extrahieren

## Business Rules

1. Der "Termine extrahieren"-Button ist nur für Dokumente mit `content_type` `application/pdf` oder `image/{jpeg,png,gif,webp}` sichtbar/aktiv. Für alle anderen Typen (Office, txt, heic, zip) ist er nicht verfügbar.
2. Die Extraktion läuft synchron im Request-Response-Zyklus (kein Background-Job/Queue) — bei wenigen Seiten dauert das wenige Sekunden, ein Ladezustand im UI reicht.
3. Das Extraktionsergebnis wird **nicht** in der Datenbank gespeichert. Es gibt kein neues "candidate events"-Modell — die Vorschläge leben nur im Frontend-State, bis der Nutzer im Review-Dialog bestätigt.
4. Jeder vom Nutzer bestätigte Vorschlag wird über den bereits bestehenden `POST /api/events`-Endpoint angelegt (sequenziell, ein Request pro Termin) — kein neuer Bulk-Create-Endpoint nötig.
5. Die KI muss Datum/Uhrzeit im ISO-8601-Format liefern, damit das Ergebnis direkt mit dem bestehenden `EventCreate`-Schema kompatibel ist. Das wird über Structured Outputs (`output_config.format` mit JSON-Schema) erzwungen — kein Freitext-Parsing per Regex.
6. Fehlt im Dokument eine Uhrzeit zu einem Termin, wird er als ganztägig behandelt (Start `00:00`, Ende `23:59` desselben Tages als Default) — im Review-Dialog vom Nutzer korrigierbar.
7. `ANTHROPIC_API_KEY` ist ein neues, optionales Environment-Secret. Ist es nicht gesetzt, liefert der Endpoint einen klaren Fehler (503) statt eines Crashs.
8. Kosten pro Extraktion liegen im niedrigen Cent-Bereich (Modell: Sonnet 5) — kein Rate-Limiting/Kostendeckel in v1 nötig.

## Edge Cases

1. **Keine Termine erkannt** → API liefert leere `events`-Liste, Frontend zeigt "Keine Termine gefunden" statt leerem Dialog.
2. **Sehr viele Termine** (> 50) → Review-Liste muss scrollbar sein; kein Hard-Limit in v1. Output ist durch `max_tokens` des Modells begrenzt (Truncation-Risiko bei extrem langen Dokumenten — akzeptiertes Risiko für v1).
3. **Mehrseitiges Dokument** → App-seitiges Upload-Limit von 20 MB ist der praktische Deckel; Sonnet 5 hat 1M-Context-Fenster, das reicht für typische Quartalspläne locker.
4. **Mehrdeutiges/fehlendes Jahr** im Dokument (z. B. "15. März" ohne Jahreszahl) → Prompt muss die KI explizit anweisen, das Jahr aus dem Dokumentkontext (Deckblatt, Zeitraum-Angabe) abzuleiten, notfalls aktuelles/nächstes plausibles Jahr zu wählen.
5. **Claude API nicht erreichbar / Timeout / Rate-Limit / kein API-Key** → sauberer Fehler im UI, kein Absturz, keine Termine angelegt.
6. **Doppelklick auf "Termine extrahieren"** → Button muss während laufendem Request disabled sein (kein Doppel-Call, keine doppelten Kosten).
7. **Überschneidung mit bestehendem Kalendertermin** → keine automatische Konflikterkennung in v1 (Termine werden wie bei manueller Eingabe einfach angelegt).
8. **Nutzer bearbeitet Vorschlag im Review-Dialog, Ende liegt vor Start** → gleiche Validierungslogik wie im bestehenden `EventFormModal` (Start < Ende).
9. **Nicht unterstützter Dateityp wird trotzdem angefragt** (z. B. manipulierter Request) → Backend validiert `content_type` serverseitig zusätzlich zur UI-Sperre (415 Unsupported Media Type).

## Data Model Implications

- **Kein neues DB-Modell.** Die Extraktion ist ein reiner Analyse-Schritt, kein persistenter State.
- **Neue Pydantic-Response-Schemas** (nicht DB-gebunden): `ExtractedEvent` (title, start_dt, end_dt) und `ExtractEventsResponse` (events: list[ExtractedEvent]).
- **Neue Config-Werte** in `Settings`: `anthropic_api_key: str | None`, `anthropic_model: str` (Default `"claude-sonnet-5"`).
- **Neue Dependency**: `anthropic`-Python-SDK in `requirements.txt`.
- Bestehendes `CalendarEvent`-Modell/Schema bleibt unverändert — extrahierte Termine werden 1:1 über `EventCreate` (bestehend) angelegt, ganz ohne Attendees (leere Liste), analog zur manuellen Eingabe ohne Zuweisung.

## Open Questions

**BLOCKING:** Keine. Die zentralen Entscheidungen (Review-Pflicht vor Anlage, unterstützte Formate, Modellwahl Sonnet 5, Default-Ganztags-Zeit bei fehlender Uhrzeit) wurden bereits im Vorgespräch mit dem Nutzer geklärt bzw. sind vertretbare, im Review-Schritt korrigierbare Standardannahmen für ein v1.

**NON-BLOCKING (Annahmen, dokumentiert):**
- Default bei fehlender Uhrzeit: ganztägig (00:00–23:59), nicht z. B. "09:00–10:00" — nachvollziehbarer für Nutzer, im Review korrigierbar.
- Keine Attendee-Zuweisung im Review-Dialog — hält v1 schlank, passt zum "Out of Scope" der Story.
- Kein Kostendeckel/Rate-Limit in v1 — Kosten sind vernachlässigbar für eine Familien-App mit gelegentlichen Uploads.
