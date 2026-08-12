# Blockers — Push-Benachrichtigung für morgige Kalendertermine (21:00 Uhr)

## BLOCKING — OQ-01: FCM-Zugangsdaten

**Kontext:** Für Android-Push-Benachrichtigungen ist Firebase Cloud Messaging (FCM) der Standardweg. Im gesamten Repo gibt es aktuell keine Firebase/FCM-Integration (kein `google-services.json`, kein Server-Key/Service-Account, keine Abhängigkeit in `build.gradle`).

**Frage an den Menschen:** Existiert bereits ein Firebase-Projekt für Familio (inkl. FCM-Server-Credentials für den Backend-Versand), oder muss eines neu angelegt werden? Falls neu: Ich kann die Client-seitige Integration (Android SDK, `google-services.json`-Platzhalter, Backend-Client für den Versand) vorbereiten, aber das Anlegen des Firebase-Projekts selbst und das Herunterladen der Credentials (Service-Account-JSON für den Server, `google-services.json` für die App) sind Schritte, die nur du im Firebase-Konsolen-Account durchführen kannst.

**Optionen:**
- **A)** Firebase-Projekt existiert bereits → bitte Service-Account-JSON (Server) und `google-services.json` (Android) bereitstellen.
- **B)** Kein Firebase-Projekt vorhanden → neu anlegen (kostenlos im "Spark"-Tarif für diesen Anwendungsfall ausreichend), dann Credentials bereitstellen.
- **C)** Alternative zu FCM bevorzugt (z. B. ntfy.sh, selbstgehostet, kein Google-Abhängigkeit) → dann würde sich auch die technische Umsetzung ändern (Architect müsste neu scopen).

---

## BLOCKING — OQ-02: Umsetzung des täglichen 21:00-Uhr-Triggers

**Kontext:** Das Backend hat aktuell **keinen Scheduler**. Wiederkehrende Aufgaben (z. B. Löschen erledigter Tasks/Einkaufseinträge) laufen bewusst als "Lazy Deletion" beim nächsten GET-Request — es gibt keinen Cron-artigen Hintergrundprozess. Für "täglich um 21:00 Uhr" reicht dieses Muster nicht (ein Request muss nicht zufällig um 21:00 Uhr eintreffen).

**Frage an den Menschen:** Wie soll der 21:00-Uhr-Trigger technisch umgesetzt werden?

**Optionen:**
- **A) In-Process-Scheduler (z. B. APScheduler) im FastAPI-Backend:** Läuft im selben Prozess, feuert täglich um 21:00 Uhr. Voraussetzung: Der Backend-Container läuft dauerhaft durch (kein Sleep/Restart durch Coolify o.ä.) — bitte bestätigen, dass das für das aktuelle NAS/Coolify-Deployment zutrifft.
- **B) Externer Cron-Trigger (z. B. Cron-Job auf dem NAS oder Coolify-eigener Scheduled-Job) ruft einen neuen, geschützten Backend-Endpoint auf (z. B. `POST /api/notifications/trigger-daily`):** Entkoppelt vom App-Prozess, robuster gegen Neustarts, braucht aber eine Absicherung des Endpoints (z. B. Shared Secret) und eine manuelle Cron-Einrichtung außerhalb des Repos.
- **C) Sonstiges** (z. B. bereits vorhandene Infrastruktur, die ich noch nicht kenne).

**Empfehlung der BA/PO-Kette:** Keine — dies ist eine reine Infrastruktur-Entscheidung mit Deployment-Auswirkung, die der Architect erst nach deiner Antwort sauber scopen kann.

---

**Status:** RESOLVED durch den Menschen.

- OQ-01: Kein Firebase/FCM — Google-freie, selbstgehostete Push-Lösung (ntfy-Stil).
- OQ-02: Trigger-Entscheidung an SM/Architect delegiert → In-Process-Scheduler (APScheduler) im FastAPI-Backend, da selbstgehosteter Dauerbetrieb (kein Serverless/Kaltstart-Kontext). Architect bestätigt dies für das aktuelle Coolify/NAS-Deployment.

Weiter mit Architect-Phase.
