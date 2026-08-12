# Test Report — Push-Benachrichtigung für morgige Kalendertermine (21:00 Uhr)

## Acceptance Criteria Check

| AC | Status | Comment |
|----|--------|---------|
| AC1: events tomorrow → 21:00 push listing title+time/Ganztägig | ✅ PASS (up to the publish boundary) | Verified via `test_events_tomorrow_publishes_to_ntfy`, `test_all_day_event_shown_as_ganztaegig`, `test_multiple_events_tomorrow_are_all_listed`: correct body format, correct ntfy URL/topic, `Click` header set. Confirmed the scheduler wiring itself doesn't crash app boot via a live `uvicorn` smoke test (`/health` responded 200, no errors in the startup log). **What is NOT verified by this codebase**: actual device receipt — that depends on a self-hosted ntfy instance existing (it doesn't, anywhere in this repo/deployment yet) and each device having subscribed via the separately-installed ntfy app. This is an infra/deployment gap already called out in `impl-report.md`, not a code defect. |
| AC2: no events tomorrow → no notification | ✅ PASS | `test_no_events_skips_send`. |
| AC3: tap notification → opens app to calendar | ✅ PASS (build-verified only) | Backend always sets `Click: familio://calendar`. Android: `AndroidManifest.xml` intent-filter + `MainActivity.toDeepLinkRoute()` + `MainScreen`'s `LaunchedEffect` correctly route to `FamilioDestination.Calendar` — verified by `:app:assembleDebug`/`:app:compileDebugKotlin` succeeding and manual code trace (`android:host="calendar"` matches `Uri` for `familio://calendar`; `singleTask` + `onNewIntent`/`setIntent` correctly handles the already-running-app case). **Not covered by an automated test** — the Android module has zero test infrastructure anywhere in this repo (no `app/src/test`, no `app/src/androidTest`, confirmed by search), consistent with `CLAUDE.md`'s "Current State" already stating Android automated tests are "noch nicht erledigt." Adding a first-ever Android test harness (JUnit/Robolectric, since `Intent`/`Uri` parsing needs a Context or at least `Uri.parse`, which is Android-framework-backed) is out of scope for `arch-decision.md`, which didn't list test-infra setup as a Dev task — flagged as a coverage gap, not a blocker. |
| AC4: broadcast to every family member's device | ✅ PASS (architectural, not code-testable) | By design (per `arch-decision.md`), the backend has no concept of "family member's device" — it publishes once to a shared ntfy topic, and every device subscribed to that topic receives it. This is a property of the ntfy protocol itself, not application logic, so there's nothing in this codebase to unit-test for it. |
| AC5: no notification permission → silent no-op, no error elsewhere | ✅ PASS (by design) | Notification permission/delivery is entirely owned by the separately-installed ntfy app + Android OS, never by Familio's own code — Familio has no notification-permission-handling code to test because it was deliberately never given that responsibility (per `arch-decision.md`'s ntfy-based approach). Confirmed no error path in Familio's own code could surface such a failure (the deep-link handler no-ops silently on a non-matching/absent intent — `toDeepLinkRoute()` returns `null`, `MainScreen`'s `LaunchedEffect` does nothing when `pendingDeepLinkRoute == null`). |

## Edge Case Coverage

