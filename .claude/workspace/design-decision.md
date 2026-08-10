# Design Decision — Termin löschen

## Scope
`EventFormModal.tsx` / `EventFormModal.module.css` only, edit mode (`isEdit === true`). No other component is visually touched.

## Layout

The action row at the bottom of the modal (`.actions`, currently `Abbrechen` | `Speichern`/`Erstellen`) becomes a `justify-content: space-between` row instead of `flex-end`: the delete action sits at the far left, isolated from the primary Abbrechen/Speichern pair on the right, so it reads as a destructive, separate action rather than a third option in the same button group (standard pattern: destructive actions get spatial distance from the primary flow, not just color).

```
[ Löschen ]                    [ Abbrechen ] [ Speichern ]
```

When the delete icon-button is clicked, it swaps in place for an inline confirm row (does not shift the Abbrechen/Speichern buttons, does not open a second modal):

```
[ Termin löschen? ] [ Ja, löschen ] [ Abbrechen ]      [ Abbrechen ] [ Speichern ]
```

## Token Usage

- **Delete trigger button:** icon-only (`Trash2` from `lucide-react`, 16px, consistent with existing icon sizing in this codebase e.g. `X size={18}` in the header), `width/height: 36px`, `border-radius: var(--radius-md)`, `color: var(--color-text-muted)` at rest.
- **Delete trigger hover:** `background-color: rgba(212, 98, 58, 0.12)` + `color: var(--color-accent)` — this exact rgba/token pairing already exists as `.deleteBtn:hover` in `TaskItem.module.css`; reuse the same values (not the same class, per Architect's constraint) so destructive-hover feedback looks identical across the app.
- **Confirm text** ("Termin löschen?"): `font-size: var(--font-size-sm)`, `font-weight: 700`, `color: var(--color-accent)` — slightly more weight than `TaskItem`'s `.confirmText` (`font-size-xs`) because this sits in a spacious modal footer, not a dense list row; `--font-size-sm` matches the modal's own `.label`/body type scale.
- **Confirm button ("Ja, löschen"):** solid, `background-color: var(--color-accent)`, `color: #fff`, `padding: var(--space-3) var(--space-5)`, `border-radius: var(--radius-md)` — sized like the modal's own `.cancelBtn`/`.saveBtn` (not the smaller pill-shaped `--radius-full` buttons from `TaskItem`), so it feels native to this modal's button scale rather than borrowed from the list-row context.
- **Confirm-cancel button ("Abbrechen", the inline one):** same visual treatment as the modal's existing `.cancelBtn` (`background-color: var(--color-surface-alt)`, `color: var(--color-text-muted)`) — reuse the *values*, new class name `deleteConfirmCancelBtn` per Architect's no-collision constraint.
- **Delete error message** (`deleteError`): identical treatment to the existing `.saveError` (`font-size: var(--font-size-sm)`, `color: var(--color-accent)`), rendered in the same position (just above `.actions`) so save-errors and delete-errors are visually interchangeable — one error slot, one convention.

## Interactions

- Delete icon-button: `transition: background-color 0.15s ease, color 0.15s ease` (matches `.closeBtn`/`.deleteBtn` transitions already used elsewhere in this file/TaskItem) on hover only — no focus-ring redesign needed, inherits default.
- Swap from icon-button to confirm row: no animation (instant swap) — consistent with `TaskItem`, which also swaps instantly rather than animating; do not introduce a new transition pattern for a single low-frequency action.
- "Ja, löschen" while `deleting === true`: same disabled treatment as `.saveBtn:disabled` (`opacity: 0.4`, `cursor: not-allowed`), label stays "Ja, löschen" (no need for a "Löscht…" loading label given the action is a single row-swap already signaling in-progress state — keep it simple, this is a small aside for a two-button micro-flow, not the main save action).
- Clicking "Abbrechen" (the inline confirm-cancel) reverts to the plain delete icon-button, no other state changes.

## Signature Element

The **spatial separation** of the delete action to the opposite side of the footer (left vs. right) is the one deliberate, memorable choice here — it's what makes an accidental click on "Löschen" while reaching for "Speichern" structurally unlikely, without relying on color alone for that safety margin.

## Avoid

- No native `window.confirm()`.
- No red/destructive-colored *button* for the primary trigger (only the icon-button hover state hints destructiveness) — matches how `TaskItem`'s resting delete icon is also neutral (`--color-text-muted`) until hovered, avoiding a permanently alarming footer.
- No second modal/dialog layer for confirmation.
- Do not center or right-align the delete trigger next to Abbrechen/Speichern — that removes the spatial-separation safety margin that is the whole point of this layout choice.
