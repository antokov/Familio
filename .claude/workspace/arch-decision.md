# Architect Decision — FamilyMemberFormModal Unit Tests (TD-06)

## Mode A — Pre-Dev Scoping

## Existing Code to Reuse / Extend
- `webapp/src/components/FamilyMemberFormModal/FamilyMemberFormModal.tsx` — read in full. Props: `editMember?: FamilyMember`, `onSave: (input) => Promise<string | null>`, `onClose: () => void`.
- **Copy `TaskFormModal.test.tsx`'s render-helper-factory shape** (`function renderModal(props = {}) { const onSave = vi.fn(); const onClose = vi.fn(); render(<FamilyMemberFormModal {...props} onSave={onSave} onClose={onClose} />); return { onSave, onClose } }`) — this codebase's standard for every modal test file (`TaskFormModal.test.tsx`, `EventFormModal.test.tsx`).
- **Copy the deferred-promise double-submit pattern from `EventFormModal.test.tsx`** (already reused for TD-10's `QuickAddBar.test.tsx`): `let resolveSave; const onSave = vi.fn(() => new Promise<string | null>(resolve => { resolveSave = resolve }))`.
- Default `onSave` mock across most tests should be `vi.fn().mockResolvedValue(null)` (success) — per `analysis.md`'s resolved Open Question, there is **no** need for a rejection/characterization test here (unlike TD-10) since the real-world `onSave` implementation (`useFamilyMembers.ts`'s `addMember`/`editMember`) provably never rejects.
- `AvatarBadge` preview: assert on it via `screen.getByText(initials)` (renders initials as literal text content, confirmed by reading `AvatarBadge.tsx`) and `toHaveStyle({ backgroundColor: color })` — same assertion style `AvatarBadge.test.tsx` (FS-02) already established for this exact component.
- Color swatches: `screen.getByRole('button', { name: `Farbe ${hex}` })` (each has `aria-label={`Farbe ${c}`}`) — assert `aria-pressed` for active-state tests, per Business Rule 8.

## Files Dev Must Touch
1. **`webapp/src/components/FamilyMemberFormModal/FamilyMemberFormModal.test.tsx`** (new file) — the only file this story touches.

No other files. `FamilyMemberFormModal.tsx` itself is NOT modified (test-coverage-only story, see Constraints).

## Patterns Dev Must Follow
- Mirror `TaskFormModal.test.tsx`'s structure: `describe('FamilyMemberFormModal — Create-Modus', ...)` / `describe('FamilyMemberFormModal — Edit-Modus', ...)` as the top-level split (that file uses exactly this Create/Edit `describe` split, and this component has the identical create-vs-edit-mode duality), then additional `describe` blocks for swatch selection, submit/validation, and double-submit.
- Use `userEvent.type()` for the name/initials inputs, `userEvent.click()` for swatches and the submit button. For the "initials truncate/uppercase live" edge case, assert the input's `.value` directly after `userEvent.type()`, not just the final submitted payload.
- For the double-submit test, reuse the exact deferred-promise shape from `EventFormModal.test.tsx`/`QuickAddBar.test.tsx` (TD-10) — don't invent a new technique.
- For the API-error-string test, use the real 409 message from `useFamilyMembers.addMember` (`"Diese Initialen sind bereits vergeben"`) as the mocked `onSave` resolution, per `analysis.md` edge case 4 — grounds the test in a real scenario rather than an arbitrary placeholder string.

## Explicit Constraints (What NOT to Do)
- Do NOT modify `FamilyMemberFormModal.tsx` — test-coverage-only per `story.md`. If a real bug is found, log it as new Technical Debt in Phase 6, do not fix inline.
- Do NOT write a "does `onSave` rejecting break the component" test — `analysis.md` already investigated and closed this question; writing one anyway would test a scenario that cannot occur with the component's actual real-world usage, and (per TD-10's precedent) risks an unhandled-rejection crash for no analytical benefit.
- Do NOT write `SettingsPage.tsx`-level tests — out of scope, component-level only.
- Do NOT re-test `AvatarBadge` in isolation — only verify `FamilyMemberFormModal` passes it the right props.
- Do NOT snapshot-test — same established codebase convention as every other test file.

## Files Dev Needs in Context (max 8)
1. `webapp/src/components/FamilyMemberFormModal/FamilyMemberFormModal.tsx`
2. `webapp/src/types/family.ts`
3. `webapp/src/components/TaskFormModal/TaskFormModal.test.tsx` (primary structural pattern reference)
4. `webapp/src/components/EventFormModal/EventFormModal.test.tsx` (double-submit deferred-promise reference)
5. `webapp/src/components/AvatarBadge/AvatarBadge.tsx` (to know how to assert on the preview)

## Phase 3b (Design) — Explicitly Skipped
Same reasoning as the two immediately preceding test-coverage stories (TD-10, TD-08): this adds a single `.test.tsx` file exercising *existing* UI — no new component, no new DOM, no new CSS. Nothing for a Design Lead to decide on.

No architecture risk requiring human escalation — proceeding to Phase 4 (Dev).
