# Architect Decision — Month View: Boundary, Navigation, Spillover Events

## Mode A — Pre-Dev Scoping

## Existing Code to Reuse / Extend

- `MonthView.tsx`'s `getMonthGrid(year, month)` already computes the *exact* rendered grid range (including trailing/leading spillover days) using Monday-start weekday math. This is the single source of truth to reuse — do not re-derive the "which dates are actually on screen" logic a second time in `CalendarPage.tsx`.
- `MonthView.tsx`'s `isCurrentMonth` (already computed per cell today, used only for the CSS class) is the correct signal for both the dimming (already wired) and the new click-routing decision — extend it to also flow into `onDayClick`, rather than having `CalendarPage` re-derive "is this date in the framed month" by re-parsing the string.
- `CalendarPage.tsx`'s existing `navigate(delta)` / `setSelectedDate` mechanism is the correct (and only) way to reframe the month — do not introduce a second, parallel "jump to month" code path. Reuse `setSelectedDate` directly with a `Date` built from the clicked spillover date.
- `parseLocalDate` / `toLocalDateStr` already exist in `MonthView.tsx`; `CalendarPage.tsx` has its own local `toLocalDateStr`. Leave that pre-existing small duplication alone — out of scope for this story (see backlog note below).

## Files Dev Must Touch

1. **`webapp/src/components/MonthView/MonthView.tsx`**
   - Extract the grid-range computation currently inlined in `getMonthGrid()` into an exported helper, e.g. `export function getMonthGridRange(year: number, month: number): { start: Date; end: Date }`, and have `getMonthGrid()` call it. This is what `CalendarPage.tsx` will import to compute its fetch `from`/`to` — same math, single definition.
   - Change the `onDayClick` prop signature from `(dateStr: string) => void` to `(dateStr: string, isCurrentMonth: boolean) => void`, and pass the already-computed `isCurrentMonth` through at the call site.
   - No change needed to `eventDateKeys`/`eventsByDay` — that logic is already grid-agnostic (it just maps by date key), so it will correctly pick up spillover-day events for free once `CalendarPage` starts fetching the wider range.

2. **`webapp/src/components/MonthView/MonthView.module.css`**
   - Strengthen `.cellOtherMonth` so the *whole cell* reads as de-emphasized, not just `.dayNumber`. Concretely: apply reduced opacity (or a muted background token) to the cell as a whole, including its pills — exact token values are Design's call in Phase 3b, implement whatever `design-decision.md` specifies.

3. **`webapp/src/components/MonthView/MonthView.test.tsx`**
   - Extend with cases for: (a) `onDayClick` fires with `isCurrentMonth: true` for a framed-month cell and `false` for a spillover cell; (b) `getMonthGridRange` returns the correct start/end for a month whose grid needs spillover days on both ends (e.g. August 2026) and for one that needs none.

4. **`webapp/src/pages/CalendarPage.tsx`**
   - In `loadForCurrentView()`'s `view === 'month'` branch, replace the `[1st, last day of framed month]` computation with `getMonthGridRange(selectedDate.getFullYear(), selectedDate.getMonth())` (imported from `MonthView.tsx`), converting `start`/`end` to `YYYY-MM-DD` via the existing local `toLocalDateStr`. Leave the `view === 'week'` branch untouched.
   - Update the `onDayClick` handler passed to `<MonthView>`: if `isCurrentMonth` is true, keep current behavior (`openNewModal(date)`); if false, parse `date` to a `Date` and call `setSelectedDate(new Date(y, m, 1))` (first of that month) — reframes to the clicked cell's actual month/year, correctly handling year rollover (Dec→Jan and Jan→Dec) since it's driven off the real parsed year/month, not a hand-rolled increment.
   - Do **not** open the new-event modal for spillover clicks, and do not add any new "selected day" UI state — reframing the month via `selectedDate` is sufficient per `analysis.md`'s Open Question #2 resolution.

## Patterns Dev Must Follow

- Keep the grid-range helper a pure function with no React/DOM dependency (same style as the existing `getMonthGrid`/`toLocalDateStr`/`parseLocalDate` helpers already in `MonthView.tsx`) — this keeps it trivially unit-testable and importable from `CalendarPage.tsx` without pulling in component rendering.
- Prop-callback pattern: extending `onDayClick` with a second parameter (rather than e.g. introducing a new `onOtherMonthClick` prop) matches how `onEventClick` already coexists with `onDayClick` on the same cell — one clear callback per interaction type, not a proliferation of near-duplicate handlers.
- CSS: use existing design tokens only (`--color-*`, `--space-*`, etc. from `webapp/src/styles/tokens.css`) — no hardcoded hex/rgba values, consistent with the rest of `MonthView.module.css`.

## Explicit Constraints (What NOT to Do)

- Do NOT touch `WeekView.tsx` or its fetch range — per `story.md`'s Out of Scope, Week view has no "framed month" concept and is unaffected.
- Do NOT change the `+N weitere` overflow behavior — leave it exactly as-is for both current-month and spillover cells.
- Do NOT introduce a new backend endpoint or change `GET /api/events`'s contract — the existing `from`/`to` range query already supports an arbitrary window; only the *client-computed* window changes.
- Do NOT add a new "selected day" state to `CalendarPage` — reuse `selectedDate` as the reframe target (see analysis.md Open Question #2).
- Do NOT fix the pre-existing `toLocalDateStr` duplication between `MonthView.tsx` and `CalendarPage.tsx` as part of this story — flagging it as tech debt in Phase 6 instead, to keep this diff focused on the reported bug.
- A full `CalendarPage.test.tsx` test harness (mocking `useEvents`/`useFamilyMembers`/global `fetch` end-to-end) is **not required** by this story — `CalendarPage` has zero test coverage today (tracked separately as FS-16) and building that harness is a larger, separate investment. Dev should keep the new routing/range logic itself easily unit-testable (via the exported pure helper + `MonthView.test.tsx`) rather than taking on a full `CalendarPage` render-test suite in this pass. Tester (Phase 5) may add a minimal smoke test if it's cheap; not a blocker for PASS if it isn't.

## Files Dev Needs in Context (max 8)

1. `webapp/src/components/MonthView/MonthView.tsx`
2. `webapp/src/components/MonthView/MonthView.module.css`
3. `webapp/src/components/MonthView/MonthView.test.tsx`
4. `webapp/src/pages/CalendarPage.tsx`
5. `webapp/src/types/event.ts` (for `CalendarEvent` type reference)
6. `webapp/src/styles/tokens.css` (for available design tokens — also needed by Phase 3b)

No architecture risk requiring human escalation — proceeding to Phase 3b (Design, since `webapp/src/` files are in scope).
