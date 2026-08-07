# Design Decision — TD-11: QuickAddBar-Höhe als CSS-Variable

## Scope
`webapp/src/styles/tokens.css` (neue Variable) und `webapp/src/pages/ShoppingPage.module.css` (Variable verwenden). Kein visueller Change.

## Layout
Kein Layout-Change. Der visuelle Abstand bleibt `64px` — nur der Ursprung wechselt von hartem Wert zu Token.

## Token Usage
- **Neu:** `--quickadd-bar-height: 64px` → Layout-Block in tokens.css (zwischen `--topbar-height` und Radius-Block)
- **ShoppingPage.module.css `.page`:** `padding-bottom: var(--quickadd-bar-height)`

## Interactions
Keine.

## Signature Element
Kein User-facing Change. Reine DX-Verbesserung.

## Avoid
- Keinen `calc()`-Ausdruck verwenden — macht die Herkunft der 64px undurchsichtig
- Das Token nicht in den Dark-Mode-Override-Block setzen (Layout-Token sind theme-neutral)
- Keine neuen Tokens für andere Zwecke einführen
