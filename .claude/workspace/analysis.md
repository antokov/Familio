# BA Analysis — Android-App-Download in den Einstellungen

## 1. Business Rules

1. Der Download-Link zeigt immer auf den statischen Pfad `/downloads/familio.apk` (relativ zur Webapp-Origin) — kein API-Call, keine Backend-Beteiligung.
2. Vite kopiert alles unter `webapp/public/` unverändert in den Build-Output (`dist/`) unter dem gleichen relativen Pfad. `webapp/public/downloads/familio.apk` → `/downloads/familio.apk` zur Laufzeit. Kein Build-Schritt nötig.
3. Der Link/Button muss ein natives `<a href="/downloads/familio.apk" download>`-Element sein (kein `<button onClick={() => navigate(...)}>`), damit der Browser den Download auslöst statt React-Router-Navigation zu versuchen.
4. Der neue Abschnitt fügt sich als weitere `<section>` in `SettingsPage.tsx` ein, analog zu "Darstellung" und "Familie" (gleiche Card-/Section-Struktur, `styles.section` / `styles.card` / `styles.settingRow`).
5. Es gibt keinen Bezug zu Familienmitgliedern oder Auth — der Abschnitt ist statisch und für alle Nutzer identisch sichtbar.

## 2. Edge Cases

1. **APK-Datei fehlt zur Laufzeit** (z. B. lokal noch nicht abgelegt, oder beim Deployment vergessen): Klick auf den Link führt zu einem Browser-eigenen 404 (kein Custom-Error-Handling nötig/möglich bei einem reinen `<a>`-Tag). Aktuell (Stand dieser Story) existiert `webapp/public/downloads/` bereits als Verzeichnis, aber **ohne** `familio.apk` — muss vom Nutzer manuell nachgelegt werden. Nicht blockierend für die Implementierung, aber der Download funktioniert erst, sobald die Datei tatsächlich da liegt.
2. **Browser-Verhalten bei `download`-Attribut:** Manche mobile Browser (v. a. iOS Safari) ignorieren `download` und öffnen die Datei stattdessen inline/in neuem Tab. Kein Blocker — akzeptables Verhalten, da die Zielgruppe (Android-Nutzer) korrekt bedient wird.
3. **Dark/Light Theme:** Neuer Abschnitt muss bestehende CSS-Tokens nutzen, kein Hardcoding von Farben.
4. **Lange Dateigröße / langsame Verbindung:** Kein spezielles Loading-UI nötig — natives Browser-Download-Verhalten reicht (kein Fetch/Blob-Download nötig, da es sich um einen einfachen statischen Link handelt).
5. **Sicherheitsaspekt:** Da `familio.apk` unsigniert sein könnte, kein Anti-Virus-Scan o.ä. im Scope — reine Bereitstellung, kein Signierungs-/Vertrauens-Handling in dieser Story.

## 3. Data Model Implications

- Keine. Keine neuen DB-Felder, keine neuen API-Endpunkte, keine neuen Pydantic-Schemas. Rein statisches Frontend-Asset + UI-Element in `webapp/src/pages/SettingsPage.tsx` und `SettingsPage.module.css`.

## 4. Open Questions

1. *(NON-BLOCKING)* Soll der Link zusätzlich in der Android-App selbst angezeigt werden (z. B. Settings-Screen dort, um Familienmitgliedern ohne die App den Link teilen zu lassen)? — Da die Android-App die APK nicht sinnvoll "für sich selbst" anbieten muss (wer sie nutzt, hat sie bereits), wird das als Out-of-Scope behandelt (siehe story.md). Dev kann optional einen Hinweistext einbauen, ist aber nicht Teil der AC.
2. *(NON-BLOCKING)* Soll der Abschnitt einen Hinweis wie "nur für Android" oder ein Android-Icon bekommen? Empfehlung: ja (AC 4), aber genaue Formulierung/Icon ist Design-Entscheidung, nicht BA-Scope.
3. *(NON-BLOCKING)* Muss die tatsächliche `familio.apk`-Datei in diesem Story-Durchlauf abgelegt werden? Nein — das Repository hat bereits `webapp/public/downloads/` als Verzeichnis; das Ablegen der eigentlichen Binärdatei ist ein manueller Deployment-Schritt außerhalb des Code-Reviews (Binärdatei im Git-Repo ist ohnehin fraglich, siehe Architect-Phase für Empfehlung zu `.gitignore`).

Keine BLOCKING-Fragen. Weiter zu Phase 3 (Architect).
