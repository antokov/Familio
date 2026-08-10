# BA Analysis — Termin löschen

## 1. Business Rules

1. A delete action is only available for an **existing** event (edit mode) — a new/unsaved event has nothing to delete.
2. Deleting requires an explicit confirmation step before any DELETE request is sent (AC2/AC4).
3. On successful deletion, the event is removed from the in-memory event list immediately (no refetch required) so Month/Week views update instantly, and the edit dialog closes.
4. On a failed deletion (non-2xx, network error), the event stays in the list, the modal stays open, and the user sees an error message (AC5) — mirrors the existing `saveError` pattern already used for create/update in `EventFormModal`.
5. Deletion is permanent — no soft-delete/undo, consistent with how `DELETE` already behaves for tasks, shopping items, documents, and family members.
6. No authorization check — the app has no auth/user roles (per CLAUDE.md), so any family member can delete any event, same as every other mutation in the app today.
7. All-day and multi-day events are deleted the same way as timed events — deletion is purely by `id`, `all_day`/date range is irrelevant.

## 2. Edge Cases

1. **Double-submit:** user double-clicks the confirm button while a delete request is in flight → must not fire two `DELETE` requests. Mitigate by disabling the confirm control while a `deleting` state is true (same shape as the existing `saving` state used for create/update).
2. **Already deleted (404):** two family members could have the event open at once; if a second delete/edit hits a `404` (event already gone — this path is already covered by `test_delete_nonexistent_returns_404` on the backend), treat it as an effectively successful outcome from the user's point of view — remove it locally and close the modal rather than showing a scary error, since the end state the user wants (event gone) is already true.
3. **Cancel confirmation:** clicking "Nein"/cancel on the delete confirmation must not delete anything and must leave the edit modal open and untouched. Dismissing the whole modal (backdrop click / X / "Abbrechen") while the delete-confirm is showing should behave like closing the modal normally (no deletion).
4. **All-day / multi-day events:** no special-casing needed — single `id`-based DELETE regardless of `allDay`/date span.
5. **Empty calendar after delete:** deleting the last event in view should leave Month/Week view in the same empty state they already render for a day/period with 0 events (no new empty-state work needed, existing rendering already handles 0 events per day).

## 3. Data Model Implications

**None.** No new DB fields, no new backend endpoint. `DELETE /api/events/{event_id}` already exists in `backend/app/routers/events.py`, is already tested (`backend/tests/test_events.py::TestDeleteEvent`), and needs no changes.

Frontend-only additions:
- New `deleteEvent(id: string): Promise<boolean>` in `webapp/src/hooks/useEvents.ts` (same shape/pattern as `deleteTask`/`deleteDocument`/`deleteFamilyMember` in sibling hooks — fetch DELETE, on success filter local state, on failure set an error and return `false`).
- New `onDelete` wiring: `EventFormModal` gets an `onDelete` prop (only relevant/rendered in edit mode) that `CalendarPage` implements by calling `deleteEvent(editingEvent.id)`.

## 4. Open Questions

- **OQ-NB-1 (NON-BLOCKING):** Confirmation UI style — 2-step inline swap (matches `TaskItem`'s existing "Löschen?" / "Ja" / "Nein" pattern) vs. a dedicated warning banner inside the modal. No native `window.confirm()` is used anywhere else in the app, so it should not be introduced here either. → Architect/Design to decide, but must reuse the established inline 2-step convention rather than inventing a new modal-in-modal.
- **OQ-NB-2 (NON-BLOCKING):** Whether the delete button lives in the modal footer (next to Abbrechen/Speichern) or near the header (next to the close X). → Design decision, no business impact.

No BLOCKING questions. Proceeding to Architect phase.
