# Dev Implementation Report — Push-Benachrichtigung für morgige Kalendertermine (21:00 Uhr)

## Approach

Exactly per arch-decision.md: no FCM, no device-token table. Backend runs an in-process APScheduler cron job at 21:00 that queries `calendar_events` overlapping "tomorrow" (server-local date) and, if any exist, publishes one plain-text HTTP POST to a self-hosted ntfy topic (`settings.ntfy_url`/`settings.ntfy_topic`) with a `Click: familio://calendar` header. The Android app adds a `familio://calendar` deep link (Manifest intent-filter + `MainActivity`) that reuses the existing `LocalTabNavigator` tab-switch mechanism in `MainScreen` to land on the Calendar tab when the notification is tapped. A short static help section was added to Settings explaining that push requires installing the ntfy app.

## Files Changed

| File | Change Type | Description |
|------|-------------|--------------|
| `backend/app/config.py` | Modified | Added `ntfy_url: str \| None = None`, `ntfy_topic: str = "familio-events"`. |
| `backend/app/main.py` | Modified | Starts an `AsyncIOScheduler` in `lifespan()` with a daily `cron` job (`hour=21, minute=0`) calling `send_tomorrow_events_notification`; shuts it down after `yield`. |
| `backend/requirements.txt` | Modified | Added `apscheduler>=3.10.0`. |
| `backend/app/services/notifications.py` | Created | `send_tomorrow_events_notification(session_factory=async_session_factory)` — queries tomorrow's events (reusing the `events.py` range-overlap query shape so multi-day all-day events are included), no-ops+logs if `ntfy_url` unset or no events found, POSTs to ntfy otherwise, catches `httpx.HTTPError` so a failed/unreachable ntfy server never propagates out of the scheduler job. |
| `backend/tests/test_notifications.py` | Created | 7 tests: no-events skip, successful publish + body format, all-day → "Ganztägig", multi-day all-day event spanning into tomorrow is included, event outside tomorrow excluded, unconfigured ntfy skips send, send failure doesn't raise. |
| `android/app/src/main/AndroidManifest.xml` | Modified | Added `android:launchMode="singleTask"` to `MainActivity` and a second `<intent-filter>` for `familio://calendar` (`ACTION_VIEW`). |
| `android/.../MainActivity.kt` | Modified | Reads the deep-link route from the launch `Intent` (`onCreate`) and from `onNewIntent` (with `setIntent(intent)`), holds it in a `mutableStateOf`, passes it + a consumed-callback down to `MainScreen`. |
| `android/.../ui/MainScreen.kt` | Modified | Accepts optional `pendingDeepLinkRoute`/`onDeepLinkConsumed` params; extracted the existing inline tab-switch lambda into a named `navigateToTab` value (still provided via `LocalTabNavigator`, unchanged behavior for existing callers) and added a `LaunchedEffect` that calls it once when a deep-link route arrives. |
| `android/.../ui/settings/SettingsScreen.kt` | Modified | Added a "Benachrichtigungen" `SettingsSection` with static explanatory text (no new state/fields). |

## Assumptions Made

- **Testability wiring for the scheduler-triggered service** — arch-decision.md said the service "opens its own `async_session_factory()` session"; I implemented this as a `session_factory` parameter defaulting to `app.database.async_session_factory`, so tests can inject an isolated in-memory-DB factory the same way `conftest.py`'s `client` fixture does for the HTTP-triggered routers. Reason: without this, `test_notifications.py` would need to monkeypatch a module-level import binding, which doesn't reliably work with Python's `from x import y` semantics — the parameter approach is the standard way to keep this testable without changing runtime behavior (the default is still the real app engine in production).
- **ntfy body/header format** — arch-decision.md didn't prescribe the exact message format, only "event title + time-or-Ganztägig" (BR-07). Implemented as one line per event (`"{title} - {time or Ganztägig}"`), newline-joined, with `Title: Termine morgen (DD.MM.YYYY)` header. This is a Dev-level formatting choice, not a business rule, per arch-decision.md's own note ("exact wording/format ... is a Dev/Design decision").

## Deviations from arch-decision.md

None. All constraints followed: no `device_tokens` table, no `docker/` changes, no Firebase/GMS dependency, no in-app ntfy-URL/topic configuration, no Android-side polling/AlarmManager, no new HTTP client dependency (`httpx` reused).

## Edge Cases Handled

- EC-01 (device offline at 21:00): out of scope by design — no retry logic exists, matches story.
- EC-02 (event edited/deleted after 21:00): not handled — snapshot-at-send-time behavior is inherent to the one-shot query, no code needed either way.
- EC-03 (event created/moved to tomorrow after 21:00 already fired): not handled, per accepted gap in analysis.md.
- EC-04 (multi-day all-day event spanning into tomorrow): handled — same `end_dt >= range_start AND start_dt < range_end` overlap query as the calendar's own list endpoint; covered by `test_multi_day_all_day_event_spanning_tomorrow_is_included`.
- EC-05 / EC-09 (stale/invalid ntfy delivery, revoked permission downstream): out of Familio's control by design (ntfy/OS handle actual per-device delivery, per architecture decision to not track devices) — the backend only needs to not crash on a failed POST, which `test_ntfy_send_failure_does_not_raise` covers.
- EC-06 (no devices/nobody configured ntfy): the job still runs and completes; if `ntfy_url` is unset, it's a clean no-op (`test_ntfy_not_configured_skips_send`); if `ntfy_url` is set but literally nobody subscribed to the topic, that's outside the backend's knowledge/responsibility (ntfy just delivers to zero subscribers) — nothing to implement.
- EC-07 (backend down at 21:00): accepted gap, no catch-up logic, matches story scope.
- EC-08 (timezone consistency): "tomorrow" computed via `date.today()` (server-local, naive), same reference frame the rest of the calendar already uses — no new timezone handling introduced.
- EC-10 (multiple devices per family member): each ntfy-subscribed device receives the same topic message independently; nothing Familio-side to dedupe since there's no per-user concept.

## Technical Debt / Follow-up

- The actual ntfy server instance is **not deployed anywhere** — this repo has no `docker/docker-compose.yml` (contrary to the aspirational path mentioned in `CLAUDE.md`), so `NTFY_URL`/`NTFY_TOPIC` must be set on the backend once a self-hosted (or ntfy.sh-hosted) ntfy instance exists, and each family member must separately install the ntfy Android app and subscribe it to that topic. Until that manual setup happens, the feature is inert (silent no-op), same class of gap as `ANTHROPIC_API_KEY` not being set — flagging as a deployment follow-up for Phase 6 / the human, not a code defect.
- No way to unregister/mute notifications from within Familio's own Settings (OQ-04, accepted as non-blocking) — muting happens in the ntfy app itself.

## Open Items

None requiring a human decision beyond the ntfy deployment step already called out above (not blocking merge — it's an infra/ops step, not missing code).
