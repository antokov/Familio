# Architect Decision — Termin löschen (Mode A: Pre-Dev Scoping)

## Summary

Purely additive, frontend-only feature. The backend endpoint (`DELETE /api/events/{event_id}`) already exists and is already tested — do not touch the backend. This closes backlog item **FS-13**.

## Files Dev Must Touch

1. `webapp/src/hooks/useEvents.ts` — add `deleteEvent(id: string): Promise<boolean>`.
2. `webapp/src/components/EventFormModal/EventFormModal.tsx` — add an `onDelete` prop (edit-mode only) + inline 2-step delete confirmation.
3. `webapp/src/components/EventFormModal/EventFormModal.module.css` — styles for the new delete button and its inline confirm row.
4. `webapp/src/pages/CalendarPage.tsx` — wire `deleteEvent` from the hook into `EventFormModal`'s new `onDelete` prop.
5. `webapp/src/components/EventFormModal/EventFormModal.test.tsx` — extend with delete-flow tests.
6. `webapp/src/hooks/useEvents.test.ts` — **new file.** No hook tests exist for `useEvents` today (backlog FS-17 tracks full coverage as a separate, larger follow-up). Scope here is narrow: cover only the new `deleteEvent` function (success, 404-as-success, hard failure), not a full retrofit of `createEvent`/`updateEvent`/`fetchEvents`. Leave FS-17 in the backlog for the rest.

Do not touch any other file. In particular: no backend changes, no `MonthView`/`WeekView` changes (delete is edit-modal-only per story scope), no new route/page.

## Patterns to Follow

- **`deleteEvent` shape:** mirror `createEvent`/`updateEvent` in the *same* hook — return `Promise<boolean>`, and update the hook's local `events` array on success (`setEvents(prev => prev.filter(e => e.id !== id))`), not `Promise<void>` like `deleteTask`/`deleteDocument` in other hooks. Stay consistent with the two sibling functions already in this file, not with hooks in other files.
- **404 = success:** if the DELETE response is `404`, treat it as success (event already gone — filter it locally and return `true`) rather than surfacing an error. Only a genuine failure (network error, 5xx) should return `false`. This follows BA analysis edge case 2.
- **Confirmation UI:** reuse the app's existing 2-step inline-confirm convention from `TaskItem.tsx`/`TaskItem.module.css` (`confirmRow` / "Löschen?" text / "Ja" / "Nein" buttons) — do **not** introduce `window.confirm()` or a nested modal-in-modal. Re-implement the same interaction shape locally in `EventFormModal` (a local `confirmDelete` boolean state), since `EventFormModal.module.css` already defines its own `.cancelBtn`/`.saveBtn` for the main form actions — new class names must not collide with those (see Constraints).
- **Error surfacing:** reuse the existing `saveError`-style local state/message pattern already in `EventFormModal` (rendered above `.actions`) for a delete failure, rather than relying on the page-level `error` banner from `useEvents` (that banner is driven by `fetchEvents` and says "Kalender konnte nicht geladen werden", which would be a misleading message for a failed delete). Add a sibling local state, e.g. `deleteError`, with its own short message (e.g. "Löschen fehlgeschlagen. Bitte erneut versuchen.").
- **CalendarPage wiring:** mirror `handleSave` — on successful delete, call `loadForCurrentView()` (existing refetch-after-mutation pattern already used for create/update) and then `closeModal()`. `EventFormModal`'s `onDelete` prop should be `(id: string) => Promise<boolean>` so the modal can decide whether to close itself or show `deleteError`, matching how `onSave`'s return value already drives `setSaveError` today.
- **Visibility rule:** the delete action/button renders only when `isEdit` is true (existing `isEdit = !!editEvent` constant already in the component) — never in create mode.
- **Button disabling while in-flight:** reuse the existing `saving` boolean's spirit — introduce a `deleting` boolean local to `EventFormModal` that disables the confirm ("Ja") button and the rest of the form's primary actions while a delete request is in flight, preventing double-submit (BA edge case 1). It does not need to disable the whole form the way `saving` does for save, only needs to prevent a second delete from firing — keep this minimal.

## Explicit Constraints (What NOT to Do)

- Do NOT modify `backend/app/routers/events.py`, `backend/app/schemas/event.py`, or `backend/tests/test_events.py` — the DELETE endpoint and its tests are already complete and correct for this story.
- Do NOT add delete affordances to `MonthView`/`WeekView` event pills directly — deletion is edit-modal-only in this story (see story.md "Out of Scope").
- Do NOT introduce `window.confirm()`/`window.alert()` anywhere.
- Do NOT reuse `TaskItem.module.css` classes directly across component boundaries (CSS Modules are scoped per-component in this codebase — every existing component defines its own copies of shared visual patterns, e.g. `.cancelBtn` exists separately in both `TaskItem.module.css` and `EventFormModal.module.css`). Add new, distinctly-named classes inside `EventFormModal.module.css` (e.g. `deleteConfirmRow`, `deleteConfirmBtn`, `deleteConfirmCancelBtn`, `deleteBtn`) — do not rename or repurpose the modal's existing `.cancelBtn`/`.saveBtn`, which remain the "Abbrechen"/"Speichern" buttons.
- Do NOT add recurrence-aware deletion logic — `calendar_events` has no recurrence concept (unlike `tasks`).
- Do NOT expand scope to a full `useEvents` test retrofit (FS-17) — only test the new `deleteEvent` function.

## Files Dev Needs in Context (max 8)

1. `webapp/src/hooks/useEvents.ts`
2. `webapp/src/components/EventFormModal/EventFormModal.tsx`
3. `webapp/src/components/EventFormModal/EventFormModal.module.css`
4. `webapp/src/pages/CalendarPage.tsx`
5. `webapp/src/components/TaskItem/TaskItem.tsx` (reference only — confirm-flow pattern to mirror)
6. `webapp/src/components/TaskItem/TaskItem.module.css` (reference only — class shapes to mirror, not import)
7. `webapp/src/components/EventFormModal/EventFormModal.test.tsx`
8. `webapp/src/types/event.ts`

No blockers — this is a small, additive, well-precedented change. Proceeding to Design phase (Phase 3b applies — `webapp/src/` files are in scope).
