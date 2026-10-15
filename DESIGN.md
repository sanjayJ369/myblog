# Captain's Desk: design language

The design reference for blog.sanjayj.dev. The theme lives in `themes/captains-desk/`; this file explains the
choices so future changes stay consistent. When the two disagree, fix one of them.

## Idea

A ship's logbook kept on a 1-bit Macintosh. **Elegant + a bit retro + technical typography + paper + dithering.**
References: the *Return of the Obra Dinn* site (1-bit dithering, engraved type, ledgers) and fanout.sh
(technical, dot-matrix labels). Reading comfort comes first: long-form text follows the Cloudflare blog's
proportions.

Three rules hold everything together:

1. **Two voices of type.** An engraved serif for things you *read*, a dot-matrix face for things you *scan*
   (labels, dates, numbers, counts). Never mix them inside one role.
2. **Ink on paper, one accent.** Every colour is paper, ink, or the ledger red. No other hues in the chrome.
3. **Dither, don't blur.** Shades are made from 1-bit patterns (Bayer or Atkinson), never gradients, shadows
   with blur, or transparency washes.

## Colour

All colours are CSS custom properties on `:root` in `assets/css/main.css`. Components only use tokens.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#ebdab8` | `#1b140c` | Page and window background |
| `--paper-2` | `#e1cda5` | `#261c11` | Inline code, maths blocks, hover rows |
| `--ink` | `#24190f` | `#ecd9b1` | Text, rules, frames, dither dots |
| `--ink-soft` | `#56432e` | `#c2a77c` | Secondary text, captions, strings in code |
| `--ink-faint` | `#6b573c` | `#a38c68` | Tags, comments in code, placeholders (4.5:1 or better on `--paper`) |
| `--rule` | `#c4aa80` | `#42331f` | Dotted row dividers, leaders |
| `--mark` | `#9b3517` | `#e27d4e` | The one accent: entry numbers, §, drop cap, keywords, selection |

- Dark mode ("Ink") is warm brown-black with cream text, not an inversion. It follows the OS by default; the
  ◐ Ink button stores an explicit choice in `localStorage.theme` and sets `data-theme` on `<html>`.
- Text selection is `--mark` background with `--paper` text.
- A fixed SVG noise layer adds paper grain (`--grain-op`), multiplied in light mode, screened in dark.

### Diagrams and images

- **Excalidraw SVGs** (inserted with `{{</* svg "folder/file.svg" "optional caption" */>}}`) are inlined so they
  can use `--svg-text-primary`, `--svg-accent-1`, etc. The theme maps these onto the palette, so they recolour
  with light/dark automatically. To prepare a new SVG, run `convert-svg-to-css-vars.py`; it rewrites hex colours
  to those variables. Leave `fill="#fff"`/`#000` inside `<mask>` elements alone; masks need them.
- **PNG diagrams** (hand-drawn on white) are shown as "ink on paper": `mix-blend-mode: multiply` with a light
  sepia filter in light mode, inverted and screened in dark mode.
- **Photos and screenshots** must not be inverted: list their path in `data/photos.yaml`.

## Type

Loaded from Google Fonts in `layouts/partials/head.html`.

| Role | Face | Where |
|---|---|---|
| Display | IM Fell English (+ SC for small caps) | Page and post titles, section headings, entry titles, year headers |
| Body | Newsreader | Running text, TOC entries, captions in prose |
| Label | VT323 | Nav, dates, counts, tags, crumbs, meta rows, window titles, § numbers, buttons |
| Code | JetBrains Mono (ligatures off) | Code blocks and inline code |

Scale: post title `clamp(2.4rem, 6vw, 3.8rem)`; section `2rem`; sub-section IM Fell SC `1.3rem`;
deeper headings IM Fell italic `1.2rem`. Labels are 15–17px (VT323 runs small), uppercase with
`letter-spacing: .06–.1em`.

### Reading proportions (articles)

Modelled on the Cloudflare blog:

- Body 18px (17px on phones), `line-height: 1.55`, paragraph gap `1.2rem`.
- Reading column `44rem`, centred on the page; the "On this page" rail sits to the right (15rem), with
  matching empty space on the left so the text stays centred. Below 1180px the rail narrows; below 820px it
  moves above the article.

