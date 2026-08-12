# User Story

**Type:** Technical Debt (TD-13)

## Story
As a developer maintaining the documents feature,
I want `DocumentUploadModal` to have its own render tests and `DocumentsPage` to have render tests covering its composition/wiring (grouping, loading/empty/error states, and — since "Termine aus Dokument extrahieren" shipped after TD-13 was first filed — the extraction wiring `handleExtract` plus its error/success banners),
so that future changes to document upload or the documents page's composition logic can't silently regress without a test catching it, consistent with how `FamilyMemberFormModal` (TD-06) and `SettingsPage` already have coverage.

## Acceptance Criteria

**AC1 (DocumentUploadModal):** Given the modal renders, when the user selects a file and optionally a family member, then submitting calls `onSave(file, familyMemberId)` with `familyMemberId` as `null` when unassigned (not `''`); given `onSave` resolves `null` (success), the modal closes; given it resolves a string (server error), that string displays inline and the modal stays open; given no file is selected, the submit button stays disabled and `onSave` is never called; given a submit is in flight, the button reads "Wird hochgeladen…" and is disabled (double-submit guard).

**AC2 (DocumentsPage — composition):** Given `documents`/`familyMembers` from the hooks, when the page renders, then documents are grouped and headed exactly as `groupDocuments()` (already unit-tested) produces — "Allgemein" first for unassigned, then one section per family member with at least one document; given `loading` is true, a loading indicator shows instead of the list; given `documents` is empty and not loading/erroring, an empty-state message shows; given `useDocuments`' own `error` is set, an error banner shows.

**AC3 (DocumentsPage — upload flow):** Given the user clicks "Hochladen", when that happens, then `DocumentUploadModal` opens; given it closes (cancel or successful save), the modal disappears from the page.

**AC4 (DocumentsPage — extraction wiring, `handleExtract`):** Given the user triggers extraction on an extractable document, when `handleExtract` runs, then it calls the `extractEvents` hook function for that document's id, the triggering `DocumentItem` reflects an in-flight state (`extracting` prop) for the duration of the call, and — given the call resolves with events — `ExtractEventsModal` opens with that document's filename and the resolved candidates; given the call resolves with an error, no modal opens and an error banner displays the server's message instead; given a fresh extraction attempt starts, any previously-shown extraction error or success banner from an earlier attempt is cleared first.

**AC5 (DocumentsPage — extraction completion):** Given `ExtractEventsModal`'s `onDone(createdCount)` fires, when that happens, then a success banner shows `"1 Termin wurde angelegt."` for a count of 1, or `"{n} Termine wurden angelegt."` for any other count (including 0); given `ExtractEventsModal`'s `onClose()` fires, the modal disappears without necessarily showing a success banner (closing without completing).

## Out of Scope
- Re-testing `DocumentItem`, `DocumentGroupHeader`, `DocumentPreviewModal`, or `ExtractEventsModal`'s own internal behavior — all four already have their own dedicated test suites (27, 2, 8, and 20 tests respectively). This story tests `DocumentsPage`'s composition/wiring of them, not their internals.
- Re-testing `groupDocuments()`'s own grouping/ordering logic in exhaustive detail — already covered by its extraction into a pure, separately-testable function (per the "Dokumente nach zugewiesener Person gruppieren" Architecture Log entry); AC2 only needs to confirm `DocumentsPage` actually calls it and renders its output, not re-derive every grouping edge case.
- Re-testing `useDocuments`/`useFamilyMembers`/`useEvents` hook internals — already covered (TD-12, and `useFamilyMembers`/`useEvents` elsewhere); this story mocks those hooks at the module level for `DocumentsPage`'s tests, following the precedent already established by `SettingsPage.test.tsx`'s `vi.mock('../hooks/useFamilyMembers', ...)`.
- Drag-and-drop file upload, multi-file upload, or any upload UX beyond the existing single-file `<input type="file">` — not present in `DocumentUploadModal.tsx` today, not being added here.
- `DocumentsPage`-level tests for delete/rename/reassign's own success/failure UI beyond confirming the callback wiring exists and is called with correct arguments — the resulting state changes (e.g. "document removed from list after delete") are already implicitly covered by `useDocuments`' own hook tests (TD-12) since `DocumentsPage` just renders whatever `documents` the hook returns.

## Notes
- Read `DocumentsPage.tsx`, `DocumentUploadModal.tsx` directly. `DocumentUploadModal` is structurally near-identical to `FamilyMemberFormModal` (TD-06) — same `Promise<string | null>` `onSave` contract, same submit-guard/backdrop/double-submit shape — Architect should point Dev at `FamilyMemberFormModal.test.tsx` as the primary structural template for `DocumentUploadModal.test.tsx`.
- `DocumentsPage` depends on three hooks (`useDocuments`, `useFamilyMembers`, `useEvents`) and renders five child components, three of which (`DocumentUploadModal`, `DocumentPreviewModal`, `ExtractEventsModal`) are modals that only mount conditionally. Given `ExtractEventsModal` alone has 20 tests covering its own internal multi-step flow, reaching its `onDone` callback through a fully-real render (select candidates, confirm, wait for `createEvent` calls...) would largely duplicate that existing suite just to test `DocumentsPage`'s own two-line `handleExtractionDone` handler. Architect should decide whether `ExtractEventsModal` gets mocked for `DocumentsPage`'s tests (this codebase has no prior example of mocking a child component in a page test — `SettingsPage.test.tsx` only mocks hooks — so this would be a new, if standard, technique) or whether a lighter alternative satisfies AC5 without full duplication.
