# User Story

**Type:** Technical Debt (TD-06)

## Story
As a developer maintaining the family member management feature,
I want `FamilyMemberFormModal` to have automated unit tests covering its input handling, color-swatch selection, submit/validation behavior, and inline API-error display,
so that future changes to the family member CRUD form can't silently regress without a test catching it (currently the only safety net is manual clicking, the same gap already closed for `TaskFormModal`/`EventFormModal`).

## Acceptance Criteria

**AC1:** Given the modal opens in create mode (no `editMember`), when it renders, then the name/initials fields are empty, the first color swatch is selected by default, the title reads "Neues Mitglied", the submit button reads "Hinzufügen" and is disabled (name+initials both required), and the name field is auto-focused.

**AC2:** Given the modal opens in edit mode (`editMember` provided), when it renders, then all fields are pre-filled from `editMember` (name, initials, color), the title reads "Mitglied bearbeiten", the submit button reads "Speichern" and is enabled (pre-filled data is already valid).

**AC3:** Given the user types a name and initials, when they type initials, then the value is uppercased and truncated to 2 characters as they type (not just on submit) — and given they click a color swatch, then that swatch becomes the active/selected one (reflected in `aria-pressed` and the live preview's `AvatarBadge` color).

**AC4:** Given both name and initials are filled, when the user submits, then `onSave` is called once with `{ name, initials, color }` — name and initials trimmed, initials uppercased — and while the resulting promise is pending, the submit button shows "Speichern…" and is disabled (guarding against double-submit); given `onSave` resolves with `null` (success), the modal closes (`onClose` called); given `onSave` resolves with a non-null string (an API error), that string is displayed inline in the form and the modal stays open.

**AC5:** Given name or initials is empty/whitespace-only, when the user attempts to submit, then `onSave` is never called (the submit button is disabled, and even a raw form-submit event is blocked by the `!trimmedName || !trimmedInitials` guard inside `handleSubmit`).

## Out of Scope
- Changing any `FamilyMemberFormModal` behavior or fixing any bug found while writing tests — this story is test-coverage-only (TD-06 explicitly scopes it as "hat keine eigenen Unit-Tests", not "hat einen Bug"). A real bug found while testing gets logged as a new backlog item, not silently fixed here.
- Testing `handleBackdropClick`'s exact click-outside-to-close behavior beyond a basic check — this is a well-established, already-proven pattern in this codebase (used identically across every modal); a single confirming test is enough, not an exhaustive backdrop-interaction suite.
- `SettingsPage.tsx`-level integration tests (where this modal is actually opened/wired up) — out of scope, hook/component-level only, consistent with how `TaskFormModal.test.tsx`/`EventFormModal.test.tsx` are scoped to the modal itself, not the page.
- `AvatarBadge` itself is not re-tested here — it already has its own test suite (`AvatarBadge.test.tsx`, FS-02); this story only verifies `FamilyMemberFormModal` passes the right `initials`/`color` props to it.

## Notes
- Read `FamilyMemberFormModal.tsx` directly: `onSave: (input: CreateFamilyMemberInput) => Promise<string | null>` is a different contract shape than `QuickAddBar`'s `onAdd: (...) => Promise<void>` (TD-10) or `useShoppingListApi`'s `Promise<void>`-returning operations (TD-08) — here the *return value itself* carries the error (a string) or success (`null`), rather than the component swallowing errors into its own `error` state via try/catch. `handleSubmit` has no `try/catch` around `await onSave(...)` either, but unlike `QuickAddBar`'s TD-10 finding, that's not obviously a live bug here since `onSave`'s contract is "always resolves with a string-or-null", not "may reject" — Dev/Tester should still note if this assumption doesn't hold up under scrutiny (e.g. if a rejected promise is realistically possible from the modal's real callers).
- `saving` state already disables the submit button during the in-flight request (`disabled={!isValid || saving}`), giving a double-submit guard "for free" — same shape as `QuickAddBar`'s `submitting` flag, worth the same kind of deferred-promise test TD-10 used.
