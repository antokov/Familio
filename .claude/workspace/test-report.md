# QA Test Report — FamilyMemberFormModal Unit Tests (TD-06)

## Verdict: **PASS** ✅

## Acceptance Criteria Verification

| AC | Description | Result |
|----|--------------|--------|
| AC1 | Create mode: empty fields, first swatch default, correct title/button label, disabled button, auto-focus | **PASS** — 5 tests cover each sub-clause independently. |
| AC2 | Edit mode: pre-filled from `editMember` (incl. non-default color), correct title/button label, enabled button | **PASS** — pre-fill test deliberately uses a non-index-0 color (`#4CAF82`), which would have caught a "always resets to swatch 0" bug that a same-as-default color choice would have masked. |
| AC3 | Live initials uppercase/truncate; swatch click updates active state + preview | **PASS, with one fix applied during this review** — see below. |
| AC4 | Submit payload correctness, success closes modal, error string displays inline and keeps modal open, in-flight state shows "Speichern…"/disabled, double-submit blocked | **PASS** — all 6 sub-clauses individually tested. |
| AC5 | Empty/whitespace name or initials blocks submission at both the UI layer (disabled button) and the `handleSubmit` guard itself (raw form-submit event) | **PASS** — the raw-`fireEvent.submit()` test specifically proves the *component's own* guard works independently of the disabled button, exactly matching `analysis.md`'s "defense in depth" framing. |

## Fix Applied During This Review
The original swatch-selection test (`"markiert die angeklickte Farbe als aktiv und aktualisiert die Vorschau"`) asserted `newSwatch.toHaveStyle({ backgroundColor: '#F0805B' })` — but every swatch button always renders its own fixed color via `style={{ backgroundColor: c }}` regardless of whether it's selected (that's just how the swatch grid is built, one static-colored button per `COLOR_OPTIONS` entry). That assertion would pass identically whether or not the click actually updated the component's `color` state — it wasn't proving what the test's own name claimed ("...aktualisiert die Vorschau" / "...updates the preview"). Replaced it with an assertion on the actual live preview (`AvatarBadge`'s rendered `background-color`, queried via its `'?'` placeholder text since no initials are typed in that test), which only changes if `color` state genuinely updated — this is the real signal AC3 asks for. Re-ran the full file after the fix: still 23/23 passing, and the new assertion would have failed had the underlying state wiring been broken (verified by temporarily reasoning through what the assertion checks, not just that it passes — a tautological assertion passes regardless of correctness, which is exactly the class of bug being guarded against here).

## Edge Cases (from analysis.md)

1. Typing initials >2 chars / lowercase → live-truncated/uppercased — **tested** (input `.value` asserted directly, not just submitted payload).
2. Whitespace-only name/initials → button stays disabled — **tested**.
3. Edit mode pre-fills a non-default color — **tested** (see AC2 above).
4. `onSave` resolves with the real 409 error string → displayed inline, modal stays open — **tested** with the actual production string from `useFamilyMembers.addMember`.
5. Double-submit while `onSave` is pending → blocked — **tested** via the deferred-promise pattern, consistent with TD-10/EventFormModal's established technique.
6. Backdrop click closes; click inside modal content does not → **both tested** (not just the positive case).
7. `onSave` rejecting is not a realistic scenario → **correctly not tested**, and I independently re-verified this by reading `useFamilyMembers.ts` myself rather than trusting the claim: both `addMember` and `editMember` wrap their entire bodies in `try/catch` and unconditionally `return` a `string | null`, no `throw` reachable from a resolved/rejected promise perspective. Confirmed sound.

## New Tests Added / Modified (this phase)
- 0 new tests, 1 existing test's assertion corrected (see "Fix Applied" above) — this counts as a real QA catch: the original assertion was passing but not actually testing the behavior its own description claimed to test.

## Coverage Gaps (non-blocking, noted for backlog)
None identified beyond what `story.md`'s Out of Scope already excludes (`SettingsPage.tsx`-level integration, `AvatarBadge`'s own internals).

## Full Suite Result
`npx vitest run` (whole `webapp/` project): **285/285 tests passed**, 22 test files (up from 262/21 before this story — 23 new tests, 1 new file). `npx tsc --noEmit`: clean. No `act()` warnings or unhandled errors in the final run.
