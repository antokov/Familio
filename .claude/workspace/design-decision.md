# Design Decision — Dokumente nach zugewiesener Person gruppieren

## Scope
`DocumentsPage.tsx` / `DocumentsPage.module.css` (render structure: one header + one `<ul>` per group instead of one flat `<ul>`) and a new `DocumentGroupHeader` component. `DocumentItem` itself is visually untouched.

## Layout

Each group becomes a `<section>`-like block: a header row, then that group's `<ul>` of `DocumentItem`s (same `.list` styling as today, just repeated per group instead of once globally):

```
( M ) Mira
  [ DocumentItem ]
  [ DocumentItem ]

( A ) Anton
  [ DocumentItem ]

Allgemein
  [ DocumentItem ]
```

Groups stack with `var(--space-6)` between them (one step up from the existing `.list` internal gap of `var(--space-2)`) — enough separation to read as distinct sections without needing a divider line or background-color block, consistent with how this app generally separates content via whitespace + typography rather than boxes/borders (compare `SettingsPage`'s section spacing).

## Token Usage

- **`DocumentGroupHeader` row:** `display: flex`, `align-items: center`, `gap: var(--space-2)`, `margin-bottom: var(--space-2)` (tight — the header should read as a label for the list immediately below it, not a separate block).
- **Header label text:** `font-size: var(--font-size-sm)`, `font-weight: 700`, `color: var(--color-text-muted)` — same weight/color as this app's other muted section labels (e.g. `EventFormModal`'s `.label`), signaling "metadata about the group," not a page heading. Deliberately *not* `--font-size-lg`/`--color-text` (that scale is reserved for the page's own `<h2>` "Dokumente" heading) — the group headers must stay visually subordinate to the page title.
- **Avatar in header:** `AvatarBadge` `size="sm"` (matches Android's `AvatarSize.SM` for this exact spot) — small enough to read as a label decoration, not a content item competing with the `DocumentItem` rows below it.
- **Group-to-group spacing:** `var(--space-6)` on the wrapping `.group` div (`margin-bottom`, or `gap` on a parent flex column of groups) — one step above the page's existing section-level rhythm (`.page` already uses `gap: var(--space-5)` between its top-level blocks; groups-of-documents nested one level deeper get a slightly larger `--space-6` so they don't visually merge with that outer rhythm).
- **"Allgemein" header:** identical text styling to a member header, just no `AvatarBadge` — do not substitute a placeholder/generic icon in its place (Android doesn't either); the absence of an avatar *is* the signal that this group is the unassigned one.

## Interactions

- No new interactive elements — headers are static labels, not buttons (no collapse/expand per story.md Out of Scope).
- Existing `DocumentItem` interactions (reassign dropdown, preview, download, delete, extract) are completely unchanged; reassigning a document simply causes it to re-render under a different header on the next render pass (no transition/animation needed — instant re-grouping is fine and matches how every other list-mutation in this app already behaves, e.g. deleting a task).

## Signature Element

The **small avatar inline with the group label** is the one deliberate visual touch — it lets you recognize "whose documents these are" at a glance from the avatar's color alone, before even reading the name, extending the same avatar-as-identity language already used throughout the app (Sidebar, EventFormModal attendees, TaskItem assignee) into a new context: a section label rather than an item decoration.

## Avoid
- Do not give group headers a background/box/border — this app uses whitespace and type-weight for hierarchy, not container chrome, for this kind of grouping (contrast with `DocumentItem`'s own card treatment, which stays as-is).
- Do not use `AvatarBadge size="md"` or `"lg"` in the header — reserve those sizes for contexts where the avatar is the primary content (attendee pickers), not a label decoration.
- Do not add a document count badge/number next to each group header — not requested, adds visual noise for a feature about *finding* documents by person, not counting them.
- Do not reorder or restyle `DocumentItem` itself.
