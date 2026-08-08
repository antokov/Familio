# Project Backlog

## 🔴 Technical Debt
<!-- Items added by Architect post-dev review -->
<!-- Format: - [ ] TD-XX: description (introduced in: feature name, file: path) -->
- [x] TD-11: `--quickadd-bar-height: 64px` Token in tokens.css eingeführt; ShoppingPage.module.css verwendet `var(--quickadd-bar-height)` (resolved in: TD-11)
- [ ] TD-10: `QuickAddBar` hat keine Unit-Tests — Fokus-Reset, Enter-Submit, unit-Persistenz, Doppel-Submit-Schutz nicht automatisch abgedeckt (introduced in: Schnellerfassung Einkaufsliste, file: `webapp/src/components/QuickAddBar/`)
- [ ] TD-08: `useShoppingListApi` hat keine Hook-Tests (fetch-Mock via vi.fn) — gehört zum Scope von FS-20 (useTasksApi Hook-Tests)
- [ ] TD-06: FamilyMemberFormModal hat keine eigenen Unit-Tests (Eingabe, Farb-Swatch, Submit, Inline-Error) — introduced in: FS-22, file: `webapp/src/components/FamilyMemberFormModal/`
- [ ] TD-07: BA/Architect-Checklist ergänzen: Grep nach allen Imports von zu löschenden Konstanten vor arch-decision.md (EventFormModal-Consumer-Discovery-Lücke in FS-22)
- [ ] TD-12: `useDocuments` hat keine Hook-Tests — konsistent mit TD-08/FS-17/FS-20 (introduced in: Dokumente, file: `webapp/src/hooks/useDocuments.ts`)
- [ ] TD-13: `DocumentsPage` + `DocumentUploadModal` haben keine Render-Tests — konsistent mit TD-06 (introduced in: Dokumente, files: `webapp/src/pages/DocumentsPage.tsx`, `webapp/src/components/DocumentUploadModal/`); Scope umfasst jetzt auch die Extraktions-Verdrahtung (`handleExtract`, Error-/Success-Banner) aus "Termine aus Dokument extrahieren"
- [ ] TD-14: `document_extraction.py` — die echten `anthropic.APIStatusError`/`APIConnectionError`-Exception-Pfade sind ungetestet (nur der generische `DocumentExtractionError`-Mapping-Pfad im Router ist abgedeckt, da die SDK-Exceptions ohne echte Response-Objekte schwer zu mocken sind) (introduced in: Termine aus Dokument extrahieren, file: `backend/app/services/document_extraction.py`)

