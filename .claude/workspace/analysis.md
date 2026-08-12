# BA Analysis — Month View: Current/Other-Month Distinction, Navigation, Spillover Events

## Business Rules

1. A Month view grid cell belongs to either the "framed month" (the month currently being viewed, e.g. August) or a "spillover" neighboring month (trailing days of the previous month / leading days of the next month, shown only to complete the first/last week row).
2. Spillover cells MUST be visually de-emphasized as a whole cell (background + day number + any event pills it holds), not just the day-number text, so the current-month boundary reads clearly at a glance.
3. Clicking a spillover cell navigates the calendar to the month that cell actually belongs to (July when viewing August and clicking a leading July day; September when viewing August and clicking a trailing September day). It must NOT open the "create new event" modal.
4. Clicking a current-month cell keeps existing behavior unchanged: opens the "create new event" modal pre-filled with that date.
5. Events MUST render on every visible grid cell, including spillover cells — visibility of an event is determined purely by "does this date fall in the currently rendered 6-week grid," not by "does this date fall within the framed calendar month." The data-fetch window backing Month view must therefore cover the full rendered grid range (which `MonthView.getMonthGrid()` already computes for rendering), not just `[1st, last day]` of the framed month.
6. Clicking an event pill on a spillover cell should still open that event for editing (`onEventClick`), not trigger the new month-navigation behavior — event-pill clicks already call `e.stopPropagation()` today and must continue to take precedence over the cell's own click handler.

## Edge Cases

1. **Spillover event that also spans into the framed month** (e.g. multi-day all-day event from Aug 30 – Sep 2): must render consistently on both the current-month days (Aug 30–31) and the spillover days (Sep 1–2) it touches — no visual seam at the month boundary.
2. **Clicking a spillover day that is also "today"** — e.g. viewing August on Sep 1 itself would be unusual (today's month is always framed by default on load, but a user can navigate away and back); the today-highlight and the other-month dimming can co-occur and must not visually conflict or silently cancel each other (e.g. today's ring/dot indicator should still be legible if that day is ever rendered as a spillover day in another month's grid).
3. **Fetch window overlap when navigating repeatedly** — each `loadForCurrentView()` call must recompute the grid-based `from`/`to` freshly per the newly selected month (not reuse a stale cached range), since the previous file's `useCallback` dependency array already keys off `selectedDate`/`view`.
4. **Month boundary where the grid needs zero spillover days** (rare: a month starting on Monday and ending on Sunday with exactly 4 or 5 full weeks) — grid-range fetch must degrade gracefully to exactly the framed month's own range, not fetch extra unneeded days or crash on an empty pad.
5. **Year boundary spillover** — December framed, clicking a January spillover day (next year) must navigate to January of the *following* year, not the same year; the reverse (framing January, clicking a December spillover day) must navigate to December of the *previous* year. `Date.setMonth()` with delta already handles year rollover correctly in `CalendarPage.navigate()`, but the new "click a spillover day to navigate" path must reuse the same year-safe mechanism rather than a hand-rolled month increment.
6. **`+N weitere` overflow label on a spillover day** — if a spillover day has more than 3 events, the existing "+N weitere" affordance must still work exactly as it does for current-month days (no special-casing needed, but worth confirming Dev doesn't accidentally suppress it for `!isCurrentMonth` cells).
7. **Week view is unaffected** — `WeekView` has no "framed month" concept (it's framed by week), so the fetch-window question in Rule 5 does not apply there; only `CalendarPage`'s month-branch of `loadForCurrentView()` needs the wider range, not the week-branch.

## Data Model Implications

- None. This is a frontend-only (`webapp/`) fix — no new backend fields, no schema changes, no new API endpoints. The existing `GET /api/events?from=&to=` range-query endpoint already supports fetching an arbitrary date range (it's exactly how the multi-day/spillover fetch fix will work: widen the `from`/`to` sent to the existing endpoint, don't change the endpoint itself).
- `MonthView`'s existing `getMonthGrid(year, month)` function is the single source of truth for "which dates does this grid actually render" — Architect should specify exporting/reusing it (or an equivalent) from `CalendarPage.tsx` rather than duplicating the weekday-alignment math a second time, per CLAUDE.md's general "avoid duplicated logic" expectation.

## Open Questions

1. **NON-BLOCKING** — Exact greyed-out visual treatment (opacity value, whether event pills on spillover days should also be dimmed/desaturated or shown at full color) is a Design decision, not a business rule. Recommend routing through Phase 3b (Design) since `MonthView.tsx`/`.module.css` are under `webapp/src/`.
2. **NON-BLOCKING** — Whether clicking a spillover day should also *select*/highlight that specific day once landed in the new month (e.g. so the user immediately sees where they "arrived"), or simply reframe the month with no day pre-selected. Defaulting to "just reframe the month, no day pre-selection" since Month view has no existing single-day-selection concept — Dev/Architect to confirm this is acceptable scope, not add new state for it.
3. **NON-BLOCKING** — Whether the "+N weitere" overflow click behavior on a spillover day should also navigate (like the empty part of the cell) or do nothing new — recommend it keeps its current behavior untouched (this story doesn't mention the overflow label at all); confirmed no change needed there.

No blocking questions — proceeding to Phase 3 (Architect).
