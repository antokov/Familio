# Architect Decision — Dokumente nach zugewiesener Person gruppieren (Mode A: Pre-Dev Scoping)

## Summary

Pure frontend, webapp-only change. No backend touch — `GET /api/documents` and `GET /api/family-members` already return everything needed, both already fetched on this page. This brings the webapp to parity with the already-shipped Android grouping (see backlog Architecture Log entry "Group Android documents by family member"), and should copy that implementation's exact semantics (group order, empty-group omission, "Allgemein" label) rather than re-deriving them.

## Files Dev Must Touch

1. `webapp/src/pages/DocumentsPage.tsx` — add an exported pure function `groupDocuments(documents: Document[], familyMembers: FamilyMember[]): DocumentGroup[]` and use it to render one `<DocumentGroupHeader>` + `<ul>` per group instead of today's single flat `<ul>`.
2. `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.tsx` — **new** small presentational component: renders an `AvatarBadge` (size `sm`) + name for a family-member group, or just the "Allgemein" text (no avatar) for the unassigned group. Mirrors Android's `DocumentGroupHeader` composable 1:1.
3. `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.module.css` — **new**, minimal (row layout + muted label text, matching Android's `textMuted` + small title style).
4. `webapp/src/pages/DocumentsPage.module.css` — small addition for group spacing (e.g. a `.group` wrapper margin) if the existing `.list` gap isn't sufficient once split into multiple `<ul>`s.
5. `webapp/src/pages/DocumentsPage.test.tsx` — **new file.** No test file exists for this page today (tracked as part of existing backlog TD-13, scope explicitly already includes "Extraktions-Verdrahtung"; this story adds the grouping logic itself under the same umbrella). Cover `groupDocuments` directly (pure function, easy to unit test) plus a handful of render-level assertions (headers present/absent, "Allgemein" omitted when nothing unassigned, empty state still wins over any group at zero documents).
6. `webapp/src/components/DocumentGroupHeader/DocumentGroupHeader.test.tsx` — **new**, small (2-3 tests: renders avatar+name for a member, renders "Allgemein" without avatar).

Do not touch `DocumentItem.tsx`, `useDocuments.ts`, `useFamilyMembers.ts`, or any backend file — none of them need to change for this story.

## Patterns to Follow

- **Copy Android's exact grouping algorithm**, translated to TS: group `documents` by `familyMemberId` (`null` key = unassigned); assemble the final ordered list as `[unassigned group (if non-empty), ...familyMembers.map(member => member's group if non-empty)]`. This is a direct port of `DocumentsScreen.kt`'s `byMemberId`/`groups` logic — do not invent a different ordering (e.g. do not alphabetize, do not put "Allgemein" last).
- **Pure, colocated, exported helper function** — follow this codebase's established convention (`computeEventLayout` in `WeekView.tsx`, `getNextDueDate` in `useTasks.ts`, `extractDate`/`extractTime` in `EventFormModal.tsx`) of exporting a pure grouping/computation function directly from the component file that uses it, rather than introducing a new `utils/` directory (none exists in this codebase today — do not create one for a single function).
- **Recompute on every render, no memoization/caching** — `groupDocuments(documents, familyMembers)` is called directly in the render body from the already-reactive `documents`/`familyMembers` state; this is what makes reassignment (AC4) and member-deletion (edge case 3) "just work" with zero extra wiring. Do not wrap it in `useMemo` unless a real performance problem is demonstrated — premature optimization isn't warranted for a family-sized document list.
- **New component, not inline JSX** — `DocumentGroupHeader` becomes its own component (mirroring Android's own `DocumentGroupHeader` composable) so it's independently testable and consistent with this codebase's convention of one component per meaningful, reusable UI unit (e.g. `AvatarBadge`, `DocumentItem`).
- **Reuse `AvatarBadge`** exactly as `DocumentItem`/`EventFormModal`/`ExtractEventsModal` already do — `size="sm"` (matching Android's `AvatarSize.SM` choice for this exact header context).
- **Empty-group omission via the groupBy itself** — do not iterate `familyMembers` unconditionally and then filter; build groups only from members that actually appear as keys in the `documents`-derived grouping (same as Android's `byMemberId[member.id]?.let { ... }`), so a member with zero documents produces no entry at all, not an entry that gets filtered out later.

## Explicit Constraints (What NOT to Do)

- Do NOT touch the backend — no new endpoint, no new query param, no sorting change on `GET /api/documents`.
- Do NOT change `DocumentItem.tsx`'s own rendering, props, or the per-item assignment `<select>`'s wording — this story only adds a grouping/header layer around the existing list rendering (see story.md "Out of Scope").
- Do NOT re-sort documents within a group — keep whatever order the API returns (`ORDER BY uploaded_at DESC`, unchanged).
- Do NOT create a new `webapp/src/utils/` directory for `groupDocuments` — export it from `DocumentsPage.tsx` per the established colocation convention.
- Do NOT let the "Keine Dokumente" empty state and the grouped rendering coexist — the empty-state early return must remain first, exactly as today, so zero documents never renders zero empty group headers either.
- Do NOT introduce collapsible/expandable sections — out of scope per story.md.

## Files Dev Needs in Context (max 8)

1. `webapp/src/pages/DocumentsPage.tsx`
2. `webapp/src/pages/DocumentsPage.module.css`
3. `webapp/src/components/DocumentItem/DocumentItem.tsx` (reference — do not modify)
4. `webapp/src/components/AvatarBadge/AvatarBadge.tsx` (reference — component to reuse)
5. `webapp/src/types/document.ts`
6. `webapp/src/types/family.ts`
7. `webapp/src/hooks/useDocuments.ts` (reference — confirms `documents` shape/order, do not modify)
8. `webapp/src/hooks/useFamilyMembers.ts` (reference — confirms `familyMembers` shape/order, do not modify)

No blockers — small, additive, fully precedented by the already-shipped Android implementation (same grouping semantics, same "Allgemein" label, same empty-group-omission rule). Proceeding to Design phase (`webapp/src/` files are in scope).
