# Dev Implementation Report — Month View: Boundary, Navigation, Spillover Events

## Approach
Implemented exactly as scoped in `arch-decision.md`/`design-decision.md`:
1. Extracted `MonthView.tsx`'s grid-range math into an exported pure function `getMonthGridRange(year, month)`, reused by both the existing `getMonthGrid()` (rendering) and the new `CalendarPage.tsx` fetch-range computation — single source of truth for "which dates are actually on screen."
2. `MonthView`'s `onDayClick` now passes `isCurrentMonth` as a second argument, using the value already computed per-cell for the CSS class.
3. `CalendarPage.tsx` branches on that flag: current-month click keeps opening the new-event modal; spillover click reframes the month via the existing `selectedDate` state (no new state introduced) and correctly rolls over year boundaries (Dec→Jan, Jan→Dec) since it's built from the real parsed year/month of the clicked date.
4. `CalendarPage.tsx`'s month-view fetch window now spans the full grid range instead of `[1st, last day]` of the framed month — this is what fixes the "Sept 2 event invisible in August" bug (AC4), since the event data now actually gets fetched for spillover days, and `MonthView`'s existing `eventsByDay` mapping picks it up with no further change needed.
5. CSS: `.cellOtherMonth` now dims the whole cell (`background-color: var(--color-bg)`) and its pills (`opacity: 0.55`), not just the day number, per `design-decision.md`.

## Files Changed
- `webapp/src/components/MonthView/MonthView.tsx` — exported `getMonthGridRange`; `onDayClick` signature gained `isCurrentMonth` param.
- `webapp/src/components/MonthView/MonthView.module.css` — `.cellOtherMonth` now sets a whole-cell background token and dims `.pill` opacity.
- `webapp/src/pages/CalendarPage.tsx` — imports `getMonthGridRange` for the month fetch window; new `handleDayClick(dateStr, isCurrentMonth)` routes to either `openNewModal` or a month-reframe via `setSelectedDate`.
- `webapp/src/components/MonthView/MonthView.test.tsx` — added: `getMonthGridRange` unit tests (August 2026 spillover on both ends; generic Monday-start/Sunday-end invariant for February 2027), click-routing tests (`isCurrentMonth` true/false for both a next-month and a previous-month spillover cell), and a regression test that an event dated in the next month renders when it falls on a spillover day of the framed month.

## Assumptions Made
- Reframing on spillover click uses the clicked date's own month/year (`new Date(y, m - 1, 1)`), i.e. no new "selected day" UI concept — matches `analysis.md`'s resolution of Open Question #2.
- The `+N weitere` overflow label needed no changes — it already worked identically for spillover and current-month cells since it's driven by the same `eventsByDay` map; the fetch-range fix makes it correctly include spillover-day overflow too, for free.

## Deviations from arch-decision.md
None. Implemented file-for-file as scoped, including the constraint to leave `WeekView.tsx`, `toLocalDateStr` duplication, and the `CalendarPage.test.tsx` harness gap untouched.

## Technical Debt / Follow-up
- Pre-existing: `webapp/`'s `npm run lint` currently fails outright — `eslint` resolves to v9.39.4 in `node_modules` but the repo still ships an `.eslintrc`-style config, which v9 no longer reads (needs `eslint.config.js` flat config). This is unrelated to this change (confirmed by running lint on an unmodified checkout — same failure) but currently means **no ESLint signal exists for any webapp change, including this one**. Flagging for Phase 6 backlog as tech debt — should be tracked separately from this story.
- `CalendarPage.tsx` still has zero dedicated test coverage (pre-existing, tracked as FS-16); the new routing/fetch-range logic is covered indirectly (via the exported `getMonthGridRange` helper's own unit tests + `MonthView`'s click-routing tests) rather than via a `CalendarPage`-level test, per arch-decision.md's explicit scope call.

## Open Items
None requiring human input.

## Verification
- `npx vitest run` (full webapp suite): **223/223 passed** (19 test files), including 11/11 in `MonthView.test.tsx` (7 pre-existing + 4 new test blocks covering the new behavior).
- `npx tsc --noEmit`: clean, no errors.
- `npx eslint` / `npm run lint`: fails repo-wide due to the pre-existing v9 config-format issue noted above (not a regression introduced by this change).
