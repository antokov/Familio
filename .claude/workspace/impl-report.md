# Dev Implementation Report — Dokumente nach zugewiesener Person gruppieren

## Approach

Frontend-only, exactly per `arch-decision.md`/`design-decision.md`, porting the already-shipped Android grouping semantics (order, "Allgemein" label, empty-group omission) 1:1 to the webapp.

- `groupDocuments(documents, familyMembers)` — new exported pure function in `DocumentsPage.tsx`: buckets documents by `familyMemberId`, then assembles the ordered result as `[Allgemein-if-non-empty, ...familyMembers order, each if non-empty]`. Recomputed directly in the render body (no memoization) so reassignment/deletion just fall out of the existing reactive `documents`/`familyMembers` state.
- `DocumentGroupHeader` — new component: `AvatarBadge size="sm"` + `<h3>` name for a member group, or just an `<h3>Allgemein</h3>` (no avatar) for the unassigned group.
- `DocumentsPage.tsx` render: replaced the single flat `<ul>` with one `.group` wrapper (header + `<ul>`) per `groupDocuments()` entry.

## Files Changed

- `webapp/src/pages/DocumentsPage.tsx` — `groupDocuments()` + `DocumentGroup` type (exported), grouped render.
- `webapp/src/pages/DocumentsPage.module.css` — `.groups` (space-6 gap between sections), `.group` wrapper.
- `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.tsx` — **new**.
- `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.module.css` — **new**.
- `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.test.tsx` — **new**, 2 tests.
- `webapp/src/pages/DocumentsPage.test.tsx` — **new file** (none existed before, per arch-decision scope note referencing TD-13's coverage gap). 11 tests: 6 on `groupDocuments` directly (order, empty-group omission in both directions, empty input, orphaned-`familyMemberId` fallback, within-group order preservation) + 3 render-level tests mocking `useDocuments`/`useFamilyMembers`/`useEvents` via `vi.hoisted`.

## Assumptions Made

- None beyond what arch-decision.md/design-decision.md already specified.

## Deviations from arch-decision.md / design-decision.md

- **One implementation-detail addition not specified by either doc:** `DocumentGroupHeader`'s label renders as an `<h3>` rather than a bare `<span>`. Reason: `DocumentItem`'s own reassignment `<select>` lists every family member's name as an `<option>` on *every* document row, so a plain-text header ("Anton") is not reliably distinguishable from an option with the same text once multiple documents are on screen — a real test-writing exercise surfaced this ambiguity immediately. Giving the header proper heading semantics (`role` implicit via `<h3>`) makes it unambiguously queryable (`getByRole('heading', ...)`) and is a genuine accessibility improvement (screen-reader users get real landmarks for "whose documents are these"), not just a testing workaround. Visual styling is unchanged (`margin: 0` added to counteract the browser's default `<h3>` margin, font-size/weight/color exactly as designed).
- **Bug caught and fixed during test-writing, not spec'd defensively in arch-decision.md:** a document whose `familyMemberId` doesn't match any currently-known family member (a state the real app shouldn't produce, since `Document.family_member_id`'s `ON DELETE SET NULL` FK guarantees it becomes `NULL` on member deletion — but not a state the grouping function itself was protected against) was silently dropped from every group instead of falling back to "Allgemein". Fixed by checking `doc.familyMemberId` against a `Set` of known member ids before using it as a group key. This is a robustness improvement consistent with BA edge case 3's intent ("those documents simply reappear under Allgemein"), not a scope change.

## Technical Debt / Follow-up

None introduced.

## Open Items

None requiring a human decision.
