# Arch Decision — TD-11: QuickAddBar-Höhe als CSS-Variable

## Approach

Neues Layout-Token `--quickadd-bar-height: 64px` in `tokens.css` unter dem Layout-Abschnitt (neben `--sidebar-width` und `--topbar-height`).
`ShoppingPage.module.css` ersetzt `64px` durch `var(--quickadd-bar-height)`.

## Files to Touch

| Datei | Aktion |
|-------|--------|
| `webapp/src/styles/tokens.css` | `--quickadd-bar-height: 64px` im Layout-Block hinzufügen |
| `webapp/src/pages/ShoppingPage.module.css` | `padding-bottom: 64px` → `padding-bottom: var(--quickadd-bar-height)` |

## Pattern

Exakt analog zu `--topbar-height: 60px` und `--sidebar-width: 240px` in tokens.css.

## Constraints

- **NICHT** QuickAddBar.module.css selbst verändern (die Höhe wird nicht geändert, nur referenziert)
- **NICHT** JS / ResizeObserver einführen
- **NICHT** dark-mode `:root`-Block berühren (rein Layout-neutral)
- **KEINE** anderen Pages anfassen
- Kein neuer Kommentar in ShoppingPage.module.css nötig (Variable ist selbsterklärend)
