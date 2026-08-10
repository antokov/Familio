# BA Analysis — Dokumente nach zugewiesener Person gruppieren

## 1. Business Rules

1. Documents are partitioned into groups by `familyMemberId`: one group per family member that owns at least one document, plus one "Allgemein" group for documents with `familyMemberId === null`.
2. **Group order** (resolved by existing Android precedent — see commit "Group Android documents by family member and add camera-scan upload" — adopted as-is for webapp/Android consistency, no new decision needed): "Allgemein" first, then one section per family member in the order `familyMembers` is already returned by the API/hook (creation order) — *not* alphabetical, *not* re-sorted.
3. **Empty groups are omitted entirely** — a family member with zero documents gets no section header at all; "Allgemein" is likewise omitted if there are zero unassigned documents (AC3). This falls out naturally from grouping by existing documents rather than iterating all family members unconditionally.
4. Documents *within* a group keep whatever order the API already returns them in (currently newest-first via `ORDER BY uploaded_at DESC` in `GET /api/documents`) — grouping is a client-side partition, not a re-sort.
5. Reassigning a document (via the existing per-item `<select>`) moves it between groups live, with no page reload — this already falls out of the existing reactive `documents` state (`useDocuments`) once rendering is grouped by `familyMemberId`, as long as the grouping is recomputed on every render rather than cached/memoized against a stale snapshot.
6. Zero documents overall → existing "Keine Dokumente" empty state renders unchanged, no group headers of any kind (AC5) — this is a pre-existing early-return in `DocumentsPage.tsx` that must remain first in the render order.

## 2. Edge Cases

1. **All documents assigned, none unassigned:** "Allgemein" section must not render (empty string/zero-length group is skipped) — covered by rule 3.
2. **All documents unassigned, none assigned:** every family member section is skipped; only "Allgemein" renders. Symmetric case of #1, same mechanism.
3. **A family member with documents gets deleted:** `Document.family_member_id` already becomes `NULL` via the existing `ON DELETE SET NULL` FK (same mechanism already relied on in the "Zugewiesene Person"-Extraktion story) — those documents simply reappear under "Allgemein" on the next render, no special-casing needed.
4. **Reassigning the last document out of a family member's group:** that member's section must disappear immediately (not linger empty) — same "recompute from current `documents` array on every render" mechanism as rule 5, no stale/cached grouping.
5. **New family member with no documents yet:** must not get an empty section — consistent with rule 3 (groups are derived from documents that exist, not from the family-member list independently).

## 3. Data Model Implications

**None.** Purely a client-side rendering/grouping change in `DocumentsPage.tsx`. No backend changes: `GET /api/documents` and `GET /api/family-members` already return everything needed (`Document.familyMemberId`, `FamilyMember.id`/`.name`/`.initials`/`.color`), both already fetched on this page today via `useDocuments()`/`useFamilyMembers()`.

## 4. Open Questions

None — the exact grouping semantics (order, empty-group omission, "Allgemein" label and its position) are already fully specified by the existing, already-shipped Android implementation, which this story explicitly brings the webapp to parity with. No new product decision is required.

No BLOCKING questions. Proceeding to Architect phase.
