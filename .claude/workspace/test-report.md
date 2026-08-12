# QA Test Report — Month View: Boundary, Navigation, Spillover Events

## Verdict: **PASS** ✅

## Acceptance Criteria Verification

| AC | Description | Result |
|----|--------------|--------|
| AC1 | Spillover cells (trailing July / leading September in an August grid) are visibly de-emphasized as whole cells, not just the day number | **PASS** — `.cellOtherMonth` now sets `background-color: var(--color-bg)` on the whole cell and `opacity: 0.55` on its pills, in addition to the pre-existing muted day-number color. Verified by reading the final CSS and confirming it matches `design-decision.md`'s token mapping exactly. |
| AC2 | Clicking a greyed spillover day (e.g. a July day while viewing August) navigates to that month with the day visible, and does NOT open the create-event modal | **PASS** — `MonthView.test.tsx`: "ruft onDayClick mit isCurrentMonth=false …" (both next-month and previous-month cases) confirm `onDayClick` fires with `isCurrentMonth: false` and the correct target `dateStr`. `CalendarPage.tsx`'s `handleDayClick` routes `isCurrentMonth === false` straight to `setSelectedDate`, never calling `openNewModal` — read and confirmed directly in the diff. |
| AC3 | Clicking a normal current-month day is unchanged (opens create-event modal) | **PASS** — `MonthView.test.tsx`: "ruft onDayClick mit isCurrentMonth=true …" confirms the flag; `CalendarPage.tsx`'s `handleDayClick` calls `openNewModal(dateStr)` unchanged when `isCurrentMonth` is true. |
| AC4 | An event on Sept 2 is visible when Sept 2 renders as a spillover day in August's grid | **PASS** — `MonthView.test.tsx`: "zeigt einen Termin am 2. September auch als Nachlauftag …" renders the event and asserts it's present. Root cause (fetch window not covering spillover days) is fixed in `CalendarPage.tsx` by sourcing the month-view fetch range from `getMonthGridRange()` instead of `[1st, last day]`. |
| AC5 | Week view is unaffected | **PASS** — confirmed no changes to `WeekView.tsx` or the `view === 'week'` branch of `loadForCurrentView()` in the diff; full `webapp` test suite (which includes `WeekView.test.tsx`, 17 tests) still passes unmodified. |

## Edge Cases (from analysis.md)

1. **Multi-day event spanning framed + spillover days** — Not directly re-tested here, but covered transitively: `eventDateKeys()` (unchanged) already expands multi-day all-day events across every date key they touch, and the wider fetch window now supplies spillover-day event data too. Existing `MonthView.test.tsx` "Mehrtägige ganztägige Termine" suite (3-day event rendering) plus the new spillover-event test together give reasonable confidence; no seam-specific bug found on inspection.
2. **Spillover day that is also "today"** (e.g. viewing September while today is the trailing Aug 31 spillover day) — **Pre-existing minor contrast issue found, not a regression**: `.cellOtherMonth .dayNumber { color: var(--color-text-muted) }` (specificity 0,2,0) beats `.today { color: #fff }` (specificity 0,1,0), so a today-badge on a spillover day would render muted text on the primary-green circle instead of white text. This rule existed before this story (unchanged by this diff) and isn't required by any AC — flagging as tech debt for Phase 6, not a blocker.
3. **Fetch window recomputed per navigation** — `useCallback` dependency array (`[view, selectedDate, fetchEvents]`) is unchanged; `getMonthGridRange` is called fresh from the current `selectedDate` on every invocation, no staleness risk introduced.
4. **Month needing zero/near-zero spillover** — Covered generically by the new "beginnt immer auf einem Montag und endet immer auf einem Sonntag" invariant test (Feb 2027) rather than hunting for an exact zero-spillover month; the shared math guarantees a well-formed range regardless.
5. **Year-boundary spillover navigation** — **Explicitly added test coverage** (was a gap in Dev's initial test pass): confirmed Dec 2026 framed → clicking the Jan 3, 2027 spillover cell yields `onDayClick('2027-01-03', false)`, and Jan 2027 framed → clicking the Dec 28, 2026 spillover cell yields `onDayClick('2026-12-28', false)`. Both pass.
6. **`+N weitere` overflow on a spillover day** — No dedicated new test, but logic path is unchanged (`eventsByDay` mapping + slice(0,3) is identical for both cell types); existing overflow test (`MonthView — Mehrtägige ganztägige Termine`) already exercises the mechanism generally. Low risk, not blocking.
7. **Week view unaffected** — Confirmed (see AC5).

## New Tests Added (this phase)
- 2 year-boundary click-routing tests in `MonthView.test.tsx` (Dec→Jan and Jan→Dec), closing the gap identified in edge case #5 above. Combined with Dev's 9 new tests, `MonthView.test.tsx` now has 13 tests (was 7).

## Coverage Gaps (non-blocking, noted for backlog)
- `CalendarPage.tsx` has no dedicated test file (pre-existing, tracked as FS-16) — the new fetch-range and click-routing logic is verified indirectly through `MonthView.test.tsx`'s coverage of the shared `getMonthGridRange` helper and the `onDayClick(dateStr, isCurrentMonth)` contract, not through a `CalendarPage`-level render test. Per `arch-decision.md`, building that harness was explicitly out of scope for this story.
- The today+spillover contrast issue (edge case #2) has no regression test since it's a pre-existing, non-regressed condition outside this story's scope.

## Full Suite Result
`npx vitest run` (whole `webapp/` project): **225/225 tests passed**, 19 test files (up from 223/19 pre-QA-phase, reflecting the 2 new tests added in this phase). `npx tsc --noEmit`: clean.