### Headings

Posts may write sections as `#`, `##` or `###`. The section level is the shallowest heading level used more than
once; the heading render hook turns it into an `<h2 class="sec">`, numbered `§1, §2…` by a CSS counter, and deeper
levels shift down with it. A lone heading above that level (a `# Title` over `###` sections) becomes an unnumbered
lead. The "On this page" rail lists the section headings when there are at least two.

## Structure and components

- **Header**: brand in IM Fell SC, VT323 nav, the ♪ sound and ◐ Ink toggles (rounded 6px, 1.5px border; filled
  when on), then a sub-bar with the host and `N entries · est. YYYY` (both computed from the posts), closed by a
  double rule.
- **Window** (`.win` + `.winbar`): the signature container. 2px ink frame, striped title bar with a close box and
  a centred title, and a dithered drop shadow (checkerboard `repeating-conic-gradient`, clipped to an L-shape,
  offset 6–8px). Used for the home globe, code blocks (title = filename or language, plus **copy**), images
  (title = filename), SVG figures, the archive activity grid and the search box. Use it for *objects*, not for
  text sections.
- **Ledger** (home): numbered entries `001…`, date, title, tags, reading time, grouped under `Anno YYYY`.
  Hovering a row inverts it to ink.
- **Rules**: 2px solid for structure, 3px double to close a header block, dotted `--rule` between rows, and a
  dithered strip (`--dither-url`) as a section divider and for `<hr>`.
- **Archives**: a window with one square per month (empty / 25% dither / 50% dither / solid for 0 / 1 / 2 / 3+
  entries; future months dotted), then entries by year.
- **Tags**: a book-index layout: red display letters, tag names with dotted leaders to a count.
- **Search**: a "Find" window with a red `>` prompt; results highlight matches with `--mark`. `/` focuses it.
  It reads `index.json` (the home page's JSON output).
- **Callout-style content**: blockquotes are IM Fell italic with a double left rule. Maths blocks (KaTeX, enabled
  per post with `math: true`) sit on `--paper-2` with the same double rule.

## Motion, interaction and sound

Restraint: one moving thing per page, and nothing that blocks reading.

- **Home globe**: a 320×120 canvas, Atkinson-dithered, rotating slowly. On desktop its light follows the cursor.
- **Ripples**: home page only, desktop only (`hover: hover` and `pointer: fine`). A click (not on a link or
  button) draws two expanding dithered rings. Mouse movement does nothing.
- **Reading progress**: a thin bar at the top of articles, an even 50% Bayer dither with a solid 2px leading edge.
- **Contents highlight**: the current section is underlined in `--mark` in the "On this page" rail.
- **▲ TOP**: appears after 600px of scrolling, same rounded style with a dithered shadow.
- **Sound** (off by default, remembered in `localStorage.sound`), all synthesised with Web Audio, nothing
  downloaded:
  - quiet sea swell on the home page (filtered noise with slow swells);
  - water lap on a ripple click;
  - paper tick on links;
  - typewriter key on copy, tags and typing in search;
  - two-note wooden tock on the toggles.
- `prefers-reduced-motion` turns off the globe animation, ripples and smooth scrolling.

## Writing and labels

Plain, short copy. Labels are nouns (`Archives`, `Find`, `On this page`), counts are real (`14 entries`), and
dates are `30 OCT 2025` in labels. Avoid decorative copy; every label should state something true.

## Where things live

| Path | What |
|---|---|
| `themes/captains-desk/assets/css/main.css` | Tokens and all styles |
| `themes/captains-desk/assets/js/main.js` | Theme toggle, dither swatches, globe, ripples, sound, progress, TOC highlight, copy |
| `themes/captains-desk/assets/js/search.js` | Search page |
| `themes/captains-desk/layouts/_default/_markup/` | Render hooks: headings (§ sections), code blocks (windows), images (windows, ink/photo) |
| `layouts/shortcodes/svg.html` | Inline themeable SVG figure |
| `data/photos.yaml` | Images that must not get the ink treatment |
| `hugo.yaml` → `params.home` | Home heading and intro text |
