# Design Decision — Android-App-Download in den Einstellungen

## Scope

`webapp/src/pages/SettingsPage.tsx` + `SettingsPage.module.css`: neue dritte `<section>` "App" unterhalb von "Familie", oberste Ebene der Settings-Seite (kein neues Modal, keine neue Route).

## Layout

- Neue `<section className={styles.section}>` mit `<h2 className={styles.sectionTitle}>App</h2>`, danach `<div className={styles.card}>` — identisch zur Struktur der bestehenden zwei Sections.
- Innerhalb der Card: ein `settingRow`-artiges Layout, aber mit einer **echten CTA-Button-Optik** statt eines reinen Info-Rows, da hier eine Aktion (Download) im Vordergrund steht, nicht nur eine Einstellung:
  - Links: Icon in einem runden Icon-Container (analog zur visuellen Sprache von `AvatarBadge`, aber mit `Smartphone`-Icon aus `lucide-react`, Hintergrund `var(--color-primary-subtle)`, Icon-Farbe `var(--color-primary)`, Größe 40×40px, `border-radius: var(--radius-full)`).
  - Mitte: Titel "Android-App" (`settingLabel`-Stil) + Hint "APK herunterladen und installieren" (`settingHint`-Stil).
  - Rechts: `<a>`-Element gestylt wie ein sekundärer Button (Pill-Form, `border-radius: var(--radius-full)`, `border: 1px solid var(--color-primary)`, Text-Farbe `var(--color-primary)`, mit `Download`-Icon (16px) + Text "Herunterladen"), **kein** volltonig gefüllter Primary-Button — Settings-Seite hat sonst keine gefüllten CTAs, ein dezenter Outline-Button passt besser in die bestehende ruhige Optik.
- Padding/Gap identisch zu `.settingRow` (`padding: var(--space-4) var(--space-5)`, `gap: var(--space-4)`).

## Token Usage

| Element | Token |
|---|---|
| Section-Titel | `--font-size-xs`, `--color-text-muted`, bestehende `.sectionTitle`-Klasse (unverändert wiederverwendet) |
| Card | bestehende `.card`-Klasse (unverändert wiederverwendet) |
| Icon-Container Hintergrund | `--color-primary-subtle` |
| Icon-Farbe | `--color-primary` |
| Icon-Container Radius | `--radius-full` |
| Titel-Text | `--font-size-md`, `font-weight: 700`, `--color-text` (= `.settingLabel`, wiederverwendet) |
| Hint-Text | `--font-size-sm`, `--color-text-muted` (= `.settingHint`, wiederverwendet) |
| Download-Button Border/Text | `--color-primary` |
| Download-Button Radius | `--radius-full` |
| Download-Button Padding | `var(--space-2) var(--space-4)` |
| Row-Padding | `--space-4` / `--space-5` (= `.settingRow`, wiederverwendet) |

Neue CSS-Klassen (kein neuer Token nötig — alles aus bestehendem `tokens.css` ableitbar): `.appIconWrap`, `.downloadBtn`.

## Interactions

- `.downloadBtn:hover` → Hintergrund `var(--color-primary-subtle)` (gleiche Hover-Logik wie `.addMemberRow:hover`), `transition: background-color 0.15s ease` (Konsistenz mit restlicher Seite, die durchgehend 0.15s ease für Hover nutzt).
- `.downloadBtn:active` → leicht reduzierte Opacity (`opacity: 0.85`) als Klick-Feedback, da native `<a download>`-Klicks kein Browser-Loading-Indicator im UI zeigen.
- Fokus-Ring: `outline` folgt Browser-/globalem Fokus-Stil (kein Custom-Outline nötig, sofern die App global `:focus-visible` bereits stylet — falls nicht vorhanden, Standard-Browser-Outline beibehalten, nicht mit `outline: none` entfernen).
- Kein Loading-State (natives Datei-Download-Verhalten, siehe analysis.md Edge Case 4).

## Signature Element

Das runde, gefüllte Icon-Badge mit `Smartphone`-Icon in `--color-primary-subtle`/`--color-primary` links vom Text — spiegelt visuell die `AvatarBadge`-Sprache der Familie-Section, macht aber sofort klar, dass es hier um ein Gerät/eine App geht, nicht um eine Person. Dieser Icon-Badge-Stil ist das Wiedererkennungsmerkmal des neuen Abschnitts.

## Avoid

- Kein volltonig gefüllter (solid) Primary-Button — bricht mit der zurückhaltenden Optik der restlichen Settings-Seite (dort gibt es nur Outline-/Text-Buttons und Icon-Buttons, keine solid-CTAs).
- Kein zusätzliches Badge/Sticker à la "NEU" oder Marketing-Sprache — Settings-Seite ist funktional-nüchtern gehalten.
- Keine Store-Badge-Grafiken (Google-Play-Style-Buttons) nachbauen — das ist kein offizieller Play-Store-Download, sondern eine direkte APK, ein solches Badge wäre irreführend.
- Kein Hardcoding von Farben/Radien außerhalb der Tokens.
