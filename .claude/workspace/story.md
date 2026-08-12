# User Story

**Type:** Business Feature

## Story
As a family member using the Familio Android app,
I want to receive a push notification every day at 21:00 listing tomorrow's calendar events (if any),
so that I don't have to open the app to remember what's coming up the next day.

## Acceptance Criteria

**AC1:** Given I have at least one calendar event scheduled for tomorrow, when it becomes 21:00 today, then I receive a push notification on my Android device listing the event(s) happening tomorrow (title + time, or "ganztägig" for all-day events).

**AC2:** Given I have no calendar events scheduled for tomorrow, when it becomes 21:00 today, then I do NOT receive a push notification (no empty/noise notification).

**AC3:** Given I receive the 21:00 notification, when I tap it, then the app opens to the calendar view (so I can see the full details of tomorrow's events).

**AC4:** Given multiple family members share the calendar, when the 21:00 notification is sent, then each family member's device that has the app installed and notifications enabled receives it — not just the person who created the events.

**AC5:** Given I have not granted the app notification permission (or have disabled notifications in device/app settings), when 21:00 arrives, then no notification is delivered to my device and no error is shown elsewhere in the app (silent no-op for that device).

## Out of Scope
- Push notifications in the WebApp (browser/PWA Web Push) — Android-only in this iteration; a webapp follow-up story can reuse the backend piece if one is introduced
- User-configurable notification time (e.g. changing "21:00" to a different hour) — the time is fixed for this iteration
- Per-event or per-category notification preferences (e.g. muting certain calendar entries) — it's all-or-nothing based on the device's notification permission
- Notifications for anything other than "tomorrow's events" (e.g. reminders X minutes before an event, weekly digests, task/shopping-list notifications)
- Retrying/guaranteeing delivery if the device is offline at 21:00 — best-effort push delivery only

## Notes
- No existing push-notification infrastructure was found in the codebase (no FCM/Firebase references, no notification scheduling on the backend). This story likely requires introducing that infrastructure end-to-end (device token registration, a backend-side daily trigger at 21:00, and the Android push receiver) — Architect should confirm the concrete approach (e.g. Firebase Cloud Messaging vs. an alternative) and flag if this needs to be split into an Enabler story for the underlying push infrastructure plus a smaller Business Feature story for the "tomorrow's events" content/logic on top of it.
- "Tomorrow" should be evaluated based on the family's/server's local timezone, consistent with how the rest of the calendar already treats event times as naive wall-clock time (see `CLAUDE.md` "Timezone-Fix" note) — Architect/BA to confirm the exact boundary given the app is self-hosted on a single NAS (no per-user timezone concept currently exists).
- All-day events (`all_day: true`, including multi-day ones spanning into/through tomorrow) should count as "an event tomorrow" for AC1 — exact wording/format of the notification body is a Dev/Design decision, not prescribed here.