## 🟡 Follow-up Stories
<!-- Items deferred by Dev or identified by Tester -->
<!-- Format: - [ ] FS-XX: description -->
- [ ] FS-23: Online-Status per Mitglied editierbar / Presence-System (WebSocket oder Polling) — aktuell hardcoded in constants/family.ts (deferred from FS-04)
- [ ] FS-07: useTasks renderHook-Test (completeTask wiederkehrend → neue Instanz in openTasks)
- [ ] FS-09: Alembic-Migrationen einrichten (für PostgreSQL/NAS-Deployment; ersetzt `create_all` im lifespan) — **kritisch:** ohne Alembic führt jede neue Spalte zu 500-Fehlern auf bestehenden DBs (aufgetreten: completed_at in tasks)
- [ ] FS-10: camelCase-Aliases in Pydantic-Schemas für Frontend-Kompatibilität (`dueDate`, `assigneeInitials` etc.)
- [ ] FS-11: Recurrence-Logik (getNextDueDate) in `backend/app/services/tasks.py` extrahieren
- [ ] FS-13: Termin löschen — DELETE-Button im Edit-Modal
- [ ] FS-21: `eventsByDay` in `WeekView.tsx` verwendet `ev.startDt.slice(0,10)` — auf `new Date()` umstellen (gleiche Fragility wie TD-05, introduced in: FS-15, file: `webapp/src/components/WeekView/WeekView.tsx`)
- [ ] FS-16: Render-Tests für MonthView, WeekView, EventFormModal, CalendarPage
- [ ] FS-17: useEvents Hook-Tests (API-Mock via MSW oder vi.fn)
- [ ] FS-20: useTasksApi Hook-Tests (fetch-Mock via vi.fn, alle CRUD-Operationen + Recurring-Edge-Case)
- [ ] FS-19: DashboardPage API-Fetches testen (vi.fn fetch-Mock) — jetzt 3 Fetches: tasks, events, shopping
- [ ] FS-24: ShoppingItem + ShoppingFormModal Render-Tests (Checkbox-Toggle, Badge, Inline-Delete-Confirm, Form-Submit) (deferred from Einkaufsliste v1)
- [ ] FS-26: AvatarBadge.test.tsx reparieren — CSS Module Klassen-Hashing (`_lg_60b07b` statt `lg`) — Vitest-Config oder `cssModules: { localsConvention: 'camelCase' }` prüfen (pre-existing failure, surfaced in Einkaufsliste v1 test run) — **BEHOBEN als Nebeneffekt von FS-22 via `classNameStrategy: 'non-scoped'` in vite.config.ts**
- [ ] FS-28: Explizite Backend-Tests für leeren/fehlenden `file`-Multipart-Feld-Request bei `POST /api/documents` (aktuell nur implizit durch FastAPI-Validierung abgedeckt, nicht separat verifiziert) (introduced in: Dokumente)
- [ ] FS-29: `DocumentPreviewModal` zeigt bei fehlender Datei auf der Platte (404 vom `/view`-Endpoint) aktuell ein kaputtes `<iframe>`/`<img>` statt einer Fehlermeldung — `onError`-Handler ergänzen, der auf den Fallback-Zustand umschaltet (introduced in: Dokumenten-Vorschau in der App)
- [ ] FS-30: Mehrtägige Termine im Quellendokument (z. B. "Ferien 20.–31.07.") werden von der Extraktion aktuell nur mit ihrem Startdatum als eintägiger Termin übernommen — Extraktions-Schema müsste `end_date` statt nur `date` unterstützen (introduced in: Termine aus Dokument extrahieren, file: `backend/app/services/document_extraction.py`)
- [ ] FS-31: Android — "Termine aus Dokument extrahieren" nachziehen (Web-only in v1), analog zum bestehenden Dokumente/Kalender-Feature-Set der Android-App (introduced in: Termine aus Dokument extrahieren)

## 🟢 Feature Ideas
<!-- Ideas that came up during implementation but are out of scope -->
<!-- Format: - [ ] FI-XX: description -->

## 🔵 Open Questions
<!-- Unresolved assumptions from BA analysis -->
<!-- Format: - [ ] OQ-XX: question (raised in: feature name) -->

