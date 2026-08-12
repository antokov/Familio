# Design Decision — Month View: Current/Other-Month Distinction

## Scope
- `webapp/src/components/MonthView/MonthView.module.css` — `.cellOtherMonth` and its children (`.dayNumber`, `.pill`, `.moreLabel`).
- No other components affected (WeekView, CalendarPage layout, EventFormModal all untouched — see arch-decision.md Out of Scope).

## Layout
No structural/grid layout changes — same 7-column grid, same cell dimensions (`min-height: 96px`). This is a treatment-only change on the existing `.cellOtherMonth` modifier class already applied per-cell in `MonthView.tsx`.

## Token Usage
- `.cellOtherMonth` (whole cell): `background-color: var(--color-bg)`. The page's card surface is `--color-surface` (cell default today is transparent = inherits that), while `--color-bg` is the app's base/page background — one step darker/duller than the card in both light and dark themes. Using it here reads as "this cell has fallen back behind the card," which is exactly the right metaphor for "not this month," and it's already a token in the palette (no new token needed).
- `.cellOtherMonth .dayNumber`: keep existing `color: var(--color-text-muted)` (already correct, no change).
- `.cellOtherMonth .pill`: add `opacity: 0.55`. Pills already carry their own attendee `backgroundColor` inline (set in `MonthView.tsx`'s `eventColor()`), so we dim via opacity rather than overriding the background — this preserves the attendee-color-coding at a glance (AC4 requires the event to be visibly *present*, just de-emphasized, not recolored/hidden) while still reading as clearly muted against the full-color pills on current-month days.
- `.cellOtherMonth .moreLabel`: no change — it already uses `--color-text-muted` same as normal cells, which is subtle enough as-is.

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
