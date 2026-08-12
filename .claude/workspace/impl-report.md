# Dev Implementation Report — DocumentUploadModal + DocumentsPage Render Tests (TD-13)

## Approach
Added two new test files per `arch-decision.md`: `DocumentUploadModal.test.tsx` (12 tests, structured directly on `FamilyMemberFormModal.test.tsx`'s template given the near-identical component shape) and `DocumentsPage.test.tsx` (16 tests, structured on `SettingsPage.test.tsx`'s hook-mocking convention, extended with a mocked `ExtractEventsModal` stand-in per `analysis.md`'s resolved Open Question). No production code (`DocumentUploadModal.tsx`/`DocumentsPage.tsx`) was touched.

## Files Changed
- `webapp/src/components/DocumentUploadModal/DocumentUploadModal.test.tsx` (new) — 12 tests.
- `webapp/src/pages/DocumentsPage.test.tsx` (new) — 16 tests.

## Assumptions Made
- **`ExtractEventsModal` mocking (new technique for this codebase):** `vi.mock('../components/ExtractEventsModal/ExtractEventsModal', ...)` replaces it with a minimal stand-in exposing `filename`/`candidates.length` as `data-testid` text and two buttons that directly invoke the real `onDone`/`onClose` props it received. This proves `DocumentsPage` wires the real callback and passes the right data, without re-testing `ExtractEventsModal`'s own 20-test-covered internal review/confirm flow — exactly the boundary `analysis.md` recommended.
- Hook mocks (`useDocuments`/`useFamilyMembers`/`useEvents`) are `vi.fn()`-backed (not static objects like `SettingsPage.test.tsx`'s single `useFamilyMembers` mock) so each test can reconfigure `documents`/`loading`/`error`/`extractEvents` via `vi.mocked(useDocuments).mockReturnValue(...)` — necessary here since `DocumentsPage`'s tests need many different hook states, unlike `SettingsPage`'s single fixed fixture.
- Multi-document/multi-group fixtures (`DOC_UNASSIGNED`, `DOC_MEMBER_A`, `DOC_MEMBER_B`, `MEMBER_A`, `MEMBER_B`) are shared module-level constants reused across tests, per `arch-decision.md`'s guidance to avoid one-off inline arrays.

## Deviations from arch-decision.md
Two real, unanticipated jsdom/tooling issues discovered and worked around during implementation — both fixed within the test files, no scope or production-code impact:

1. **`DocumentUploadModal.test.tsx` — jsdom `required`-file-input validity bug.** This jsdom version's `validity.valueMissing` never clears on a `required` `<input type="file">` even after `userEvent.upload()` correctly sets `.files`. A real `userEvent.click()` on the submit button therefore never reaches native form submission (`onSave` was called 0 times in every submission test on first attempt). Root-caused via a standalone diagnostic before touching the real test file (confirmed `files.length === 1` but `validity.valid === false` after upload; confirmed `fireEvent.submit(form)` — which bypasses native constraint validation entirely, unlike a real click — reliably fires the handler). Fixed by adding a documented `submitForm(container)` helper using `fireEvent.submit`, reserving `userEvent.click` only for interactions that don't depend on native form validity (the double-submit guard test specifically still uses a real click on the *disabled* button, since that's the actual UI-level protection this component relies on — it has no internal `saving`-state re-entry guard, same finding as `FamilyMemberFormModal`, TD-06).
2. **`DocumentsPage.test.tsx` — spurious "not configured to support act(...)" warning.** Several tests wrapped an already-`act`-instrumented `userEvent.click()` call inside an additional manual `act(async () => { await user.click(...) })`. `@testing-library/user-event` v14 already act-wraps its interactions internally; the redundant outer wrapper triggered React's "environment not configured" warning (tests still passed, but the warning signals a real anti-pattern worth not shipping). Removed the redundant wrapper everywhere a plain `await user.click(...)` sufficed, keeping manual `act()` only where actually needed (resolving a deliberately-deferred promise from outside any `userEvent` call).

## Technical Debt / Follow-up
None new. Confirmed no bugs in `DocumentUploadModal.tsx`/`DocumentsPage.tsx` — `handleExtract`'s error-clearing-on-new-attempt behavior, the singular/plural boundary at exactly `1`, and the per-document `extracting` scoping all work as `analysis.md` described.

## Open Items
None requiring human input.

## Verification
- `npx vitest run src/components/DocumentUploadModal`: 12/12 passed, no warnings.
- `npx vitest run src/pages/DocumentsPage.test.tsx`: 16/16 passed, no warnings.
- `npx vitest run` (full webapp suite): 323/323 passed.
- `npx tsc --noEmit`: clean.
