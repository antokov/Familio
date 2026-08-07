# Impl Report — TD-11: QuickAddBar-Höhe als CSS-Variable

## Approach

Neues Layout-Token `--quickadd-bar-height: 64px` in `tokens.css` eingeführt (analog `--topbar-height`). `ShoppingPage.module.css` referenziert es via `var()` statt Pixelwert.

## Files Changed

| Datei | Änderung |
|-------|----------|
| `webapp/src/styles/tokens.css` | `--quickadd-bar-height: 64px` im Layout-Block |
| `webapp/src/pages/ShoppingPage.module.css` | `padding-bottom: 64px` → `var(--quickadd-bar-height)` |

## Assumptions

- 64px entspricht dem tatsächlichen Render-Ergebnis der QuickAddBar (12+38+12+1=63, auf 64 gerundet — bewusst beibehalten)
- Kein Dark-Mode-Override nötig (Layout-Token sind theme-neutral)

## Deviations from arch-decision.md

Keine.

## Technical Debt / Follow-up

Keine neuen.

## Open Items

Keine.
