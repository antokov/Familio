# Dev Implementation Report — Termin löschen

## Approach

Frontend-only, additive change built exactly per `arch-decision.md` and `design-decision.md`. No backend code touched — `DELETE /api/events/{event_id}` already existed and was already tested.

- `useEvents.ts` gained a `deleteEvent(id)` following the existing `createEvent`/`updateEvent` shape in the same file (`Promise<boolean>`, filters local `events` state on success). A `404` response is treated as success (event already gone).
- `EventFormModal.tsx` gained an optional `onDelete` prop, rendered as a delete icon-button (`Trash2`) only when `isEdit && onDelete`. Clicking it swaps in a 2-step inline confirm row ("Termin löschen?" / "Ja, löschen" / "Abbrechen") — no `window.confirm()`, no nested modal, matching the existing `TaskItem` convention as instructed.
- The `.actions` footer was restructured: the delete control (or its confirm row) sits on the far left; the existing Abbrechen/Speichern pair was wrapped in a new `.primaryActions` div with `margin-left: auto` so it always stays right-aligned whether or not the delete control is present (avoids the `justify-content: space-between` single-child collapse bug that would otherwise left-align the primary buttons in create mode).
- Delete errors reuse the existing `.saveError` visual treatment via a new `deleteError` boolean state and message, rendered in the same slot as the existing save-error message.
- `CalendarPage.tsx` wires `deleteEvent` from the hook into a `handleDelete` that mirrors `handleSave`'s refetch-after-mutation pattern (`loadForCurrentView()` on success), passed as `onDelete={editingEvent ? handleDelete : undefined}`.

## Files Changed

- `webapp/src/hooks/useEvents.ts` — added `deleteEvent`.
- `webapp/src/components/EventFormModal/EventFormModal.tsx` — added `onDelete` prop, delete confirm flow, footer restructure.
- `webapp/src/components/EventFormModal/EventFormModal.module.css` — `.primaryActions`, `.deleteTriggerBtn`, `.deleteConfirmRow`, `.deleteConfirmText`, `.deleteConfirmBtn`, `.deleteConfirmCancelBtn`; `.actions` no longer sets `justify-content`.
- `webapp/src/pages/CalendarPage.tsx` — `handleDelete`, wired to `EventFormModal`'s new prop.
- `webapp/src/components/EventFormModal/EventFormModal.test.tsx` — extended `renderModal()` helper with an optional `onDelete` param (backward compatible, existing calls unaffected); new "Termin löschen" describe block (7 tests: hidden in create mode, hidden without `onDelete`, visible in edit mode with `onDelete`, confirm-before-delete, cancel-does-not-delete, success calls `onDelete` + closes, failure shows error + does not close).
- `webapp/src/hooks/useEvents.test.ts` — **new file.** 4 tests scoped to `deleteEvent` only (204 success, 404-as-success, 500 failure, network-error failure) — deliberately not a full retrofit of the hook (that's the larger, separately-tracked FS-17).

## Assumptions Made

- The inline confirm-cancel button needed a distinct accessible name from the modal's main "Abbrechen" button (both are visually labeled "Abbrechen"); added `aria-label="Löschen abbrechen"` to the inline one so screen readers and tests can disambiguate them without changing the visible copy design specified.
- `onDelete` is optional on `EventFormModal` (not required) so existing tests/usages that don't care about delete (all the pre-existing edit/all-day/multi-day tests) don't need to pass it — the delete UI simply doesn't render without it, which is also the correct behavior for create mode.

## Deviations from arch-decision.md / design-decision.md

None. The `aria-label` addition above is an implementation detail filling a gap neither doc specified, not a deviation from what they did specify.

## Technical Debt / Follow-up

- None introduced. `useEvents.test.ts` intentionally covers only the new function; full hook coverage remains tracked as **FS-17** (already in backlog, unchanged).

## Open Items

None requiring a human decision.
