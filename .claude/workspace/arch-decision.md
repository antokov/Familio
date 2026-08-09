# Architect Decision — Android-App-Download in den Einstellungen

## 1. Codebase Scan (relevant excerpt)

- `webapp/src/pages/SettingsPage.tsx` — bestehende Settings-Seite mit zwei `<section>`-Blöcken ("Darstellung", "Familie"), jeweils `styles.section` → `h2.sectionTitle` + `div.card` → `div.settingRow` (Label/Hint links, Control rechts).
- `webapp/src/pages/SettingsPage.module.css` — Styles für obige Struktur (Tokens: `--space-*`, `--color-*`, `--radius-*`, `--font-size-*`).
- `webapp/public/downloads/` — existiert bereits im Repo als leeres Verzeichnis (kein `.gitkeep` gefunden, kein Git-Tracking eines leeren Ordners). Die eigentliche `familio.apk` liegt (laut Task) dort, ist aber aktuell **nicht** im Arbeitsverzeichnis vorhanden — muss vom Nutzer manuell nachgelegt werden (Out of Scope für Dev, siehe analysis.md).
- Vite-Standardverhalten: alles unter `webapp/public/` wird 1:1 nach `/` im Build-Output gemappt — kein `vite.config.ts`-Eingriff nötig. Kein separater Check nötig, `vite.config.ts` unverändert lassen.
- Kein Backend-Bezug — reines Frontend-Static-Asset + UI.

## 2. Reuse

- Bestehendes Card-/Section-Pattern aus `SettingsPage.tsx`/`.module.css` wird 1:1 wiederverwendet (dritte `<section>` nach "Familie").
- Icon-Library `lucide-react` ist bereits Projektabhängigkeit (siehe Imports `Pencil, Trash2, Plus`) — für den neuen Abschnitt bietet sich `Download` oder `Smartphone` aus `lucide-react` an (Design-Entscheidung in Phase 3b).

## 3. Files Dev Must Touch

1. `webapp/src/pages/SettingsPage.tsx` — neue `<section>` "App" mit Download-Link (`<a href="/downloads/familio.apk" download>`).
2. `webapp/src/pages/SettingsPage.module.css` — ggf. neue/erweiterte Klassen für den Download-Button, falls das bestehende `settingRow`-Pattern nicht ausreicht (z. B. Button-artige CTA statt reinem Info-Row).
3. `webapp/src/pages/SettingsPage.test.tsx` — Test ergänzen: neuer Abschnitt vorhanden, Link zeigt auf korrekten `href`, hat `download`-Attribut.

Keine weiteren Dateien nötig. Kein Router-/API-/Backend-Code betroffen.

## 4. Patterns Dev Must Follow

- Gleiche Section-/Card-Struktur wie bestehende Abschnitte (`styles.section`, `styles.sectionTitle`, `styles.card`).
- CSS ausschließlich über bestehende Design-Tokens aus `webapp/src/styles/tokens.css` (keine Hex-Werte hardcoden).
- Reines statisches `<a>`-Tag für den Download — **kein** `fetch`/Blob-Download, kein JS-Klick-Handler nötig (Business Rule 3 in analysis.md).
- Deutsche UI-Texte (Projektkonvention, siehe restliche Settings-Seite: "Darstellung", "Familie", "Mitglied hinzufügen").
- Test-Datei folgt bestehendem Muster in `SettingsPage.test.tsx` (React Testing Library, siehe vorhandene Tests für Struktur/Query-Stil).

## 5. Explicit Constraints (What NOT to do)

- **NICHT** die eigentliche `familio.apk`-Binärdatei erzeugen oder committen — das ist ein manueller Nutzer-Schritt außerhalb dieses Story-Durchlaufs.
- **NICHT** `react-router-dom`-`<Link>` oder `navigate()` für den Download verwenden — SPA-Navigation ist hier falsch, es muss ein natives `<a href="..." download>` sein.
- **NICHT** User-Agent-Sniffing oder Plattform-Erkennung einbauen (Out of Scope laut PO).
- **KEINE** Versions-/Update-Logik, kein Änderungen an `vite.config.ts`.
- **KEINE** Änderungen an der Android-App (`android/`) — Feature ist auf die Webapp-Settings-Seite beschränkt.
- Bestehende zwei Sections ("Darstellung", "Familie") nicht umbauen, nur um eine dritte ergänzen.

## 6. Files Dev Needs in Context (max 5–8)

1. `webapp/src/pages/SettingsPage.tsx`
2. `webapp/src/pages/SettingsPage.module.css`
3. `webapp/src/pages/SettingsPage.test.tsx`
4. `webapp/src/styles/tokens.css` (Tokens nachschlagen)
5. `.claude/workspace/story.md`
6. `.claude/workspace/analysis.md`
7. `.claude/workspace/design-decision.md` (folgt in Phase 3b)

## Blocker Check

Keine Architektur-Risiken, die eine menschliche Entscheidung erfordern (kein neuer Backend-Layer, keine neue Abhängigkeit, kein DB-Schema-Change). Weiter zu Phase 3b (Design), da `webapp/src/` betroffen ist.
