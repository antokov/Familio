# User Story

**Type:** Bug Fix + UX Enhancement

## Story
As a family member viewing the month calendar,
I want days from the previous/next month (shown to fill out the grid) to be visually distinct from the current month, clickable to jump to that month, and to actually show their events,
so that I can tell at a glance what belongs to the current month and don't miss appointments that happen to fall on a "spillover" day at the edge of the grid.

## Acceptance Criteria

**AC1:** Given I am viewing the Month view for August, when the grid renders the trailing days of July and the leading days of September to fill the first/last week, then those cells are visibly greyed out / de-emphasized compared to August's own days (not just the day number — the whole cell reads as "not this month").

**AC2:** Given I click on a greyed-out day belonging to July (while viewing August), when the click registers, then the calendar navigates to July with that day visible — it does NOT open the "create new event" modal.

**AC3:** Given I click on a normal (current-month) day, when the click registers, then existing behavior is unchanged — the "create new event" modal opens pre-filled with that date.

**AC4:** Given I have a calendar event on September 2nd, when I view the August month grid (which shows September 2nd as a trailing/spillover day), then that event's pill is visible on that day cell, exactly as it would be if I navigated to September.

**AC5:** Given the Week view already shows adjacent-month dates in its own header/day cells (e.g. a week spanning July 28 – Aug 3), when applicable, then the same "belongs to a different month than the one currently framed" visual treatment is not required for Week view — this story is scoped to Month view only (Week view has no equivalent "current month" framing to begin with).

## Out of Scope
- Week view changes — Week view doesn't have a "current month" concept the way Month view's grid does; no changes there.
- Changing what counts as "today" or the today-highlight styling — that's separate from the current/other-month distinction.
- Any change to event creation/editing behavior for current-month days.
- Multi-month or year view.

## Notes
- Root cause investigation (read `MonthView.tsx`, `MonthView.module.css`, `CalendarPage.tsx`) found three separate small bugs/gaps behind this one user-reported symptom:
  1. `MonthView.module.css`'s `.cellOtherMonth` only dims the day-number text color; the cell background/pills are unchanged, so the "greyed out" effect is barely visible today.
  2. `CalendarPage.tsx`'s `onDayClick` always calls `openNewModal(date)`, regardless of whether the clicked day belongs to the currently-framed month or a neighboring one — there is currently no "navigate to that month" behavior at all for spillover days.
  3. `CalendarPage.tsx`'s `loadForCurrentView()` fetches events strictly bounded to `[first day of month, last day of month]`, not the full rendered grid range that `MonthView.getMonthGrid()` computes internally (which can extend a few days into the previous/next month). This is why Sept 2, shown as a spillover day in August's grid, renders the day cell but never gets its event — the fetch window never included it.
- Architect should decide the cleanest way to keep the "grid range" computation in sync between `MonthView.getMonthGrid()` (used for rendering) and `CalendarPage.loadForCurrentView()` (used for fetching) rather than fixing the symptom by widening the fetch window with a magic-number pad.
