# BA Analysis

## Business Rules

- BR-01: A notification is sent once per day, at 21:00 server-local time, for the current family's calendar.
- BR-02: An event counts as "tomorrow" if any part of it overlaps the calendar day following today's date (server-local date), i.e. `event.start_dt.date() <= tomorrow <= event.end_dt.date()` for both timed and all-day/multi-day events.
- BR-03: If zero events qualify for "tomorrow" at 21:00, no notification is sent (per AC2) — this is a suppression rule, not "send an empty notification."
- BR-04: The notification is broadcast to every registered device for the family (no per-family-member targeting) — because the app has no auth/login concept, "family member" in AC4 effectively means "every installed device," not a specific person's device.
- BR-05: A device that has not granted notification permission (OS-level) or has no valid registered push token never receives anything and never causes an error surfaced elsewhere in the app (per AC5).
- BR-06: Tapping the notification deep-links into the calendar view (per AC3); it does not need to jump to a specific date/event, just "the calendar."
- BR-07: Notification content includes, per qualifying event: title, and either its time (HH:mm) or "Ganztägig" for all-day events (per `all_day` flag already on `calendar_events`).
- BR-08: Since this is a single-family, self-hosted deployment (one DB per NAS instance, no multi-tenant concept per `CLAUDE.md`), "the family's calendar" = all events in that instance's `calendar_events` table — there's no family/household scoping needed beyond what already exists.

## Edge Cases

- EC-01: App installed but device offline/unreachable at 21:00 — best-effort only, no retry, no queued redelivery (explicitly out of scope per story).
- EC-02: Same event edited/deleted after 21:00 today but before it happens tomorrow — notification content is a snapshot at 21:00; no update/recall notification is sent. Acceptable per story (not in AC).
- EC-03: An event is created or moved to "tomorrow" *after* 21:00 has already fired for today — user gets no notification for it (would only be caught by the next day's send, which is one day too late for that specific event). Not covered by any AC; assume acceptable (no re-check on late changes) since the story scopes exactly one fixed daily send.
- EC-04: Multi-day all-day event that started before today and continues through tomorrow (e.g. "Ferien 20.–31.07.") — per BR-02 this still qualifies as "an event tomorrow" and must appear in the notification, not just events that *start* tomorrow.
- EC-05: Duplicate/stale device tokens (app reinstalled, token rotated by FCM, or multiple devices per person) — must not send duplicate notifications to the same still-valid token, and a token FCM reports as invalid/unregistered on send should be pruned from storage rather than retried indefinitely.
- EC-06: No devices registered at all (fresh deployment, nobody has opened the app since the feature shipped) — the 21:00 job must run and complete as a no-op rather than erroring.
- EC-07: Backend/server process restarts or is down at 21:00 (e.g. redeploy) — that day's notification is simply missed; no catch-up-on-startup logic is implied by the story.
- EC-08: Timezone of the backend server vs. "today/tomorrow" as the user perceives it — since events are stored/treated as naive wall-clock time (see `CLAUDE.md` Timezone-Fix note) and there is no per-user timezone, "21:00" and "tomorrow" must both be evaluated in the same reference timezone as the rest of the calendar (server-local), otherwise the boundary is inconsistent with what the calendar UI shows.
- EC-09: Push permission revoked *after* the device already registered a token — FCM send will fail/return an error for that token; must be handled the same as EC-05 (prune, don't error elsewhere).
- EC-10: Multiple app instances/devices belonging to the same family member (e.g. phone + tablet) — both are separate registered tokens and both legitimately receive the notification (no dedup by "family member" since there's no login to key on).

## Data Model Implications

### New / Changed Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| `device_tokens.id` | PK (int/UUID) | — | New table |
| `device_tokens.token` | string | required, unique | FCM registration token |
| `device_tokens.platform` | string/enum | required, e.g. `"android"` | Future-proofs for webapp/web-push follow-up (Out of Scope this iteration, but avoids an immediate migration if added later) |
| `device_tokens.created_at` | datetime | server default now | |
| `device_tokens.last_seen_at` | datetime | updated on re-registration | Lets a cleanup routine drop stale tokens later (not required for this story's ACs, but cheap to add now given lazy-deletion pattern already used elsewhere) |

No changes to existing `calendar_events` or family-member models — BR-04/BR-08 mean the notification is family-wide, not keyed to `family_members`.

### Entity Relationships
- `device_tokens` is a standalone table, not FK'd to `family_members` (no auth/session ties a device to a specific person today — consistent with BR-04).

### Migration
- New table `device_tokens` — additive only, no changes to existing tables, so this avoids the "no Alembic" risk pattern noted in `CLAUDE.md` (FS-09) that has previously caused production 500s on *existing* tables (`all_day`, `completed_at`). A fresh table is safe to create on both SQLite (dev) and Postgres (prod) without an ALTER on live data. Still worth flagging: this codebase has no migration tool (FS-09 still open), so table creation must go through whatever mechanism currently creates tables (e.g. `Base.metadata.create_all` at startup) — Architect to confirm.

## Open Questions

| ID | Question | Blocking? | Assumption if not answered |
|----|----------|-----------|---------------------------|
| OQ-01 | ~~Do we have (or can we create) a Firebase project + FCM server credentials...~~ | RESOLVED | Human decided: **no Firebase/FCM.** Use a Google-free, self-hosted push mechanism (ntfy-style — see `arch-decision.md` for the concrete Architect scoping of this). |
| OQ-02 | ~~How should the daily 21:00 trigger be implemented...~~ | RESOLVED | Human delegated the choice. Decision: **in-process scheduler (APScheduler) inside the FastAPI backend**, since this is a self-hosted, long-running Docker service (not serverless/short-lived) — consistent with the rest of the stack. Architect to confirm this holds for the current Coolify/NAS deployment and flag if not. |
| OQ-03 | Should the Android app register its push token on every app start (idempotent upsert), or only once at first launch / when notification permission is granted? | NON-BLOCKING | Assume: register/refresh token on every app start (idempotent upsert keyed by token) — matches standard FCM guidance since tokens can rotate. |
| OQ-04 | Should there be a way to unregister a device's token (e.g. app uninstall, "disable notifications" toggle in Settings)? Not in any AC. | NON-BLOCKING | Assume: not required for this story; rely on FCM's send-error signal to prune stale tokens (EC-05/EC-09) as the only cleanup path for now. |
| OQ-05 | What server-local timezone should "21:00" and "tomorrow" be computed in, given the NAS deployment has no explicit `TZ` configuration mentioned in `CLAUDE.md`? | NON-BLOCKING | Assume: whatever timezone the backend process/container runs in (Python `datetime.now()` local time), consistent with how event times are already treated as naive wall-clock values — Architect to confirm/document the container's `TZ` env var if relevant. |

**Escalating OQ-01 and OQ-02 to `blockers.md` — human input required before Architect/Dev phases.**
