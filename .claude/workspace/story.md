# User Story

**Type:** Business Feature

## Story
As a family member browsing the Documents page,
I want documents grouped by the family member they're assigned to (with an "Allgemein" group for unassigned documents),
so that I can quickly find documents relevant to a specific person instead of scanning one long flat list.

## Acceptance Criteria

**AC1:** Given documents exist that are assigned to different family members, when I open the Documents page, then documents are displayed under section headers — one section per family member that has at least one document, plus an "Allgemein" section for documents with no assigned family member.

**AC2:** Given a document has no assigned family member, when I view the Documents page, then it appears under the "Allgemein" section (not hidden, not under a family member section).

**AC3:** Given all documents are assigned to family members (none unassigned), when I view the Documents page, then no empty "Allgemein" section is shown.

**AC4:** Given I reassign a document to a different family member (or unassign it) via the existing assignment dropdown, when the reassignment succeeds, then the document immediately moves from its old group to its new group without a page reload.

**AC5:** Given no documents exist at all, when I open the Documents page, then the existing "Keine Dokumente" empty state is shown as today (no group headers rendered for zero documents).

## Out of Scope
- Changing sort order *within* a group (documents within a group keep whatever order the API already returns them in, e.g. newest-first — unchanged)
- Collapsible/expandable group sections (all groups always render fully expanded)
- Changing the per-document assignment `<select>` dropdown's own wording (e.g. its "Nicht zugewiesen" option) — that control is unaffected, only the page-level grouping/section-header layer is new
- Persisting a user's preferred group order across sessions (a fixed, deterministic order is fine — see BA for the exact ordering rule)
- Android app (this already has grouping — see "Group Android documents by family member" — this story brings the webapp to parity with it, no further Android work)

## Notes
- This is a webapp parity story: the Android app already groups documents by assigned family member with an "Allgemein" group for unassigned ones (see the "Group Android documents by family member and add camera-scan upload" change) — the webapp should adopt the same grouping concept and the same "Allgemein" label for the unassigned group.
- The webapp currently renders `documents` as one flat `<ul>` via `DocumentItem` in `DocumentsPage.tsx` — this is a purely additive grouping layer on top of that, no `DocumentItem` behavior changes expected.
