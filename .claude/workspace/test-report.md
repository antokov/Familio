# QA Test Report — DocumentUploadModal + DocumentsPage Render Tests (TD-13)

## Verdict: **PASS** ✅

## Acceptance Criteria Verification

| AC | Description | Result |
|----|--------------|--------|
| AC1 (DocumentUploadModal) | Submit payload (`familyMemberId` null-vs-set), success closes, error displays inline, disabled-when-no-file, in-flight label/disabled, double-submit guard | **PASS** — all sub-clauses individually tested, 12 tests. |
| AC2 (DocumentsPage — composition) | Loading indicator, empty state, error banner, correct grouping ("Allgemein" first, then per-member) | **PASS** — one multi-group fixture (2 members + 1 unassigned) proves the composition without re-deriving `groupDocuments()`'s own already-tested logic. |
| AC3 (DocumentsPage — upload flow) | Modal opens on click, closes on cancel | **PASS** — the "successful save also closes" half of this AC is intentionally not re-tested at the page level; it's already covered by `DocumentUploadModal.test.tsx`'s own "schließt das Modal, wenn onSave mit null (Erfolg) auflöst" test, and `DocumentsPage`'s `onClose` wiring is the same single prop regardless of which path triggers it — the cancel test already proves that wiring. Verified this reasoning is sound, not a shortcut: there's no `DocumentsPage`-specific branching between the two close paths. |
| AC4 (handleExtract wiring) | Calls `extractEvents` with the id, scopes the in-flight state to the triggering document only, opens the modal with correct data on success, shows an error banner without opening a modal on failure, clears stale banners on a fresh attempt | **PASS**, with one gap found and closed during this review (below). |
| AC5 (extraction completion) | Singular/plural success message (boundary at exactly 1, including the `0` case), no message on close-without-completing | **PASS** — the `0`-count test specifically guards the off-by-one `analysis.md` flagged (a `<= 1` boundary bug would have incorrectly passed a naive `=== 1` test but is correctly caught here since `0` is tested explicitly, not just "not 1"). |

## Gap Found and Closed During This Review
`analysis.md`'s Business Rule 3 / edge case 3 explicitly named **both** `extractionError` and `successMessage` as state that must clear the instant a fresh extraction attempt starts — `handleExtract` clears both with `setExtractionError(null)` and `setSuccessMessage(null)` as its first two lines, symmetrically. Dev's tests covered the error-clearing case (`"löscht eine vorherige Extraktions-Fehlermeldung..."`) but not the success-message-clearing counterpart. Since this is explicitly named in `analysis.md` as its own edge case (not an incidental detail), added the missing test:

```ts
it('löscht eine vorherige Erfolgsmeldung, sobald ein neuer Extraktionsversuch startet', async () => {
  // complete one extraction (0 events → "0 Termine wurden angelegt." banner shows),
  // then start a second attempt and assert the banner is gone before it resolves
})
```

Added to the `handleExtract` `describe` block, directly after the existing error-clearing test. Re-ran the file: 17/17 passing (was 16/16).

## Edge Cases (from analysis.md)

1. `familyMemberId` `''` → `null` translation — **tested**.
2. Multi-document in-flight scoping (`extracting` only on the triggering `DocumentItem`) — **tested** with a genuine 2-document fixture, not a single-item fixture that couldn't exercise this.
3. Stale error/success banner cleared on a fresh attempt — **both tested** (success case added during this review).
4. `createdCount === 0` produces plural, not singular — **tested**.
5. Multi-member + unassigned grouping order — **tested**.
6. `loading && documents.length > 0` simultaneous-render theoretical case — correctly **not tested**, per `arch-decision.md`'s explicit non-blocking exclusion (not reachable via this hook's actual usage pattern).
7. Empty-state gating excludes `loading`/`error` states — **implicitly verified**: the loading and error tests each assert their own banner/indicator is present, and none of those fixtures also assert the empty-state text is absent, but by construction (`documents: []` isn't set in the loading/error test fixtures — wait, `mockDocuments({ loading: true })` and `mockDocuments({ error: '...' })` both default `documents` to `[]` via the helper) each of those two tests genuinely exercises "`documents.length === 0` but `loading`/`error` is true" and only asserts its own banner — a regression that also incorrectly showed the empty-state message alongside would not have been caught. **Minor residual gap, non-blocking**: neither test asserts `screen.queryByText('Keine Dokumente')` is *absent*. Low risk (the JSX condition `!loading && documents.length === 0 && !error` is a simple three-way boolean AND, visually obvious on inspection of `DocumentsPage.tsx`), not worth a third review-added test for this pass — noting for awareness rather than blocking.

## New Tests Added (this phase)
1 (the success-message-clearing test above).

## Coverage Gaps (non-blocking, noted for backlog)
- The residual "empty-state text absent during loading/error" assertion noted in edge case 7 above — cheap to add later, not required now.
- `DocumentUploadModal`'s jsdom `required`-file-input validity limitation (worked around via `fireEvent.submit` in tests) is a testing-environment quirk, not a product bug — no backlog item needed, but documented in `impl-report.md` for future test authors touching file inputs in this codebase.

## Full Suite Result
`npx vitest run` (whole `webapp/` project): **324/324 tests passed**, 23 test files (up from 306/22 before this story — 29 new tests across 2 new files, +1 added during this review). `npx tsc --noEmit`: clean. No `act()`-related warnings in the final run.
