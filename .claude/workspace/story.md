# User Story

**Type:** Business Feature

## Story
As a family member using the Familio calendar,
I want to delete a calendar event I no longer need,
so that outdated or wrongly created appointments don't clutter the shared family calendar.

## Acceptance Criteria

**AC1:** Given I open an existing calendar event for editing, when I look at the edit dialog, then I see a "Löschen" (delete) action.

**AC2:** Given I click "Löschen" on an existing event, when I have not yet confirmed, then the event is NOT deleted yet and I am asked to confirm the action.

**AC3:** Given I confirm the delete action, when the deletion succeeds, then the event disappears from the calendar view (Month and Week) immediately and the edit dialog closes.

**AC4:** Given I click "Löschen" by accident, when I cancel the confirmation instead of confirming, then the event is kept unchanged and the edit dialog stays open.

**AC5:** Given the delete request fails (e.g. network/server error), when the error occurs, then I see an error message and the event is NOT silently removed from my view.

## Out of Scope
- Deleting multiple events at once (bulk delete)
- Deleting a single occurrence of a recurring event (Familio calendar events are not recurring today — no recurrence concept exists for `calendar_events`, unlike Tasks)
- Undo/restore of a deleted event
- Deleting events directly from the Month/Week view without opening the edit dialog (e.g. swipe-to-delete)
- Android app (web-only in this iteration, consistent with prior calendar features)

## Notes
- The backend already exposes `DELETE /api/events/{event_id}` (implemented, tested, unused by any frontend caller today).
- This closes existing backlog item **FS-13: "Termin löschen — DELETE-Button im Edit-Modal"**.
- The app already has an established 2-step inline delete-confirmation pattern (`TaskItem`) — BA/Architect should evaluate whether that exact pattern fits inside a modal footer or whether a lighter confirm-inline-in-modal approach is more appropriate.
