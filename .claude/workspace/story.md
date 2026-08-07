# User Story — TD-11: QuickAddBar-Höhe als CSS-Variable

## Story
Als Entwickler möchte ich, dass der Abstand unter der Einkaufsliste automatisch zur Höhe der QuickAddBar passt, damit bei einer Änderung der Bar-Höhe kein manuelles Update an mehreren Stellen nötig ist.

## Acceptance Criteria

**AC1 – Keine hartcodierten Pixel**
Given die ShoppingPage hat eine fixe QuickAddBar am unteren Rand,
When ich die Bar-Höhe ändern möchte,
Then muss ich den Wert nur an einer einzigen Stelle anpassen.

**AC2 – Visuell identisches Ergebnis**
Given die ShoppingPage mit Einträgen,
When die Seite geladen wird,
Then ist der Inhalt weiterhin vollständig sichtbar und wird nicht von der QuickAddBar verdeckt.

**AC3 – CSS-Variable als Single Source of Truth**
Given die QuickAddBar-Höhe ist als CSS-Variable definiert,
When `.page` den `padding-bottom` setzt,
Then verwendet es `var(--quickadd-bar-height)` statt eines fixen Pixelwerts.

**AC4 – Mobile funktioniert weiterhin**
Given die App auf einem Mobilgerät (<768px),
When die QuickAddBar links auf 0 springt,
Then bleibt `padding-bottom` weiterhin korrekt (keine Regression).

## Out of Scope
- Dynamische Höhenmessung per JS/ResizeObserver
- Änderungen an anderen Seiten (nur ShoppingPage betroffen)
- Redesign der QuickAddBar
- Änderungen an der Bar-Höhe selbst
