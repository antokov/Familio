# Design Decision — Month View: Current/Other-Month Distinction

## Scope
- `webapp/src/components/MonthView/MonthView.module.css` — `.cellOtherMonth` and its children (`.dayNumber`, `.pill`, `.moreLabel`).
- No other components affected (WeekView, CalendarPage layout, EventFormModal all untouched — see arch-decision.md Out of Scope).

## Layout
No structural/grid layout changes — same 7-column grid, same cell dimensions (`min-height: 96px`). This is a treatment-only change on the existing `.cellOtherMonth` modifier class already applied per-cell in `MonthView.tsx`.

## Token Usage
- **Revised after user feedback in production:** the original plan (`background-color: var(--color-bg)` on the cell) was invisible — `AppShell.module.css`'s `.content` (the page area the whole calendar grid sits in) already uses `--color-bg` as its own background, so a spillover cell painted with the same token blended straight into the page. Only the pill's `opacity: 0.55` and the muted day-number color were ever visible, which is exactly the "only the event looks dimmed, not the field" complaint that came back.
- `.cellOtherMonth` (whole cell): `opacity: 0.45` applied to the cell itself, not a background-color swap. Opacity composites against whatever sits behind the cell — page background, borders, day number, pills — uniformly and correctly in both light and dark themes without needing to guess a token that's visibly distinct from the page in both palettes.
- `.cellOtherMonth .dayNumber`: keep existing `color: var(--color-text-muted)` (compounds with the parent opacity for an even more muted number — fine, intentional).
- `.cellOtherMonth .pill`: no separate rule needed anymore — the parent's `opacity: 0.45` already cascades to pills (and everything else in the cell), so a duplicate `.pill` opacity override was removed as redundant.
- `.cellOtherMonth .moreLabel`: no change — same cascade reasoning as pills.

## Interactions
- `.cellOtherMonth:hover` — keep the existing shared `.cell:hover { background-color: var(--color-surface-alt) }` rule as-is (no override needed); the hover state itself is what signals "this is clickable, and here's what happens if you do" — do not suppress hover feedback on spillover cells just because they're dimmed, since clicking them is now a real, distinct action (navigate to that month) and needs the same affordance current-month cells get.
- No new focus/active states needed — spillover cells are `<div onClick>` today, same as current-month cells; keyboard accessibility is unchanged/out of scope for this story.
- No new transition needed beyond the existing `transition: background-color 0.12s ease` already on `.cell` (covers both the base dimming and the hover state smoothly).

## Signature Element
The whole-cell `--color-bg` dip (cell recedes to the page's base tone instead of sitting flush with the card) is the one distinctive visual cue — it's a single, cheap, theme-safe change that makes the current/other-month boundary immediately legible without adding any new color to the palette.

## Avoid
- Don't desaturate/greyscale the event pills entirely (e.g. `filter: grayscale(1)`) — attendee color-coding should still be recognizable on spillover days, just dimmer (opacity, not desaturation).
- Don't reduce `.cellOtherMonth` below a hover-legible contrast — it must still clearly read as clickable (cursor: pointer already inherited from `.cell`, keep it).
- Don't introduce a new border/outline treatment to mark the month boundary — the existing grid's `--color-border` lines between cells are sufficient; adding a second boundary indicator (e.g. a thicker divider between the last framed-month row and the first spillover row) would be visual noise not asked for in the story.
