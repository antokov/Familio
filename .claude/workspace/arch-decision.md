# Architecture Decision

## Summary of the Approach

**No FCM/Firebase, no new DB table, no new Docker infra in this repo.** The push transport is a self-hosted **ntfy** server (topic-based pub/sub over plain HTTP — https://ntfy.sh / self-hosted `binwiederhier/ntfy`), which the human stands up on the NAS **outside this repo** (this repo has no `docker/docker-compose.yml` today — that path in `CLAUDE.md` is aspirational; deployment is via Coolify directly against `backend/`'s own Dockerfile, so there is no compose file here for Dev to add an `ntfy` service to). The backend is only an ntfy *publisher* (plain HTTP POST to a topic URL); it never tracks individual devices — so **no `device_tokens` table is needed**, which supersedes `analysis.md`'s "Data Model Implications" section (that table was scoped under the FCM assumption and is no longer required).

Devices "subscribe" to receive the push using the existing, separately-installed **ntfy Android app** (F-Droid/Play), pointed at the human's self-hosted ntfy server/topic — this is manual, one-time, per-device setup done by each family member, not something Familio's own app needs to implement. Familio's own Android app only needs to handle being *opened* from that notification (AC3), via a deep link.

This keeps blast radius small: one new backend service module, one new scheduler wire-up, a few new config settings, and a small deep-link addition on Android. No new Android dependencies, no new permissions beyond what already exists.

## Existing Code to Reuse

- `backend/app/database.py`: `async_session_factory` — usable directly (not just via the `get_db` FastAPI dependency) to open a DB session from the scheduler job, which runs outside any HTTP request.
- `backend/app/routers/events.py` `list_events()` (lines 14-30): shows the exact query shape (`CalendarEvent.end_dt >= from_dt` and `.start_dt < to_dt`) for "events overlapping a date range" — reuse this pattern for "events overlapping tomorrow" so multi-day all-day events (EC-04) are included correctly, consistent with how the calendar UI already computes this.
- `backend/app/services/document_extraction.py`: the pattern for an optional-external-dependency service — reads an optional setting (`settings.anthropic_api_key`), no-ops/errors clearly if unset, isolated from routers. Mirror this shape for the new notifications service, but since this service is scheduler-triggered (not request-triggered), "unset" must **log and return**, not raise — there's no HTTP request to turn an error into.
- `backend/app/config.py`: `Settings` (pydantic-settings) — add new optional fields the same way `anthropic_api_key`/`anthropic_model` were added.
- `backend/app/main.py` `lifespan()`: existing startup/shutdown hook — extend it to start/stop the scheduler, same place `Base.metadata.create_all` and the upload dir already get set up.
- `android/.../ui/navigation/NavExtensions.kt` `LocalTabNavigator`: existing composition-local mechanism for "jump to a bottom-nav tab from outside the tab content" — this is exactly the primitive needed to make a tapped notification land on the Calendar tab (AC3). Do not build a second navigation mechanism.
- `android/.../ui/MainScreen.kt`: owns `pagerState` and provides `LocalTabNavigator`. It currently has no way to receive an externally-requested start tab — needs a small parameter added (see below).
- `android/.../MainActivity.kt` / `AndroidManifest.xml`: existing single-activity, no deep links yet — add one intent-filter here.

## Files Dev Will Modify

**Backend:**
- `backend/app/config.py`: add `ntfy_url: str | None = None` and `ntfy_topic: str = "familio-events"` (same optional-with-safe-default pattern as the Anthropic settings).
- `backend/app/main.py`: start an `apscheduler.schedulers.asyncio.AsyncIOScheduler` in `lifespan()`, register a daily cron trigger at `hour=21, minute=0` calling the new notification service function; call `scheduler.shutdown()` after `yield`.
- `backend/requirements.txt`: add `apscheduler>=3.10.0` (no other new dependency — use `httpx.AsyncClient`, already a dependency, for the ntfy POST; do not add `requests` or a dedicated ntfy client library).

**Android:**
- `android/app/src/main/AndroidManifest.xml`: add a deep-link `<intent-filter>` to the existing `MainActivity` entry for a custom scheme, e.g. `familio://calendar` (`android:autoVerify` not needed — custom scheme, not `https`).
- `android/.../MainActivity.kt`: read the deep-link URI from the launching `Intent` (`onCreate` and `onNewIntent` — remember to call `setIntent(intent)` in `onNewIntent` and set `android:launchMode="singleTask"` on the activity, or the running instance won't get `onNewIntent` for a re-tap), map it to a `FamilioDestination` route, pass it down to `MainScreen`.
- `android/.../ui/MainScreen.kt`: accept an optional "requested start route" parameter; on receipt (`LaunchedEffect`), invoke the same tab-switch logic already exposed via `LocalTabNavigator` to land on Calendar, then clear it so back/forward doesn't re-trigger.
- `android/.../ui/settings/SettingsScreen.kt`: add a short, static help text/section under a new "Benachrichtigungen" heading explaining that push notifications require installing the ntfy app and subscribing it to the family's topic/URL (no new interactive settings fields, no new DataStore keys — the ntfy server URL/topic are the human's manual, one-time, per-device configuration in the *ntfy app*, not something Familio's Settings screen manages in this iteration, per `story.md` Out of Scope).

## New Files to Create

- `backend/app/services/notifications.py`: `async def send_tomorrow_events_notification() -> None`. Opens its own `async_session_factory()` session (it's not called from a request), computes "tomorrow" via server-local `date.today() + timedelta(days=1)`, queries `CalendarEvent` overlapping that day (reuse the `events.py` range-query shape), returns early (no-op, just log) if the query is empty (BR-03/AC2) or if `settings.ntfy_url` is unset (mirrors `document_extraction`'s "not configured" no-op, but logged not raised — EC-06 also covered by the same empty-query early return). Otherwise builds a title + body (event title + either `HH:MM` or `"Ganztägig"` per event, per BR-07) and does a single `httpx.AsyncClient().post(f"{settings.ntfy_url}/{settings.ntfy_topic}", ...)` with the body as plain text and `Title`/`Click` headers (`Click: familio://calendar`, satisfying AC3 without any per-user configuration — ntfy applies the server-set `Click` header for every subscriber automatically). Wrap the POST in try/except for connection errors and log-only (EC-01/EC-07 style: best-effort, no retry, no crash of the scheduler).
- `backend/tests/test_notifications.py`: unit tests for the service directly (not via an HTTP endpoint — there is none). Follow `tests/conftest.py`'s async-session/DB fixtures (same as `test_events.py`). Mock the outbound ntfy call with `unittest.mock.patch`/`monkeypatch` on `httpx.AsyncClient.post` — do **not** add a new test-mocking dependency (no `respx`); it isn't in `requirements.txt` and one isn't needed for a single mocked call.

## Patterns to Follow

- Router-first / service-layer split per `CLAUDE.md`: this is exactly the kind of business logic (external API call, no direct DB-model concern beyond a read query) that belongs in `app/services/`, same as `document_extraction.py` — not in a router, since there's no router for this at all (nothing user-triggered/HTTP-triggered here).
- Optional-feature-via-optional-setting: `settings.ntfy_url is None` ⇒ feature silently disabled, exactly like `settings.anthropic_api_key is None` ⇒ 503 for extraction — except here there's no request to 503, so it's a log line, not an exception.
- Naming: `snake_case.py` for the new backend file, `PascalCase.kt` untouched Kotlin naming already followed.
- Timezone: keep using naive/server-local `datetime`/`date` throughout, consistent with the existing Timezone-Fix note in `CLAUDE.md` — do not introduce `tzinfo`-aware datetimes for this feature; "tomorrow" and "21:00" are both server-local, matching how the calendar already treats all times as naive wall-clock.

## Constraints

- DO NOT add a `device_tokens` table or any device-registration endpoint — not needed for the ntfy pub/sub model; adding one would be unused complexity.
- DO NOT touch `docker/` or attempt to create a `docker-compose.yml` — it does not exist in this repo; standing up the actual ntfy server is a manual deployment step for the human (document it as a `CLAUDE.md` Environment Variables + Current State update in Phase 6, same way the `ANTHROPIC_API_KEY` server-side requirement is documented today).
- DO NOT add Firebase/FCM/Google Play Services messaging dependencies to `android/app/build.gradle.kts` — explicitly ruled out by the human.
- DO NOT make the ntfy topic/URL user-configurable in the app Settings screen in this iteration — explicitly Out of Scope in `story.md`.
- DO NOT add polling/WorkManager/AlarmManager-based client-side scheduling on Android — the trigger lives entirely on the backend (APScheduler); Android's only new responsibility is the deep link.
- DO NOT introduce a new outbound HTTP client dependency (`requests`, an ntfy SDK, etc.) — use `httpx`, already present.
- DO NOT let a failed/unconfigured ntfy send raise out of the scheduler job and crash/stop future runs — must be caught and logged (APScheduler will otherwise silently stop rescheduling a job whose callable keeps raising, depending on `misfire_grace_time`/executor config — keep the try/except inside the service function itself, not relying on scheduler-level error handling).

## Reference Files for Dev Context

1. `backend/app/services/document_extraction.py` — optional-external-dependency service pattern
2. `backend/app/routers/events.py` — "events overlapping a date range" query shape to reuse for "tomorrow"
3. `backend/app/main.py` — lifespan hook to extend for scheduler start/stop
4. `backend/app/config.py` — settings pattern for new optional env vars
5. `backend/tests/test_document_extraction.py` + `backend/tests/conftest.py` — async test/fixture conventions
6. `android/app/src/main/kotlin/com/kovacevic/familio/ui/navigation/NavExtensions.kt` + `ui/MainScreen.kt` — tab-navigation primitive to reuse for the deep link
7. `android/app/src/main/AndroidManifest.xml` — where to add the intent-filter

## Architecture Risks

- Confirmed NON-BLOCKING (per human decision in `blockers.md`): in-process APScheduler assumes the backend container runs continuously (no scale-to-zero/sleep). This matches every other piece of this deployment (a long-lived FastAPI/uvicorn process is already required for the app to work at all), so this is safe — flagging only so Phase 6 review explicitly notes the assumption in `CLAUDE.md`.
- NON-BLOCKING: The actual ntfy server instance is infrastructure this repo cannot provision (no docker-compose file exists here). Dev's job stops at "backend can publish to a configured ntfy URL/topic, no-ops cleanly if unconfigured." Deploying ntfy itself (e.g. via Coolify, a one-off Docker container, or ntfy.sh's public instance if the human is OK with an external hosted service instead of fully self-hosted) is a follow-up deployment action for the human, same class of manual step as setting `ANTHROPIC_API_KEY` on the server today. This should be called out clearly in the final summary to the human, not silently assumed done.
- NON-BLOCKING: EC-03 (event created/moved to "tomorrow" *after* 21:00 already fired) is accepted as a known gap per `analysis.md` — no re-check mechanism is in scope. Not a blocker, just noting Dev should not try to "fix" this beyond what the story asks.
