# Architect Decision — DocumentUploadModal + DocumentsPage Render Tests (TD-13)

## Mode A — Pre-Dev Scoping

## Resolution of analysis.md's Open Question
**Mock `ExtractEventsModal` for `DocumentsPage.test.tsx`.** Confirmed via `analysis.md`: reaching `onDone` through a fully-real render would duplicate most of that component's own 20-test suite. Use `vi.mock('../components/ExtractEventsModal/ExtractEventsModal', () => ({ ExtractEventsModal: (props) => <div data-testid="extract-modal-stub">...render key props, expose buttons that call props.onDone(n) / props.onClose()...</div> }))`. This is a new technique for this codebase (no prior page test mocks a child component — `SettingsPage.test.tsx` only mocks hooks), but it's the standard, correct integration-boundary pattern and directly serves AC4/AC5 without re-testing `ExtractEventsModal` itself. `DocumentUploadModal` and `DocumentPreviewModal` are NOT mocked (see reasoning in `story.md`'s Notes, confirmed here) — `DocumentUploadModal` gets its own full suite (AC1) and can render for real inside `DocumentsPage.test.tsx`'s minimal "opens on click" test; `DocumentPreviewModal`'s involvement is a trivial prop-pass, no flow to short-circuit.

## Existing Code to Reuse / Extend
- `webapp/src/components/DocumentUploadModal/DocumentUploadModal.tsx` — structurally near-identical to `FamilyMemberFormModal.tsx` (TD-06): same `Promise<string | null>` `onSave` contract, same `disabled={!X || saving}` submit guard, same backdrop-click-to-close pattern. **Use `FamilyMemberFormModal.test.tsx` as the direct structural template** for `DocumentUploadModal.test.tsx` — render-helper factory, deferred-promise double-submit test, backdrop-vs-content-click tests, all transplant near-verbatim with field names swapped (file input instead of name/initials/color).
- `webapp/src/pages/SettingsPage.test.tsx` — the only existing page-level test file in this codebase. Establishes the `vi.mock('../hooks/useXxx', () => ({ useXxx: () => ({...static return value...}) }))` pattern for page tests — **reuse this exact technique** for all three of `DocumentsPage`'s hooks (`useDocuments`, `useFamilyMembers`, `useEvents`), each mocked to return static, per-test-adjustable data instead of hitting `fetch`.
- `webapp/src/pages/DocumentsPage.tsx`'s own already-exported `groupDocuments()` (pure function, separately tested per its own Architecture Log entry) — do NOT re-derive its grouping logic in `DocumentsPage.test.tsx`; AC2's tests only need one multi-group fixture proving the page calls it and renders its output, not an exhaustive grouping-edge-case suite (that's `groupDocuments`'s own test's job, which already exists — verify it still does, don't duplicate).
- `webapp/src/components/DocumentItem/DocumentItem.tsx`'s aria-labels (`` `Termine aus ${filename} extrahieren` ``, `` `${filename} ansehen` ``, etc.) — use these as real selectors to trigger extraction/preview from within a real, unmocked `DocumentItem` rendered by `DocumentsPage` (do NOT mock `DocumentItem` — it's lightweight enough to render for real, and doing so is what actually proves the wiring works end-to-end from a real click to the page's own handler).

## Files Dev Must Touch
1. **`webapp/src/components/DocumentUploadModal/DocumentUploadModal.test.tsx`** (new file) — AC1, structured per `FamilyMemberFormModal.test.tsx`.
2. **`webapp/src/pages/DocumentsPage.test.tsx`** (new file) — AC2–AC5, structured per `SettingsPage.test.tsx`'s hook-mocking convention plus the new `ExtractEventsModal`-mocking technique described above.

No other files. `DocumentUploadModal.tsx`/`DocumentsPage.tsx` themselves are NOT modified (test-coverage-only story).

## Patterns Dev Must Follow
- **`DocumentUploadModal.test.tsx`**: `describe`-per-concern structure matching `FamilyMemberFormModal.test.tsx` (e.g. `describe('DocumentUploadModal — Absenden', ...)`, `describe('DocumentUploadModal — Validierung', ...)`, `describe('DocumentUploadModal — Schließen', ...)`). Construct files via `new File([...], 'name.pdf', { type: 'application/pdf' })` and set them via `userEvent.upload(fileInput, file)` (the correct Testing Library API for `<input type="file">`, distinct from `userEvent.type()`).
- **`DocumentsPage.test.tsx`**: one `describe` per AC/concern (`describe('DocumentsPage — Gruppierung & Zustände', ...)`, `describe('DocumentsPage — Upload-Flow', ...)`, `describe('DocumentsPage — Extraktion (handleExtract)', ...)`, `describe('DocumentsPage — Extraktion abgeschlossen', ...)`). Each hook mock (`useDocuments`, `useFamilyMembers`, `useEvents`) should be a `vi.fn()`-backed factory so individual tests can override return values (e.g. a test-local `vi.mocked(useDocuments).mockReturnValue({...})` or equivalent re-mock) rather than one single static mock shared unchangeably across the whole file — `DocumentsPage`'s tests need varying `documents`/`loading`/`error`/`extractEvents` per test, unlike `SettingsPage.test.tsx`'s single fixed `MOCK_MEMBERS`.
- For the extraction in-flight test (`analysis.md` edge case 2), use the deferred-promise pattern already established (TD-10/TD-06) for the mocked `extractEvents` hook function, so the `extracting` prop's `true` window is actually observable.
- For the multi-document/multi-group fixture (`analysis.md` edge cases 2, 5), build one shared fixture array (2+ family members, 2+ documents including one unassigned, at least one extractable content type) reused across the relevant tests rather than one-off inline arrays per test — reduces duplication given how many tests in this file need "a realistic multi-document state."

## Explicit Constraints (What NOT to Do)
- Do NOT modify `DocumentUploadModal.tsx` or `DocumentsPage.tsx` — test-coverage-only per `story.md`. Log any real bug found as new Technical Debt in Phase 6, do not fix inline.
- Do NOT re-test `DocumentItem`, `DocumentGroupHeader`, `DocumentPreviewModal`, or `ExtractEventsModal`'s own internals — per `story.md`'s Out of Scope. `DocumentItem`/`DocumentGroupHeader`/`DocumentPreviewModal` render for real (they're simple/cheap and proving the wiring needs a real click target), but assert only on `DocumentsPage`-level outcomes (banners, modal open/closed, hook calls), not on those components' own internal state transitions.
- Do NOT write a dedicated test for `analysis.md` edge case 6 (the theoretical `loading && documents.length > 0` simultaneous-render case) — confirmed non-blocking and not currently reachable via this hook's actual usage pattern; would test a scenario the codebase doesn't currently produce.
- Do NOT re-derive `groupDocuments()`'s own edge cases — one multi-group fixture is enough for `DocumentsPage`'s own tests, per Existing-Code-to-Reuse above.
- Do NOT snapshot-test — same established codebase convention as every other test file.

## Files Dev Needs in Context (max 8)
1. `webapp/src/components/DocumentUploadModal/DocumentUploadModal.tsx`
2. `webapp/src/pages/DocumentsPage.tsx`
3. `webapp/src/components/FamilyMemberFormModal/FamilyMemberFormModal.test.tsx` (structural template for #1)
4. `webapp/src/pages/SettingsPage.test.tsx` (hook-mocking template for #2)
5. `webapp/src/components/DocumentItem/DocumentItem.tsx` (for aria-label selectors used from within `DocumentsPage.test.tsx`)
6. `webapp/src/hooks/useDocuments.ts` (for the exact shape `extractEvents` resolves to, needed to build the mock)
7. `webapp/src/types/document.ts`, `webapp/src/types/family.ts` (fixture typing)

## Phase 3b (Design) — Not Applicable
Both new files are `.test.tsx` — no production UI/CSS changes. Same reasoning as every prior test-coverage story this session.

No architecture risk requiring human escalation — proceeding to Phase 4 (Dev).