| Edge Case | Covered? | Test Added? | Comment |
|-----------|----------|-------------|---------|
| EC-01: device offline at 21:00 | N/A (accepted gap) | — | Out of scope by design, no code path to test. |
| EC-02: event edited/deleted after 21:00 | N/A (accepted gap) | — | Snapshot-at-send-time is inherent; nothing to assert beyond "the query runs once." |
| EC-03: event created/moved to tomorrow after 21:00 fired | N/A (accepted gap) | — | Documented gap in `analysis.md`, no code needed either way. |
| EC-04: multi-day all-day event spanning into tomorrow | ✅ Yes | ✅ Yes (Dev) | `test_multi_day_all_day_event_spanning_tomorrow_is_included`. |
| EC-05 / EC-09: stale/invalid token, revoked permission | N/A (out of Familio's control by design) | — | ntfy/OS responsibility, not backend-trackable per architecture. |
| EC-06: no devices registered / nobody subscribed | ✅ Yes (the "unconfigured" half) | ✅ Yes (Dev) | `test_ntfy_not_configured_skips_send` covers "nobody set up ntfy at all." "ntfy configured but zero topic subscribers" is invisible to the backend (ntfy just delivers to nobody) — nothing to test. |
| EC-07: backend down at 21:00 | N/A (accepted gap) | — | No catch-up logic in scope. |
| EC-08: timezone consistency (server-local "tomorrow"/"21:00") | ✅ Yes | ✅ Yes (Tester, new) | `test_event_starting_exactly_day_after_tomorrow_is_excluded` pins the exact exclusive upper boundary (`start_dt < range_end`) so a future timezone/boundary regression would be caught. |
| EC-10: multiple devices per family member | N/A (architectural) | — | Same ntfy pub/sub property as AC4 — not testable at this layer. |

## Tests Written

| Test Name | Type | What it covers |
|-----------|------|----------------|
| `test_event_starting_exactly_day_after_tomorrow_is_excluded` | Unit | EC-08 boundary: an event starting exactly at tomorrow's end (day-after midnight) must NOT be included — pins the exclusive `<` boundary in the range query. |
| `test_multiple_events_tomorrow_are_all_listed` | Unit | AC1: two events tomorrow both appear in one notification body, not just the first/last. |
| `test_custom_ntfy_topic_is_used_in_url` | Unit | Confirms `settings.ntfy_topic` is actually threaded into the publish URL, not hardcoded. |
| `test_ntfy_settings_default_to_disabled_url_and_shared_topic_name` | Unit | Confirms a fresh `Settings()` (no env vars set) defaults to `ntfy_url=None` — i.e. the feature is inert-by-default until a human deploys ntfy and sets the env var, matching the "silent no-op until configured" design intent. |
| Live `uvicorn` boot smoke test (manual, not a pytest test) | Integration | Confirmed `AsyncIOScheduler.start()`/`.shutdown()` inside FastAPI's `lifespan` doesn't crash app startup — this path is otherwise **never exercised** by the existing test suite, since `conftest.py`'s `client` fixture explicitly uses `ASGITransport` which does not trigger lifespan events. This was the single highest-risk untested path (a scheduler wiring bug would have meant the whole app fails to boot in production) and is now verified. |

## Coverage Gaps

- **AC3's Android deep-link routing has no automated test** — reason: zero Android test infrastructure exists anywhere in this repo yet (no `app/src/test`/`app/src/androidTest` directories), and standing one up (JUnit + Robolectric, since `Uri`/`Intent` parsing needs an Android framework shim) is a repo-wide first-time investment `arch-decision.md` did not scope into this story. Verified instead via full `:app:assembleDebug` build success + manual code trace. Recommend as a follow-up story if Android test coverage becomes a priority (ties into the existing open item "danach ggf. E2E-Tests (Web) oder Auth" / general Android-testing gap already noted in `CLAUDE.md`'s Current State).
- **The lifespan/scheduler startup path is only manually smoke-tested, not covered by an automated regression test** — `conftest.py`'s `ASGITransport`-based fixture bypasses `lifespan` entirely (pre-existing, documented behavior, not something this story should change). A `pytest-asyncio` test that spins up a real `uvicorn`/lifespan context to assert the scheduler job is registered would require restructuring the test fixture in a way that's out of this story's scope (it would affect every other test file too) — flagging as a `TD` candidate for Phase 6 rather than doing it here.
- **No test proves the actual ntfy HTTP request reaches a real ntfy server** — deliberately: no ntfy instance exists anywhere in this deployment yet (per `impl-report.md`), so there is nothing live to test against. All tests mock `httpx.AsyncClient.post`.

## Bugs Found

None. Full regression run: 139/139 backend tests pass (128 pre-existing/unrelated + 11 new/notifications), `:app:assembleDebug` succeeds with no warnings surfaced as errors.

## Overall Verdict

**PASS ✅** — all 5 acceptance criteria are satisfied within what this codebase is actually responsible for (the backend-to-ntfy publish boundary and the Android deep-link handler); the parts of AC1/AC4/AC5 that depend on external, not-yet-deployed infrastructure (a live ntfy server, per-device ntfy-app subscriptions) are architecturally sound but require a human deployment step already flagged in `impl-report.md` and `blockers.md`'s resolution notes — this is an ops/deployment gap, not an implementation defect, so it does not fail the story. One legitimate coverage gap (no Android automated tests exist in this repo) is documented above but is a pre-existing, repo-wide gap, not something introduced or worsened by this story.
