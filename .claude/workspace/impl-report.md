# Dev Implementation Report — Android-App-Download in den Einstellungen

## Approach

Neue dritte `<section>` "App" in `SettingsPage.tsx` ergänzt, exakt nach arch-decision.md und design-decision.md: Icon-Badge (Smartphone, `--color-primary-subtle`/`--color-primary`, rund, 40px) + Titel/Hint links, Outline-Pill-Button mit Download-Icon rechts. Der Button ist ein natives `<a href="/downloads/familio.apk" download>` — kein React-Router-Link, kein JS-Klick-Handler, damit der Browser den Datei-Download nativ übernimmt.

## Files Changed

- `webapp/src/pages/SettingsPage.tsx` — Import `Smartphone`, `Download` aus `lucide-react` ergänzt; neue `<section>` "App" nach der "Familie"-Section eingefügt.
- `webapp/src/pages/SettingsPage.module.css` — neue Klassen `.appInfo`, `.appIconWrap`, `.downloadBtn` (+ `:hover`/`:active`) ergänzt, ausschließlich mit bestehenden Tokens aus `tokens.css`.
- `webapp/src/pages/SettingsPage.test.tsx` — neuer Test `rendert die App-Sektion mit Download-Link zur APK`: prüft Sichtbarkeit von "App"/"Android-App" sowie `href="/downloads/familio.apk"` und vorhandenes `download`-Attribut auf dem Link.

## Assumptions

- `webapp/public/downloads/` existiert bereits im Repo als Verzeichnis; die eigentliche `familio.apk`-Binärdatei wird **nicht** von Dev abgelegt (siehe analysis.md Edge Case 1 / Out of Scope in story.md) — das ist ein manueller Schritt des Nutzers vor dem nächsten Deployment.
- Vite kopiert `public/` unverändert ins Build-Output, daher keine Änderung an `vite.config.ts` nötig.
- Kein globaler `:focus-visible`-Style-Override im Projekt gefunden, der angepasst werden müsste — Standard-Browser-Fokus-Outline bleibt auf dem neuen `<a>`-Element erhalten (kein `outline: none` gesetzt).

## Deviations from arch-decision.md

Keine.

## Technical Debt / Follow-up

- `familio.apk` liegt aktuell nicht im Arbeitsverzeichnis — Download-Link liefert 404, bis die Datei manuell nach `webapp/public/downloads/familio.apk` gelegt wird. Kein Code-Fix nötig, aber operativ zu beachten vor dem nächsten Deploy.
- Größere APK-Binärdateien direkt im Git-Repo (`webapp/public/`) sind langfristig nicht ideal (Repo-Größe wächst mit jeder neuen App-Version). Als Follow-up denkbar: APK stattdessen auf dem NAS/Coolify-Volume ablegen und per Nginx/Static-Route ausliefern (analog zum bestehenden `UPLOAD_DIR`-Pattern für Dokumente) statt im Webapp-`public/`-Ordner zu versionieren. Nicht Teil dieser Story, da explizit Out of Scope.

## Open Items

Keine, die eine menschliche Entscheidung erfordern.