## 🏛️ Architecture Log
<!-- One-line per feature: key structural decision made -->
<!-- Format: - [Feature Name]: summary of decision -->
- [WebApp Grundgerüst]: Vite + React 18 + react-router-dom v6 Layout-Route; Dark/Light via `data-theme` auf `<html>`; CSS Modules + Custom Properties; kein UI-Framework
- [Design-Redesign]: Nunito-Font, Forest-Green Primary (#2E6B4A), Warm-Linen Background (#F5F3EF); DashboardWidget-Component; kreisförmige Checkbox als Signature-Element
- [Aufgaben-Feature]: useTasks Hook + localStorage (analog useTheme); getNextDueDate als pure fn (testbar ohne React); TaskItem/TaskFormModal als named exports; DashboardPage auf echte useTasks-Daten umgestellt
- [Backend-Grundgerüst]: FastAPI + SQLAlchemy 2.0 async; DATABASE_URL treibt SQLite↔PostgreSQL ohne Code-Umbau; `create_all` im lifespan für Dev; Tests mit in-memory SQLite via Dependency-Override
- [Familienkalender]: MonthView + WeekView selbst implementiert (keine externe Library); useEvents Hook direkt gegen API (kein localStorage); `fromApi()` für snake_case→camelCase; Aktueller-Zeit-Strich (red, var(--color-accent)) als Signature-Element in WeekView
- [Termin bearbeiten + Dashboard API]: PUT /api/events/{id} mit TZ-sicherer Validierung; EventFormModal im Edit-Modus; DashboardPage ohne localStorage — beide Widgets direkt gegen API; unabhängige Loading/Error-States
- [Aufgaben-API-Migration]: Neuer Hook `useTasksApi` mit identischer Schnittstelle zu `useTasks`; `fromApi()`/`toApi()` Adapter; Recurring-Task-Logik via `getNextDueDate`-Import; `useTasks` bleibt für Tests; TasksPage wechselt komplett auf API
- [TD-01 Font Local Hosting]: Nunito v32 ist Variable Font — 5 WOFF2-Subset-Dateien decken alle Gewichte 400–800 ab; `font-weight: 400 800` Range-Syntax in `@font-face`; `webapp/public/fonts/` → Vite kopiert in `dist/` ohne Config-Änderung
- [TD-02 FAMILY_MEMBERS Refactor]: `webapp/src/constants/` als neue Leaf-Schicht eingeführt — reine Datenkonstanten ohne React-Abhängigkeiten; `FamilyMember` Interface mit `online: boolean` für alle Consumer (Sidebar nutzt es, Modals ignorieren es)
- [TD-03 gitignore]: Root `.gitignore` für Monorepo erstellt — ein File, drei Layer (Python/Node/Android); `backend/*.db` statt Root-`*.db` um Scope eng zu halten; `!.env.example` Negation als Future-Safety
- [TD-04 VITE_API_URL]: `webapp/src/api/` Layer etabliert mit `config.ts` als erstem Modul; `??` statt `||` für Nullish-only-Fallback; `vite-env.d.ts` für TypeScript-Coverage von Vite env-Vars
- [TD-05 Robust DateTime Parsing]: `new Date(isoStr)` + lokale Accessoren (`getHours`, `getMinutes`, `getFullYear`, `getMonth`, `getDate`) statt `slice` — robuster gegenüber Mikrosekunden und TZ-Suffixen; `toLocaleTimeString` bewusst NICHT verwendet (locale-abhängiges Format inkompatibel mit `<input type="time">`)
- [FS-15 WeekView Overlap]: Transitive Cluster-Erkennung + greedy Column-Assignment in `computeEventLayout()` (exported pure fn); `calc(X% + 3px)` inline styles für `left`/`right`; `totalCols` pro Cluster (nicht global) — isolierte Events behalten volle Breite
- [FS-04 Settings-Seite]: `AppShellOutletContext` (exportierter Typ) + `<Outlet context={...}>` Pattern etabliert — Theme-State fließt ohne zweiten `useTheme()`-Call in Pages; Sidebar-Settings-Button zu NavLink mit active-State; kein neuer React-Context-Provider nötig
- [FS-01 useSidebar Tests]: `renderHook` + `act` Pattern; `Object.defineProperty(window, 'innerWidth')` + `dispatchEvent` für Resize-Simulation; `vi.spyOn` für Cleanup-Verifikation
- [FS-02 AvatarBadge Tests]: Explizite Assertions über `toHaveClass` + `toHaveStyle` + `querySelector('.dot')` — kein `toMatchSnapshot()`; CSS Module Identity-Proxy in jsdom erlaubt direkte Klassenname-Assertions
- [FS-03 Mobile-Drawer Tests]: `userEvent.setup()` + async/await für Interaktionen; `getByRole('complementary')` für `<aside>`; `querySelector('[aria-hidden="true"]')` für Overlay; `localStorage.clear()` in beforeEach gegen Theme-State-Carryover
- [Einkaufsliste v1]: `useShoppingList` Hook + localStorage (STORAGE_KEY `kovacevic-shopping`); `toggleItem` bidirektional mit `checkedAt` Timestamp; `STORE_META`-Konstante im ShoppingItem für farbkodierte Store-Badge-Pills via `style={}` prop; `ShoppingFormModal` mit Menge+Einheit Inline-Row (flex 3:2); keine API-Anbindung (v1 by design)
- [FS-06 TaskItem+TaskFormModal Tests]: `renderTaskItem(overrides)` + `renderModal(props)` Factory-Pattern; `userEvent.setup()` pro Test; `fireEvent.click` für disabled-Button-Assertion (EC-1); `form.dispatchEvent` für Whitespace-Guard-Test (EC-4); aria-label als primäre Selektoren — kein testid, kein CSS
- [FS-25 Einkaufsliste API-Backend]: Neues `shopping_items`-Modell/Schema/Router (18 Tests); `useShoppingListApi` Hook analog useTasksApi; `ShoppingPage` migriert; `checked_at` server-controlled beim Toggle; `useShoppingList` (localStorage) bleibt für Tests erhalten; Backend gesamt 70 Tests grün
- [Schnellerfassung Einkaufsliste]: `QuickAddBar`-Komponente mit 4 Feldern (name, unit, quantity, store), `tabIndex 1–5`, Enter-Submit via `onKeyDown` in allen Feldern, `submitting`-Flag gegen Doppel-Submit, Fokus-Reset nach Erfassung; "Neuer Artikel"-Button entfernt
- [QuickAddBar Viewport-Fix]: `position: fixed; bottom: 0; left: var(--sidebar-width); right: 0` direkt auf `.bar`; Mobile `left: 0` via Media Query; `.page` bekommt `padding-bottom: 64px`; sticky-Hack entfernt
- [Dashboard Live-Daten]: `SHOPPING_ITEMS`-Mock entfernt; dritter `useEffect`-Fetch auf `/api/shopping`; alle drei Dashboard-Widgets (Kalender, Aufgaben, Einkauf) holen jetzt ausschließlich echte DB-Daten
- [FS-08 Erledigte Aufgaben wiedereröffnen]: `completeTask` → `toggleTask` (bidirektional); `disabled`-Attribut entfernt; Prop `onComplete` → `onToggle`; CSS `.checkbox.checked:hover { opacity: 0.75 }`; Recurring-Guard nur bei `false→true`; Backend war bereits vorbereitet (kein Änderungsbedarf)
- [TD-11 QuickAddBar Token]: `--quickadd-bar-height: 64px` als Layout-Token in tokens.css; ShoppingPage.module.css verwendet var() statt Literal; pattern analog --topbar-height
- [Bugfix tasks 500]: Root Cause: `completed_at`-Spalte fehlte in persistierter SQLite-DB (create_all idempotent auf Tabellen-Ebene); Fix: DB-Datei gelöscht → create_all neu; kein Code-Change nötig; Folgerisiko: jede neue Modell-Spalte → 500 bis DB manuell gelöscht → FS-09 (Alembic) priorisieren
- [Auto-Cleanup erledigte Einträge]: Lazy Deletion auf GET (kein Scheduler); Bulk-DELETE vor SELECT; Guard completed_at IS NOT NULL schützt Altdaten; completed_at server-controlled via PUT
- [FS-22 Familienmitglieder-CRUD]: Vollständige Full-Stack-Migration: neues `family_members`-Modell/Schema/Router im Backend (16 Tests); `useFamilyMembers`-Hook + `FamilyMemberFormModal` (10-Farb-Swatches) im Frontend; alle 4 Consumer von FAMILY_MEMBERS migriert (SettingsPage, TaskFormModal, EventFormModal, Sidebar); `constants/family.ts` gelöscht; Sidebar-Fetch nach AppShell verschoben (Prop-passing statt direkter Hook-Aufruf); `classNameStrategy: 'non-scoped'` in vite.config.ts behebt CSS-Module-Hash-Problem (FS-26 Nebeneffekt)
- [Dokumente]: Neues `documents`-Modell/Schema/Router im Backend (15 Tests) — echter FK `family_member_id` (nullable, Unassign in Anwendungscode statt DB-Cascade, da SQLite/Postgres inkonsistent) statt denormalisierter Initialen/Farbe wie bei Task; lokales Dateisystem-Storage unter `settings.upload_dir` mit UUID-`stored_filename` (Path-Traversal-Schutz, kollisionsfrei), Allowlist erlaubter Dateitypen + 20-MB-Limit; `python-multipart` als neue Dependency. Frontend: `useDocuments`-Hook analog `useFamilyMembers`; `DocumentItem` mit eckigem Icon-Badge als Signature-Element (Abgrenzung zur runden Task-Checkbox), Inline-`<select>` für Reassignment direkt in der Liste (kein Re-Upload nötig); `DocumentUploadModal` nach bestehendem FormModal-Pattern.
- [Dokumente-Ansehen]: `/api/documents/{id}/view`-Endpoint ergänzt (Refactor: `_get_document_file()`-Helper geteilt zwischen `/download` und `/view`) — identisch zu `/download`, aber `content_disposition_type="inline"` statt `"attachment"`, damit Browser PDFs/Bilder direkt rendern statt zu downloaden (6 neue Tests).
- [Dokumenten-Vorschau in der App]: Reine Frontend-Story — `DocumentPreviewModal` (90vw×90vh, `--color-bg`-Hintergrund als Signature-Element) ersetzt den bisherigen `target="_blank"`-Ansehen-Link; Typ-Erkennung über `doc.contentType` (nicht Dateiendung): PDF → `<iframe>`, Bild (außer HEIC/HEIF, da Browser-Rendering-Limitation) → `<img>`, sonst Fallback mit Download-Button; `previewDoc`-State in `DocumentsPage` analog `editingTask`-Pattern aus `TasksPage`; Escape-Taste zum Schließen ergänzt (State-of-the-art-Modal-Pattern-Erweiterung, bisher nur Backdrop-Klick/X-Button).
- [Deployment-Setup]: `/app/uploads` als Coolify Directory Mount (Bind Mount) statt named Volume — named Volumes landen sonst unter `/var/lib/docker/volumes/...` auf der System-SSD (`sda`, LVM-Root); Host-Server `milkyway` hat zusätzliche HDD (`sdb1`, 1,8T ext4) unter `/mnt/data` gemountet, Uploads liegen dort unter `/mnt/data/familio/uploads`; kein Code-Change nötig, da `UPLOAD_DIR` bereits konfigurierbar war (nur Backend liest/schreibt lokal, keine Blobs in Postgres).
- [Termine aus Dokument extrahieren]: **Erstes echtes Service-Modul der Codebasis** (`backend/app/services/document_extraction.py`) — bisher lag alle DB-/Business-Logik direkt im Router; für die Claude-API-Interaktion (Prompt, Structured-Output-Schema, Response-Parsing) wurde bewusst ein Service-Layer eingeführt, Router bleibt dünn (nur Content-Type-Validierung + Fehler-Mapping via `DocumentExtractionError`). Claude API (`AsyncAnthropic`, Modell `claude-sonnet-5` konfigurierbar über `ANTHROPIC_MODEL`) wird mit PDF/Bild als `document`/`image`-Content-Block + `output_config.format` (JSON-Schema) aufgerufen — kein Freitext-Parsing. Extrahierte Termine werden **nicht** persistiert (kein neues DB-Modell); Review-Pflicht vor Anlage ist zentrales Sicherheitsnetz: Nutzer bestätigt im neuen `ExtractEventsModal`, erst dann läuft ein sequenzieller `POST /api/events` pro ausgewähltem Termin über den bereits bestehenden Endpoint. Fehlende Uhrzeit im Dokument → Ganztags-Fallback (00:00–23:59) statt KI-Rateversuch.

## ✅ Done
<!-- Resolved items -->
<!-- Format: - [x] TD-XX: description (resolved in: feature name) -->
- [x] TD-01: Nunito-Font lokal gehostet — CDN-Links aus index.html entfernt, 5 WOFF2-Subsets in `webapp/public/fonts/`, `fonts.css` mit variable-weight `@font-face` (resolved in: TD-01 Font Local Hosting)
- [x] TD-02: FAMILY_MEMBERS nach `webapp/src/constants/family.ts` extrahiert — `FamilyMember` Interface + named export; alle 3 Consumer importieren statt lokal definieren (resolved in: TD-02 FAMILY_MEMBERS Refactor)
- [x] TD-03: Root `.gitignore` erstellt — deckt Python/Node/Android/Secrets/OS ab; `backend/kovacevic.db` + WAL-Dateien ignoriert; Font-Assets explizit nicht ignoriert (resolved in: TD-03 gitignore)
- [x] TD-04: `API_BASE` nach `webapp/src/api/config.ts` extrahiert — `import.meta.env.VITE_API_URL ?? 'http://localhost:8000'`; `vite-env.d.ts` + `.env.example` ergänzt; alle 3 Consumer importieren (resolved in: TD-04 VITE_API_URL)
- [x] TD-05: `extractDate`/`extractTime` in EventFormModal auf `new Date()` + `getHours()`/`getMinutes()` umgestellt — korrekt bei Mikrosekunden und zukünftigen TZ-Suffixen; 7 Tests hinzugefügt (resolved in: TD-05 Robust DateTime Parsing)
- [x] FS-12: VITE_API_URL — durch TD-04 vollständig erledigt (resolved in: TD-04 VITE_API_URL)
- [x] FS-14: Termin bearbeiten — PUT /api/events/:id + Edit-Modal (resolved in: Termin bearbeiten + Dashboard API)
- [x] FS-15: Überlappende Termine in WeekView — `computeEventLayout()` mit transitivem Cluster-Algorithmus + greedy Column-Assignment; `calc(X% + 3px)` inline styles; 9 Unit-Tests (resolved in: FS-15 WeekView Overlap)
- [x] FS-04: Settings-Seite — Darstellung (ThemeToggle via useOutletContext) + Familie (read-only FAMILY_MEMBERS mit AvatarBadge); Sidebar-Button zu NavLink mit active-State; AppShellOutletContext-Pattern etabliert (resolved in: FS-04 Settings-Seite)
- [x] FS-01: useSidebar Tests — 12 Tests: init, open/close/toggle (inkl. idempotenz), Resize-Handler (>768, <768, Boundary 768), Cleanup via vi.spyOn (resolved in: FS-01 useSidebar Tests)
- [x] FS-02: AvatarBadge Render-Tests — 14 Tests: Initialen, Inline-Farbe, Basisklasse, alle 3 Größenklassen + Default, Dot present/absent, 3 Kombinations-Tests (resolved in: FS-02 AvatarBadge Tests)
- [x] FS-03: Mobile-Drawer Interaktionstests — 5 async Tests in AppShell.test.tsx: initial geschlossen, Hamburger öffnet, X-Button schließt, Overlay-Klick schließt, Nav-Link-Klick schließt (resolved in: FS-03 Mobile-Drawer Tests)
- [x] FS-18: TasksPage-Migration zu API — useTasksApi Hook ersetzt useTasks() in TasksPage (resolved in: Aufgaben-API-Migration)
- [x] Einkaufsliste v1: ShoppingPage + useShoppingList + ShoppingItem (Store-Badge-Pills) + ShoppingFormModal; 15 Hook-Tests; localStorage-Persistenz; bidirektionale Checkbox (resolved in: Einkaufsliste v1)
- [x] FS-06: TaskItem + TaskFormModal Render-Tests — 21 Tests (11+10); Checkbox-Click, disabled-Guard, Inline-Delete-Confirm (2-stufig), Create/Edit-Submit, Whitespace-Validierung (resolved in: FS-06)
- [x] FS-22: Familienmitglieder-CRUD — Backend 16 Tests, Frontend 108 Tests, alle grün; FS-26 als Nebeneffekt behoben (resolved in: FS-22)
- [x] FS-08: Erledigte Aufgaben wiedereröffnen — `toggleTask` bidirektional; 108 Tests grün; Backend war bereits ready (resolved in: FS-08)
- [x] TD-09: `position: sticky; bottom: -24px` Hack entfernt — ersetzt durch `position: fixed` mit `var(--sidebar-width)` Offset (resolved in: QuickAddBar Viewport-Fix)
- [x] FS-25: Einkaufsliste API-Backend — Backend 18 Tests, Frontend 108 Tests (+ 15 localStorage-Tests unverändert); `checked_at` server-controlled (resolved in: FS-25)
- [x] FS-26: AvatarBadge CSS-Module-Hash — `classNameStrategy: 'non-scoped'` in vite.config.ts; 15/15 AvatarBadge-Tests grün (resolved in: FS-22 Nebeneffekt)
- [x] FS-27: Persistentes Coolify-Volume auf `/app/uploads` eingerichtet — Directory Mount (kein named Volume) auf Host-Server `milkyway`, Source `/mnt/data/familio/uploads` (HDD, `sdb1`) statt SSD-System-Disk (`sda`); Redeploy überlebt jetzt (resolved in: Deployment-Setup)
