---
name: Keepsake
description: Letters for the people you love, sent if you stop checking in. An India Post inland letter card, opened.
colors:
  paper: "#c9dae7"
  paper-light: "#e2ecf4"
  paper-lighter: "#eef4f9"
  paper-deep: "#b4cadb"
  ink: "#1c2a5e"
  ink-deep: "#14204d"
  ink-soft: "#33427a"
  ink-faint: "#4a5785"
  ink-line: "rgb(28 42 94 / 0.28)"
  ink-hair: "rgb(28 42 94 / 0.14)"
  post-red: "#b3262d"
  post-red-ink: "#8f1d24"
  post-red-wash: "#f0d9da"
  stamp-violet: "#563a86"
  marigold: "#e39b2d"
  marigold-deep: "#b86e12"
  leaf: "#2d6a4d"
  ok: "#24603f"
  ok-wash: "#d5e9dc"
  whatsapp-green: "#d8f3c8"
typography:
  display:
    fontFamily: "Kalam, Anek Latin Variable, cursive"
    fontSize: "clamp(2.4rem, 7.4vw, 4.4rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.6vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.05
    fontVariation: "'wdth' 82"
  section:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100"
  read:
    fontFamily: "Martel, Georgia, serif"
    fontSize: "clamp(1.0625rem, 2.4vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.8
  hand:
    fontFamily: "Kalam, Anek Latin Variable, cursive"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0"
  label:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  numeral:
    fontFamily: "Anek Latin Variable, Anek Devanagari Variable, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
    fontVariation: "'wdth' 76"
rounded:
  none: "0"
  hair: "2px"
  sm: "3px"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.5rem"
  "6": "2rem"
  "7": "3rem"
  "8": "4.5rem"
  "9": "7rem"
  gutter: "clamp(1rem, 4vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-lighter}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1.25rem 0.6rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.paper-lighter}"
  button-primary-big:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-lighter}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1.75rem 0.6rem"
    height: "60px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1.25rem 0.6rem"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.paper-light}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.post-red-ink}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1.25rem 0.6rem"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.post-red-wash}"
  input:
    backgroundColor: "{colors.paper-lighter}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 0.8rem 0.55rem"
    height: "48px"
  chip:
    backgroundColor: "{colors.paper-lighter}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.95rem 0.4rem"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-lighter}"
  letter-sheet:
    backgroundColor: "{colors.paper-lighter}"
    textColor: "{colors.ink}"
    typography: "{typography.read}"
    rounded: "{rounded.none}"
    padding: "3rem 4.5rem"
---

# Design System: Keepsake

## Overview

**Creative North Star: "The Inland Letter Card"**

Every surface is a piece of India Post stationery: the pale blue inland letter card is the ground, the type is printed in indigo, the rules and frames are printed in post-office red, and the only other ink is a violet rubber stamp. The landing page is the card's address face, the app is the counter clerk's register, and the recipient's page is the letter itself, opened. Nothing is a screen pretending to be a vault, and nothing is cream sympathy paper.

Three voices carry the type. Anek is the printed card: labels, headings, buttons, numbers, set narrow for headings. Kalam is the person's hand: addresses, salutations, signatures, the margin note, the occasional empty-state line. Martel is the letter being read: long prose, letter bodies, legal text. Printed labels are bilingual where the card would print them (From / प्रेषक, the cut-here legend).

Density is calm and phone-first. Depth is paper on paper: lighter sheets lifted off the blue ground with soft, ink-tinted shadows, a tiled fractal-noise grain over the whole page, and a few tilted objects (stamps, postmarks, the opened letter, signatures) that make it read as handled rather than rendered.

**Key Characteristics:**
- Inland-letter blue ground with a tiled paper grain; lighter blue sheets for anything you read or write on.
- Indigo for every letter of type, printed or handwritten.
- Post-office red as printed furniture: double frames, double rules, perforations, sheet top borders.
- Violet rubber-stamp ink reserved for postmarks and stamped timeline dates.
- Three type voices with fixed jobs: printed (Anek), hand (Kalam), read (Martel).
- Authored SVG stationery (stamp with marigold, postmark with cancellation waves) instead of icons or illustration.

## Colors

A cool, low-chroma stationery palette: blue paper, indigo ink, and two inks used sparingly as print and stamp.

