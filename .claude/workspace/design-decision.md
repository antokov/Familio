# Design Decision — Dokumentnamen anpassen

## Scope
`DocumentItem.tsx` / `DocumentItem.module.css` only. No other component's visuals change.

## Layout

**Resting state (unchanged):** icon badge, `.content` (title + meta stack), assignee `<select>`, `.actions` (4 icon buttons, visible on row hover).

**Rename trigger:** a 5th icon button (`Pencil`, `lucide-react`) added to `.actions`, positioned *before* the existing delete button (order: extract → preview → download → rename → delete) — rename sits next to the other "do something with this document" actions, while delete stays last/rightmost as the app's established "most destructive action goes last" convention (already true of this exact row today).

**Renaming state:** mirrors how delete-confirm already swaps the row, but swaps a *different* region:
- `.content`'s title `<span>` is replaced by a `<input type="text">` (pre-filled, autofocus, same visual width as the title it replaces) — the `.meta` line (size · date) stays visible beneath it unchanged, so the row doesn't jump in height and the user keeps context of which file they're renaming.
- `.actions` swaps (exactly like it already does for `confirmDelete`) to show only two icon buttons: `Check` (confirm) and `X` (cancel) — sized and styled identically to the existing `.actionBtn` (30×30, same hover treatment), *not* the pill-shaped `.confirmBtn`/`.cancelBtn` text buttons used for delete. Reason: the text input itself already carries the "what am I confirming" context that delete's "Löschen?" text label exists to provide — a second text label would be redundant, so compact icon buttons keep the row from growing.
- The assignee `<select>` stays visible and interactive during rename (renaming and reassigning are unrelated actions; no reason to block one during the other).

```
Resting:   [📄] Title text            [Zuweisung ▾]  [extract][preview][download][rename][delete]
Renaming:  [📄] [input: Title text__] [Zuweisung ▾]                              [✓][✗]
           📏 size · date
```

## Token Usage

- **Rename trigger button:** identical shape/tokens to existing `.actionBtn` (`width/height: 30px`, `border-radius: var(--radius-sm)`, `color: var(--color-text-muted)`, hover `background-color: var(--color-surface-alt)` + `color: var(--color-text)`) — it's one more peer in the same row, not a visually distinct action.
- **Rename input:** `padding: var(--space-1) var(--space-2)`, `border: 1px solid var(--color-primary)` (primary, not the neutral `--color-border` other inputs use at rest — signals "you're actively editing this," matching how a focused input elsewhere in the app gets `border-color: var(--color-primary)` on `:focus`; here it's *always* that color while the field exists, since the field only exists while editing), `border-radius: var(--radius-sm)`, `background-color: var(--color-bg)`, `font-size`/`font-weight` matching `.title` exactly (`var(--font-size-sm)` / `600`) so the input doesn't visually "jump" in weight from the text it replaces.
- **Confirm icon button (`Check`):** same `.actionBtn` base, hover tinted with success rather than neutral: `background-color: rgba(74, 158, 114, 0.12)`, `color: var(--color-success)` (parallels how the existing `.deleteBtn:hover` tints with `--color-accent` at the same `0.12` alpha — same recipe, success color instead of accent color, since confirming a rename is a positive/affirming action).
- **Cancel icon button (`X`):** plain `.actionBtn` hover (neutral, no special tint) — cancelling isn't a destructive or special action, it's just "never mind."
- **Rename error text:** `font-size: var(--font-size-xs)`, `color: var(--color-accent)`, positioned on its own line beneath the input (same slot the `.meta` line already occupies conceptually) — matches `.confirmText`'s color/weight-of-concern but doesn't need `.confirmText`'s bold weight since it's an error message, not a question.

## Interactions

- Clicking the rename trigger: focuses the input immediately (autofocus + select-all-text, so a full replace is one keystroke away — same "get out of the way" affordance most rename-in-place UIs have).
- `Enter` in the input confirms (same effect as clicking `Check`); `Escape` cancels (same effect as clicking `X`) — both are expected, low-cost affordances for a single-line rename field and don't need to be discoverable via a label, they're a universal convention.
- `Check`/input disabled while a rename request is in flight (`renameSaving`), identical guard shape to the calendar-event-delete feature's `deleting` state.
- Entering rename mode while this row's delete-confirm is showing instantly swaps back to the resting actions row first (per BA edge case 4) — no animation needed, instant state swap, consistent with how this row already has zero transition on the delete-confirm swap today.

## Signature Element

Nothing new — this deliberately reuses the row's own established "swap part of the row for an inline edit/confirm state" language (already the delete-confirm's signature interaction) rather than inventing a second visual idiom for a very similar kind of action. The one distinguishing touch is the primary-colored input border, which is this app's existing "you're editing" signal borrowed from focus states elsewhere, applied here as a resting (not just `:focus`) style since the field's whole existence *is* the edit state.

## Avoid
- Do not use the pill-shaped `.confirmBtn`/`.cancelBtn` (text "Ja"/"Nein") for rename confirm/cancel — those are delete's specific visual language; rename gets compact icon buttons instead (see Layout).
- Do not hide the `.meta` line or the assignee `<select>` while renaming — only the title itself becomes editable.
- Do not add a placeholder like "Dateiname eingeben…" — the field is always pre-filled with the current name, never empty at the start, so a placeholder would never be seen.
- Do not grow the row's height during rename — the input must fit the same vertical slot the title `<span>` already occupies.
