# BA Analysis — TD-11: QuickAddBar-Höhe als CSS-Variable

## Root Cause

`ShoppingPage.module.css` hat `padding-bottom: 64px` hartcodiert. Dieser Wert kommt von:
- `padding-top der Bar`: `var(--space-3)` = 12px
- Input-Höhe: 38px (fix in QuickAddBar.module.css)
- `padding-bottom der Bar`: `var(--space-3)` = 12px
- `border-top`: 1px
- **Total: 63px** (auf 64px aufgerundet)

Wenn padding oder input-Höhe in QuickAddBar.module.css geändert wird, muss ShoppingPage.module.css manuell mitgepflegt werden.

## Business Rules

1. **BR-1:** Der `padding-bottom`-Wert muss via CSS-Variable ausgedrückt werden — kein Pixelwert direkt in ShoppingPage.module.css.
2. **BR-2:** Die Variable muss an exakt einer Stelle definiert sein (Single Source of Truth).
3. **BR-3:** Kein JavaScript/ResizeObserver — reine CSS-Lösung.
4. **BR-4:** Das visuelle Ergebnis bleibt identisch (kein Pixel-Rückschritt).

## Edge Cases

1. **Bar-Höhe ändert sich:** Entwickler ändert nur die Variable, beide Stellen ziehen mit.
2. **Mobile (<768px):** `left: 0` in QuickAddBar — padding-bottom bleibt unverändert korrekt, kein Media-Query-Override nötig.
3. **Kein QuickAddBar-Consumer außer ShoppingPage:** Variable wird nur in ShoppingPage.module.css referenziert.

## Data Model

Keine DB-Änderungen. Reine CSS-Refaktorierung.

## Pattern-Analyse

`tokens.css` hat bereits `--topbar-height: 60px` und `--sidebar-width: 240px` im Layout-Abschnitt.
→ `--quickadd-bar-height: 64px` folgt exakt diesem Muster.

## Open Questions

- **NON-BLOCKING:** Soll der Wert dynamisch per CSS-Calc aus Space-Tokens berechnet werden?
  (`calc(var(--space-3) * 2 + 38px + 1px)` = 63px) → NEIN: Hardcoded 64px in der Variable ist klarer und weniger fragil.