### Primary
- **Printing Indigo** (`ink`): all type, primary buttons, selected chips, checked controls, the active nav underline, text selection. Hover on primary buttons deepens to **Night Indigo** (`ink-deep`).
- **Soft Indigo / Faint Indigo** (`ink-soft`, `ink-faint`): secondary text, hints, meta lines, input borders and placeholders. Still indigo; never grey.

### Secondary
- **India Post Red** (`post-red`): printed rules and frames (the double frame on the address face and the clock, the double rule under mastheads and above the footer, the wordmark's double underline), perforations (the dotted cut line), the 3px top border on letter sheets and the writing paper, the From box, the Example tag border, stamp frames and denominations.
- **Red Ink** (`post-red-ink`): the darker red for the few red words the card prints: the From / प्रेषक legend, the Example tag, price numerals, and alarm text (form errors, warnings, the overdue clock, the release stop on the timeline).
- **Red Wash** (`post-red-wash`): the ground of alarm states only (alarm notice, overdue clock, danger-button hover).

### Tertiary
- **Rubber-Stamp Violet** (`stamp-violet`): postmarks and stamped timeline dates. Nothing else.
- **Marigold / Deep Marigold / Leaf** (`marigold`, `marigold-deep`, `leaf`): only inside the authored stamp artwork (flower and toran garland).

### Neutral
- **Inland Blue** (`paper`): the page ground everywhere, also the theme color.
- **Pale Sheet** (`paper-light`): quiet-button hover, plain notices.
- **Letter Sheet** (`paper-lighter`): letter sheets, the inside of the card, inputs, chips, option cards, primary-button text.
- **Deep Blue** (`paper-deep`): scrollbar track.
- **Ink Line / Ink Hair** (`ink-line`, `ink-hair`): dividers, list rules, dashed address lines, fold lines, link underlines at rest.
- **Success Green / Wash** (`ok`, `ok-wash`): success notices only.
- **WhatsApp Green** (`whatsapp-green`): only the example WhatsApp bubble, which depicts a real third-party surface.

### Named Rules
**The Ink Discipline Rule.** Indigo for all type, including handwriting. India Post red only for printed rules, frames, perforations, the printed legends set on them (From / प्रेषक, "to open, cut here", the पत्र label beside the wordmark), the Example tag, price numerals and alarm states. Violet rubber-stamp ink only for postmarks and stamped timeline dates. If a word is red or violet and is not on that list, it is wrong.

**The Interaction Red Rule.** The focus ring (2px solid red, 3px offset), the input focus halo (3px at 28% red), the caret and the hover colour of link underlines are red. These are the only non-printed uses of red, and they never colour type.

## Typography

**Display / Hand Font:** Kalam (with Anek Latin, cursive)
**Body / Printed Font:** Anek Latin Variable and Anek Devanagari Variable (with system-ui, sans-serif)
**Reading Font:** Martel (with Georgia, serif)

All three are self-hosted through @fontsource; no system display face is used.

**Character:** A narrow, sturdy Indian grotesque prints the card; a loose, upright hand writes on it; a Devanagari-friendly serif carries anything long enough to be read slowly.

### Hierarchy
- **Display** (Kalam 400, clamp(2.4rem, 7.4vw, 4.4rem), 1.3): the handwritten address block ("To, the people I love"), the recipient's "For Asha, from Ravi", auth page titles, the closing line. Sits on dashed ink address lines where it is an address.
- **Headline** (Anek 700, wdth 78, clamp(2rem, 4.6vw, 3.4rem), 1.02, -0.015em): landing section headings, max 18ch.
- **Title** (Anek 700, wdth 82, 2.25rem, 1.05): app page titles. Legal h1 uses the same voice at clamp(2rem, 5vw, 2.75rem).
- **Section** (Anek 700, wdth 85, 1.375rem): app section titles and legal h2.
- **Body** (Anek 400, 1.125rem, 1.5): default UI text. Secondary text drops to 1rem in soft indigo.
- **Read** (Martel 400, 1.0625–1.1875rem, 1.7–1.8, max 64ch): letter bodies, the "how it works" letter text, excerpts, legal prose, the writing paper.
- **Hand** (Kalam 400, 1.375–1.75rem): salutations, signatures, the relative due time, margin notes, rhythm-picker legend, empty-state titles. Never for UI labels or buttons.
- **Label** (Anek 600, 1rem): form labels, legends, the From legend (650, wdth 80).
- **Numeral** (Anek 700, wdth 76, 2.25rem, tabular): price numerals; the due date on the clock uses the same narrow bold at clamp(1.9rem, 5vw, 2.75rem).

### Named Rules
**The Three Voices Rule.** Printed things are Anek, written things are Kalam, read things are Martel. Pick the voice by what the text is on the card, not by how big it is.

**The Narrow Heading Rule.** Anek headings narrow with their importance (wdth 75 for the wordmark, 76–82 for headlines and numerals, 85 for section titles, 92 for buttons, 100 for body). Heading weight is 650–750; never light.

## Layout

A single centred column per surface with a fluid gutter (clamp(1rem, 4vw, 3rem)): 1240px for the landing and auth pages, 1120px for the app, 820px for the recipient letter page, 760px for legal text and the FAQ list. Spacing runs on a nine-step scale from 0.25rem to 7rem; landing sections are separated by the largest step (7rem), app sections by 3rem.

Mobile first, with breakpoints at 640, 720/760, 900 and 1000px. The address face is a grid that reflows from a stacked column (postage, address, lede, sender) to address-and-postage over lede-and-sender at 1000px. The app header moves its nav from a scrolling row under the wordmark to a centred row at 760px. The rhythm timeline runs vertically on phones and as a five-stop horizontal track at 900px. Two-column splits are 5fr/6fr (landing, auth) and 3fr/2fr (app).

Every interactive target is at least 44px tall; primary buttons are 48px, big buttons 60px.

## Elevation & Depth

Paper on paper. The ground is flat blue with grain; sheets that are read or written on (the inside of the card, app sheets, letter sheets, the opened example letter, the writing paper) are lifted with a two-layer, indigo-tinted shadow: a 1–2px contact shadow plus a long, negative-spread drop. Framed elements (the address face, the clock, the From box) are not lifted; they are printed on the card. Stamps carry a small drop shadow as objects laid on top.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 2px rgb(28 42 94 / 0.12), 0 12px 28px -18px rgb(28 42 94 / 0.4)`): app sheets. Landing and letter sheets use the same shape at 16–18px offset, 32–40px blur, 0.45–0.5 alpha.
- **Button** (`box-shadow: 0 1px 0 rgb(255 255 255 / 0.35) inset, 0 2px 6px -2px rgb(29 42 94 / 0.14)`): primary buttons at rest; removed on press with a 1px downward nudge.
- **Stamp** (`filter: drop-shadow(0 3px 5px rgb(28 42 94 / 0.22))`): stamp artwork.
- **Bubble** (`box-shadow: 0 2px 5px -1px rgb(28 42 94 / 0.25)`): the example WhatsApp bubble.

### Named Rules
**The Printed-Or-Lifted Rule.** A surface is either printed on the card (red frame, no shadow) or a separate sheet lying on it (lighter blue, soft shadow). Never both.

## Shapes

Square stationery. Corners are a 3px radius on controls (buttons, inputs, option cards, notices, banners), 2px on sheets and checkboxes, and pills only for chips, the starter prompts, tags and the Example tag. Frames are double: a 1.5px red border with a 1px red outline 4px outside it. Rules are double (2px over 1px red). Perforations are 3px dotted red; fold lines and address lines are dashed indigo. A small set of objects is tilted by hand: stamps (about ±3deg), postmarks (-8 to -12deg), the opened letter (1.4deg), signatures and margin notes (-3 to -6deg).

### Named Rules
**The Square Top Rule.** No border-radius on any surface that carries a thick accent top border. Letter sheets, the opened example letter and the writing paper (3px red top) stay square-cornered.

## Components

### Buttons
Printed, firm and plain.
- **Shape:** gently squared (3px), 1.5px border in the button's own ink.
- **Primary:** indigo fill, Letter Sheet text, Anek 600 at wdth 92, 48px min height; an optional trailing arrow icon at 1.1em.
- **Hover / Focus / Active:** hover deepens to Night Indigo; focus is the red 2px ring; active drops 1px and loses its shadow; disabled at 55% opacity.
- **Quiet:** transparent with a soft-indigo border, Pale Sheet on hover. **Danger:** transparent, red border, red-ink text, Red Wash on hover. **Big** (60px, 1.375rem) for the landing and closing calls to action; **Small** (40px, 1rem) in headers.
- **Link button:** underlined text with an ink-line underline that turns red on hover.

### Chips
- **Style:** pill, 44px, Letter Sheet with a 1.5px soft-indigo border, Anek 600 at wdth 90.
- **State:** selected fills indigo with Letter Sheet text; hover shifts to Inland Blue. Starter prompts in the editor are the dashed-border variant that goes solid on hover.

### Cards / Containers
- **Sheets:** Letter Sheet on the blue ground, 2px radius (none when a red top border is present), sheet shadow, 2rem padding on desktop.
- **Framed boxes:** the address face and the Today clock use the red double frame; the From / प्रेषक box is a single 1.5px red frame with its legend set into the top edge on a paper-coloured knockout. The clock in alarm takes the Red Wash ground and red-ink due date.
- **Lists:** ruled rows separated by 1px ink lines, no boxes.
- **Empty states:** 1.5px dashed ink-line border, 3px radius, a Kalam title.

### Inputs / Fields
- **Style:** Letter Sheet fill, 1px faint-indigo border, 3px radius, 48px tall; hover darkens the border to soft indigo.
- **Focus:** border to indigo plus a 3px red halo at 28%.
- **Error:** red border, red-ink message in Anek 600.
- **Option cards:** radio rows on Letter Sheet with an ink-line border; checked adds an inset 1px indigo ring. Custom checkboxes (2px radius) and radios draw an indigo tick or dot.
- **Writing paper:** the letter editor's textarea is ruled with faint indigo lines that scroll with the text (1.85em line), set in Martel, with a 3px red top border and square corners.

### Navigation
- **Landing:** wordmark left; Anek 550 links and a small primary button right; secondary links hidden below 720px.
- **App:** Anek 550 tabs in soft indigo with a 3px bottom bar; hover shows an ink-line bar, the current page is indigo, 700, with an indigo bar. A red double rule runs under the header.
- **Wordmark:** "Keepsake" in Anek 750 at wdth 75 with a red 3px double underline, plus a small printed पत्र in Anek, red.

### Postmark (signature)
A violet rubber-stamp ring with curved KEEPSAKE / CHECKED IN legends, the date (and optional time) in the centre, wavy cancellation lines, and a noise filter for uneven ink. It records a moment: today's date on the landing, the last check-in on Today, the confirmation after sign-up. It presses in with a 520–560ms scale-and-blur animation and blends with multiply over the stamp.

### Stamp (signature)
A perforated stamp on off-white with a red frame, the price as its red denomination, KEEPSAKE in indigo at the foot, and a marigold or toran garland in the middle. The denomination is always the real price.

### Rhythm timeline (signature)
Rhythm chips above a dashed indigo track of five stops. Each stop's date is stamped in violet (Anek 700, wdth 78, tabular); the release stop alone turns red. Stops animate in with a short 420ms stamp.

## Do's and Don'ts

### Do:
- **Do** set every word in indigo, including Kalam handwriting.
- **Do** reserve red for printed rules, frames, perforations, the From legend, the Example tag, price numerals and alarm states, and violet for postmarks and stamped timeline dates.
- **Do** frame printed regions with the red double frame (1.5px border, 1px outline at 4px offset) and separate page zones with the red double rule.
- **Do** put readable prose in Martel on a Letter Sheet, max 64ch, line height 1.7–1.8.
- **Do** keep sheets with a 3px red top border square-cornered.
- **Do** keep touch targets at 44px or more and honour reduced motion (all animations collapse to 1ms).
- **Do** print bilingual labels where the card would (English / Hindi), marked with `lang="hi"`.

### Don't:
- **Don't** colour type red or violet outside the Ink Discipline list, and never colour handwriting anything but indigo.
- **Don't** round a surface that carries a thick accent top border.
- **Don't** both frame and lift the same surface.
- **Don't** use Kalam for buttons, labels or navigation.
- **Don't** use marigold, leaf or WhatsApp green outside the stamp artwork and the example bubble.
- **Don't** add a dark "vault" theme, shield or lock imagery, or cream sympathy-card paper; the ground is inland-letter blue.
