# Tester QA Report — Dokumente nach zugewiesener Person gruppieren

## Acceptance Criteria Verification

- **AC1** (section per member with ≥1 document, plus "Allgemein"): PASS — `groupDocuments` unit tests ("gruppiert nach Allgemein zuerst...") and render test ("zeigt Gruppen-Header für zugewiesene und unzugewiesene Dokumente").
- **AC2** (unassigned document appears under "Allgemein", not hidden): PASS — covered directly, plus the fallback case where a *stale* `familyMemberId` (matching no known member) also correctly lands in "Allgemein" rather than disappearing (see Dev's bug fix below).
- **AC3** (no empty "Allgemein" when nothing unassigned): PASS — `groupDocuments` test + render test ("zeigt keine Allgemein-Gruppe, wenn alle Dokumente zugewiesen sind").
- **AC4** (reassignment moves a document between groups live, no reload): PASS — this AC was **not exercised** by Dev's own tests (the mocked `reassignDocument` is a no-op `vi.fn()`, so a real click-through never actually changes `mocks.documents`). Added a Tester test that renders with the document under "Anton", mutates the mocked `documents` array to reflect what `useDocuments` would hold after a successful reassignment, and `rerender()`s — confirming the document moves to "Mira" and the now-empty "Anton" section disappears, in a single render pass with no remount.
- **AC5** (zero documents → existing empty state, no group headers): PASS — render test confirms "Keine Dokumente" renders and no heading (neither "Allgemein" nor a member name) appears.

## Edge Cases (from analysis.md)

1. **All assigned, no unassigned** — PASS (AC3 test doubles as this).
2. **All unassigned, no assigned** — PASS. Added a `groupDocuments` test ("liefert nur die Allgemein-Gruppe, wenn alle Dokumente unzugewiesen sind") — Dev's own tests didn't cover this symmetric case explicitly.
3. **Family member deleted, their documents' `familyMemberId` reverts to `NULL`** — PASS, and additionally hardened: while writing tests, Dev found and fixed a real gap where a document with a `familyMemberId` matching *no* known member (not `null`, just orphaned/unrecognized) was silently dropped from every group instead of falling back to "Allgemein". Verified by `groupDocuments`'s "gruppiert Dokumente eines gelöschten Mitglieds unter Allgemein" test.
4. **Reassigning the last document out of a group removes that section** — PASS, covered by the same new rerender-based Tester test above (the "Anton" heading disappears once its only document moves away).
5. **New family member with zero documents gets no section** — PASS — `groupDocuments`'s "lässt leere Gruppen komplett weg" test (MIRA has zero documents in that fixture and produces no group entry).

## New Tests Added (Tester pass, on top of Dev's own)

- `DocumentsPage.test.tsx`: "liefert nur die Allgemein-Gruppe, wenn alle Dokumente unzugewiesen sind" (pure-function symmetric case), "bewegt ein Dokument live in seine neue Gruppe und entfernt die alte, wenn sie leer wird" (AC4 + edge case 4, rerender-based). 2 new tests.

## Coverage Gaps (pre-existing or accepted, not introduced by this story)

- The rerender-based AC4 test simulates the *result* of a successful `reassignDocument` call by directly mutating the mocked hook's return value, rather than driving it through an actual `<select>` `onChange` → `reassignDocument()` → state-update chain (that chain is `DocumentItem`'s + `useDocuments`' own responsibility, both pre-existing and already covered by their own respective test suites — `DocumentItem.test.tsx` already verifies the `<select>` fires `onReassign` correctly). This story's own new code (`groupDocuments`, `DocumentGroupHeader`) is fully exercised either way.
- `DocumentsPage.test.tsx` did not exist before this story; it now exists but is scoped to grouping — broader page-level coverage (upload modal wiring, preview wiring, extraction wiring) remains tracked under the existing **TD-13** backlog item, unchanged by this story.

## Verdict

**PASS** ✅ — all 5 acceptance criteria verified (one, AC4, only after a Tester-added test since Dev's suite didn't exercise it), all identified edge cases covered, one real defect (orphaned-`familyMemberId` documents vanishing) caught and fixed during implementation, full regression suite green (204 frontend tests, 122 backend tests unaffected/unchanged), `tsc --noEmit` clean.
