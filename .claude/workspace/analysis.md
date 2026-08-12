# BA Analysis — FamilyMemberFormModal Unit Tests (TD-06)

## Business Rules

1. On mount, the name field is auto-focused (`useEffect(() => nameRef.current?.focus(), [])`), same convention as `QuickAddBar` (TD-10) and other forms in this codebase.
2. Create vs. edit mode is driven entirely by whether `editMember` is passed: title, submit-button label, and initial field values all branch on its presence — there's no separate "mode" prop.
3. Initials are forced uppercase and truncated to 2 characters **live, on every keystroke** (`e.target.value.toUpperCase().slice(0, 2)`), not just at submit time — the input can never visibly hold more than 2 (uppercased) characters.
4. `isValid` (drives the submit button's `disabled` state) requires both `name.trim().length > 0` AND `initials.trim().length > 0` — color has no equivalent validity requirement since it always has a default (`COLOR_OPTIONS[0]`) and can't be unset via the UI.
5. On submit, `handleSubmit` re-derives `trimmedName`/`trimmedInitials` independently of the `isValid` memo and early-returns if either is empty — this is a **second, independent guard**, not merely relying on the disabled button (defense in depth against a raw form-submit event, e.g. pressing Enter while a whitespace-only value technically passes the button's own check due to a timing edge case, or a future dev removing the `disabled` binding without noticing this guard).
6. `onSave`'s return value **is** the result signal: `null` → success → modal closes (`onClose()` called); any non-null string → treated as a user-facing API error → displayed inline (`apiError` state) and the modal stays open with the user's input preserved (nothing resets on error, unlike a successful submit which unmounts the whole modal).
7. `saving` is `true` for the duration of the `await onSave(...)` call — the submit button reads "Speichern…" and is disabled during that window, functioning as a double-submit guard identical in shape to `QuickAddBar`'s `submitting` (TD-10).
8. The color swatch grid has exactly 10 fixed options (`COLOR_OPTIONS`); clicking one sets `color` and is reflected in three places simultaneously: the swatch's own `aria-pressed`/active class, the live `AvatarBadge` preview's `color` prop, and (on submit) the payload sent to `onSave`.

## Edge Cases

1. **Typing initials longer than 2 characters or lowercase** (e.g. `"anton"`) — must be visibly truncated/uppercased in the input's own value as typed, not just at submit (Business Rule 3) — test by asserting the input's DOM value after typing, not just the submitted payload.
2. **Name/initials with only whitespace** — `isValid` is `false` (button stays disabled) since `.trim().length > 0` catches it; `handleSubmit`'s own guard is the second line of defense if the button is bypassed. Both need coverage per Business Rule 5's "defense in depth" reasoning — this is the exact pattern TD-10 tested for `QuickAddBar`, worth mirroring here too.
3. **Edit mode pre-fills exactly from `editMember`, including a non-default color** (i.e. not `COLOR_OPTIONS[0]`) — a naive implementation might always default to the first swatch; must test with an `editMember` whose `color` is *not* index 0 to actually catch that class of bug.
4. **`onSave` resolves with a specific error string, e.g. `"Diese Initialen sind bereits vergeben"`** (the real 409 case from `useFamilyMembers.addMember`) — the modal must display that exact string, not a generic fallback, and must NOT call `onClose()`.
5. **Double-submit while `onSave` is pending** — needs the same deferred-promise test technique established in `EventFormModal.test.tsx`/`QuickAddBar.test.tsx` (TD-10) to actually observe the `saving === true` window.
6. **Backdrop click closes the modal, but clicking inside the modal content does not** — `handleBackdropClick`'s `e.target === e.currentTarget` check is the guard; a naive test that only checks "clicking the backdrop closes it" without also checking "clicking inside doesn't" could pass even if that equality check were accidentally removed.
7. **Whether `onSave` can realistically reject (not just resolve with a string)** — **investigated and resolved, not a live risk here.** Read both real callers wired into `FamilyMemberFormModal.tsx` in production: `SettingsPage.tsx`'s `handleSave` passes through directly to `useFamilyMembers.ts`'s `addMember`/`editMember`, and **both already wrap their entire body in `try/catch` and always `return` a string-or-`null`, never re-throwing.** Unlike `QuickAddBar`'s `onAdd` (TD-10, where the real bug was a missing `try/catch` one layer up), there is no missing safety net here — `handleSubmit`'s lack of its own `try/catch` around `await onSave(...)` is safe in practice given `onSave`'s actual real-world implementation never rejects. Recommend Dev use a `vi.fn().mockResolvedValue(...)`-only mock for all tests (no rejection test needed, and no TD-10-style crash risk to route around).

## Data Model Implications
None — `FamilyMember`/`CreateFamilyMemberInput` types are pre-existing and unchanged; this story adds test coverage only.

## Open Questions

1. **NON-BLOCKING, RESOLVED** — See edge case 7 above: confirmed via reading `useFamilyMembers.ts` that `onSave` cannot realistically reject given its real callers, so no TD-10-style characterization-test dilemma applies here. No further human input needed.

No blocking questions — proceeding to Phase 3 (Architect).
