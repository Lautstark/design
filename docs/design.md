# A shared design language for mitreden, bildhaft and vorlaut

**Status: in force, and partly mechanised.** The token names in §4.2 are applied in
mitreden and bildhaft. The values behind them are no longer chosen by hand: they are
derived from each product's single declared accent by `lib/derive.js`, contrast-
checked at generation time, and written into each repository by `build.js`. See
§7. vorlaut joined the family after most of this document was written; its
conversion is §8.

This document is the agreement. The generator implements the parts of it that are
arithmetic; everything else — the patterns, the vocabulary, the rules about what a
row may contain — is still prose, and still binding.

*mitreden* takes a sentence and gives back an audio file, so that every device a
child speaks through uses the same voice. *bildhaft* takes a German sentence and
gives back a row of AAC pictograms to correct and print. *vorlaut* is a five-key
talker you build yourself, and the workshop page that fills it. Same author, same
field, same mark — a speech bubble, byte-identical path data in `icon.svg` here,
`src/ui/logo.ts` there and `public/icon.svg` in the third — filled pink, orange
and purple.

The goal is that they read as siblings: same look, same interaction patterns, same
words for the same things. The method is a written rule set plus one generated token
file per product. No component, no stylesheet and no runtime dependency crosses
between the repositories.

## Three claims this document used to make

All were true when written and are not now. They are corrected here rather than
quietly patched, because each was load-bearing:

- **"Nothing here has been applied."** The token names went in on both sides. The
  comment at the top of mitreden's `ui.html` points back at this document by name.
- **"mitreden is dark."** §4.4 still says so. mitreden has since grown a light
  scheme, and its own comment now says dark "is no longer the only thing there is".
  The rule in §4.4 survives — *a product commits to a ground and states it* — but
  mitreden is no longer the example of committing to dark. vorlaut is.
- **"No code crosses between the repositories."** The generated token file bent
  this rule; the components file breaks it, deliberately. Three products drew
  the same button three times — two of them byte-alike, the third under its own
  class names — and the focus policy crossed by hand-copy, which is the worst
  of both arrangements: shared in fact, unshared in name. `components.css` now
  crosses by the road the tokens already take, a version pin. What survives of
  the rule: no *product* code crosses, and nothing crosses by hand. See §9.

The Ground rules section was rewritten on 2026-08-24 for the same reason these
three are here: it described mitreden as one HTML file served out of a container
and bildhaft as React, and both had stopped being true. Anything further down
that reasons about "container impact" is spent, and §5 says so at its head.

## The thesis

**mitreden and bildhaft are one tool with two outputs.** You type a sentence; one
gives it a voice, the other gives it symbols. Everything else — how sentences are
kept, grouped, searched, corrected, backed up, how the page is laid out and what
the words for all of it are — should be the same, and where it differs today that
is an accident to be removed rather than a difference to be justified.

An earlier draft of this document worked from a weaker premise: that the two are
different *kinds* of tool (a document editor and a batch archive) and should
converge selectively. Several recommendations below were written under it and have
been overruled. Where that happened the original reasoning is kept, because the
costs it identified are real and someone will have to pay them — but it no longer
decides the outcome. Section 6 collects those costs.

### Decisions

| Question | Decision |
| --- | --- |
| What is a group of sentences called? | **Sammlung** / *Collection*, in all three |
| Can a sentence be in several? | **Where the model allows** (§3.1). mitreden yes, bildhaft no, vorlaut cannot |
| Light or dark? | **Both, in both.** One token set, two schemes, `prefers-color-scheme` |
| Confirmations and editing | **Real in-page dialogs.** Done: `@lautstark/design/dialog`, and editing happens in the field showing the value |
| Page layout | **A sidebar shell in all three**, so they open looking like one application |

One consequence worth naming up front: bildhaft renames its symbol sets to
**Symbolquellen**, which frees *Sammlung* for the thing both products actually
share. Code stays English in both repositories, as it already does, so the
English word is *collection* everywhere the code says it — the field in
`phrases.json`, the `--collections` flag, the `/api/collections` route.

Neither product has users yet, so nothing here carries a compatibility burden
and no fallbacks were kept. That is worth writing down, because several
decisions would be different if it stopped being true.

---

## Ground rules this document works under

These are constraints, not preferences. Every proposal below is measured against
them.

**Rewritten 2026-08-24.** Three of the four rules that stood here described a
world that has gone: mitreden was one HTML file served by `mitreden.py` out of a
container, bildhaft was React, and no code crossed between the repositories. All
three are false now, and they were the premises the rest of this document was
measured against, so leaving them was worse than any single wrong sentence
further down. What they said is in the history; what is true is below.

**Code crosses, by version pin and never by hand.** There are four shared
packages — `@lautstark/design` (these tokens, `components.css`, and the theme,
menu and dialog modules), `@lautstark/bildquelle`, `@lautstark/stimmquelle` and
`@lautstark/sicherung`. Each product pins an exact release tag, and
`node pins.js` says out loud when one has fallen behind. What still does not
cross is *product* code: a tile grid, a phrase list, a print sheet. The test is
the one `components.css` states — only what the products demonstrably
duplicated.

**All three are browser-only TypeScript, built by Vite.** No server, no
container, no accounts. mitreden's Python half and its image are gone; bildhaft
is no longer React — its `ui/dom.ts` is the whole of what is left of a
framework; vorlaut's `app.py` went the same way. Each is a static site deployed
from `main` to GitHub Pages, so an interface change reaches everybody on the
next deploy and there is no staged rollout and nothing to pin.

**Two of the three are bilingual, bildhaft is not.** Every user-facing string in
mitreden lives in `src/i18n/de.json` and `src/i18n/en.json` with English keys,
and vorlaut carries both languages in `src/core/boot_data.ts`; both have a
language picker. bildhaft's German strings are literals where they are used, and
its `ui/dom.ts` says why: bildhaft turns *German* sentences into pictograms, so
an English shell would front a program that only understands German input. A
vocabulary decision therefore costs the two bilingual products a table edit each
and costs bildhaft a hunt — which is why several vocabulary recommendations
below land on bildhaft, and why every shared module takes its words from the
caller rather than carrying any.

---

## 1. Token audit

Extracted values, both sides, as of this writing — and this one is history in
the strictest sense. The values below were read out of two products' stylesheets
in order to argue for one generated set; that set exists, `tokens/<product>.css`
is generated from a single accent per product, and `build.js --check` holds
every contrast pairing. Nothing here should be consulted for what a colour *is*
today. The file paths named are the ones the values came from and several of
them no longer exist.

### 1.1 Colour

mitreden declares its palette once in `ui.html` under `:root` and repeats a subset
in `docs/style.css` for the landing page. bildhaft declares its palette in
`src/styles/app.css`, twice: a light set and a dark set behind
`@media (prefers-color-scheme: dark)`.

> The mitreden column below records the state **at the time of the audit**, before
> this document's own recommendations were applied to it; it is kept as the
> starting point the rest of the document argues from. The bildhaft column is
> current, and every value in it has been checked with the method "Check the
> pairs, do not look at them" now requires at the close of §4.2 — nineteen
> foreground/background pairs per scheme, hover states included. Its worst pair
> is `--text-faint` on `--surface-2`, at 4.56:1 light and 4.67:1 dark.

| Role | mitreden (`ui.html`) | bildhaft light | bildhaft dark |
| --- | --- | --- | --- |
| page background | `--ink` `#0e1014` | `--bg` `#faf9f7` | `#171614` |
| raised surface | `--panel` `#161920` | `--surface` `#ffffff` | `#201f1c` |
| second surface | `--line-soft` `#1c202a` (misused as one) | `--surface-2` `#f2f0ec` | `#2a2825` |
| third surface | — | `--surface-3` `#e9e6e0` | `#34322e` |
| hairline | `--line` `#242833` | `--line` `rgba(28,26,23,.09)` | `rgba(255,255,255,.09)` |
| text | `--text` `#f2efea` | `--text` `#1c1a17` | `#eeebe6` |
| muted text | `--muted` `#7c8496` | `--text-dim` `#6c665e` | `#a49d93` |
| faint text | — | `--text-faint` `#726c64` | `#999084` |
| accent (fill) | `--accent` `#ff8bc7` | `--accent` `#ff6b35` | `#ff6b35` |
| ink on accent | `--accent-ink` `#14161c` | `--accent-ink` `#2b1206` | `#2b1206` |
| accent as text | — (hard-coded `#ffa3d2` for hover) | `--accent-strong` `#c2410c` | `#ff8b5e` |
| accent under pointer | — (hard-coded `#ffa3d2`) | `--accent-hover` `#f2551c` | `#ff8355` |
| accent wash | — | `--accent-soft` `#fff0e9` | `#2e1c13` |
| success | `--ok` `#3fb96b` | — | — |
| warning | `--warn` `#f0a202` | — | — |
| absent/unknown | `--miss` `#5b6377` | — | — |
| danger | `--danger` `#e5484d` | `--danger` `#b3261e` | `#f2867a` |
| ink on danger | — | `--danger-ink` `#ffffff` | `#2a1210` |
| danger wash | — | `--danger-soft` `#fdeceb` | `#35201d` |

Hard-coded colours in `ui.html` that have no token: `#1e222c` (the universal hover
fill, used in eleven places), `#ffa3d2` (accent hover), `#4d5464` (placeholder),
`rgba(0,0,0,.5)` (menu shadow), `rgba(0,0,0,.6)` (dialog backdrop),
`rgba(229,72,77,.12)` (danger hover — a hand-written `--danger` wash that is exactly
bildhaft's `--danger-soft` idea without the token).

The same grep run against bildhaft found three literals outside its token blocks.
Two are scrims — `rgba(0,0,0,.45)` behind the mobile navigation panel and
`rgba(22,20,17,.38)` behind dialogs — which are meant to be dark under either
scheme and are correct as literals. The third was `color: #fff` on the filled
destructive button, which is 6.54:1 on a deep red in light and **2.48:1** on the
light salmon that `--danger` becomes in dark. That is the origin of `--danger-ink`
in §4.2.

**Where they already agree.** The token *names* `--accent`, `--accent-ink`,
`--line`, `--text` and `--danger` mean the same thing in both files, and bildhaft
says so in a comment: `--accent` is the fill, `--accent-ink` is text placed on that
fill. This is the existing shared vocabulary and it should be the spine of the token
set. The `--accent` / `--accent-ink` pairing is the single most important thing the
two already do identically, and it is what makes the mark work in two colours.

**Where they diverge, in order of size.**

1. **Light versus dark.** bildhaft is light-first and follows the OS; mitreden is
   dark-only and says so with `color-scheme: dark`, deliberately, so the OS draws
   its own widgets dark too. This is the largest visible difference between the two
   products and no amount of token alignment hides it.
2. **Hierarchy through borders versus through fills.** mitreden separates a surface
   from its ground with a 1px `--line` border. bildhaft separates them with
   `--surface-2` / `--surface-3` fills and uses `outline: 1px solid var(--line)`
   only as a whisper. Consequence: mitreden has one raised level, bildhaft has
   three, and bildhaft's buttons *are* a surface level while mitreden's buttons are
   a transparent box with a border.
3. **mitreden has three status colours bildhaft has none of** (`--ok`, `--warn`,
   `--miss`) because it has a per-sentence recording state and bildhaft has no
   equivalent — what bildhaft generates counts as accepted, with no pending state to
   report. Not a divergence to fix; a real difference in what the products track.
4. **bildhaft has three accent variants mitreden has none of** (`--accent-strong`,
   `--accent-soft`, plus `--danger-soft`) because on a light ground the brand colour
   fails AA as text and needs a darkened sibling. mitreden on a dark ground does not
   have that problem — but it still lacks a token for "accent-tinted background",
   which is why its active chip has to be a full accent fill and has no quieter
   option.

### 1.2 Type

| | mitreden | bildhaft |
| --- | --- | --- |
| stack | `ui-sans-serif, system-ui, "Segoe UI", sans-serif` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| mono | `ui-monospace, SFMono-Regular, Menlo, monospace` (landing page only) | `--mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |
| base | 16px / 1.55 | 15px / 1.55 |
| product title | `clamp(30px, 6vw, 46px)`, weight 800, tracking −.035em | 18px, weight 650, tracking −.02em |
| dialog heading | 20px, tracking −.02em | 17px, weight 650, tracking −.015em |
| the input you type into | 19px (17px under 560px) | 22px, tracking −.012em |
| list row text | 18px, tracking −.01em | 15px, colour `--text-dim` |
| secondary | 15px / 14px / 13px / 12px, ad hoc | 14 / 13.5 / 13 / 12.5 / 12 / 11.5 / 11, ad hoc |
| uppercase caption | 12px, tracking .04em (`.flabel`) | 11–12px, weight 650, tracking .08em (`.sidebar__section > h2`, `.opt > label`) |

Both use `font-variant-numeric: tabular-nums` for counts, and both use a very
similar uppercase micro-caption. Both stacks are system-font-only — no webfont, no
CDN — which is a shared value worth writing down even though neither file states it.

The real divergence is the **title**: mitreden's `mitreden` is a 46px display
headline at weight 800; bildhaft's `bildhaft` is an 18px sidebar label at weight
650. Same wordmark treatment they are not.

### 1.3 Spacing, radii, shadow, motion

| | mitreden | bildhaft |
| --- | --- | --- |
| spacing | no scale; literal px per rule (2, 4, 6, 8, 10, 12, 14, 16, 18, 22, 36, 40) | no scale; literal px per rule (2, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 24, 32, 36) |
| content column | `max-width: 720px`, body padding `clamp(20px, 5vw, 64px)` | `max-width: 840px`, padding `36px 32px 32px`, plus a 268px sidebar |
| large radius | 16px (hero, settings sheet) | `--radius: 14px` (cards, rows, composer); dialog 18px |
| small radius | 10–11px (buttons, inputs, menu) | `--radius-sm: 9px` (fields, menu, slots) |
| pill | 999px (chips, gear, language picker) | 99px (all buttons, chips, toast, segmented) |
| tiny | 7px (menu item), 9px (`.dots`) | 7px (menu item), 4px (`kbd`) |
| shadow | one, untokenised: `0 14px 34px rgba(0,0,0,.5)` on the popup menu | `--shadow-sm` and `--shadow`, both redefined for dark |
| transitions | **none anywhere** | `.13s ease` on every hover, `.15s`–`.22s` on layout |
| reduced motion | not handled (nothing moves) | `@media (prefers-reduced-motion: reduce)` clamps everything to .01ms |

Both are within a pixel or two on the small radius and both reach for a full pill
for chip-shaped things. The 16/14 and 11/9 gaps are noise, not intent.

### 1.4 Focus and hover

This is where they are closest, and it is worth stating exactly:

| | mitreden | bildhaft |
| --- | --- | --- |
| focus ring | `outline: 2px solid var(--accent); outline-offset: 2px` | `outline: 2px solid var(--accent); outline-offset: 2px` |
| applied to | `textarea:focus, input:focus, button:focus-visible`, plus repeats on `.langpick`, `.asbutton`, `select` | one rule: `:focus-visible` |
| checkbox tint | `accent-color: var(--accent)` | `accent-color: var(--accent)` |
| hover | `background: #1e222c` (hard-coded, instant) | `background: var(--surface-2/-3)` (tokenised, .13s) |
| text-field focus | ring only | ring *plus* background lifts `--surface-2` → `--surface` and the border takes the accent |

**The focus rule is already byte-identical in intent.** It should be the first thing
written into the shared token set, because it is the one rule that is already true.
mitreden's version is spread over four selectors because it predates `:focus-visible`
support being universal; collapsing it to one rule is a pure simplification.

---

## 2. Component pattern audit

For each shared concept: what mitreden does, what bildhaft does, how far apart.

**Read as of its date.** This section is the measurement that argued for a
shared layer, and it was taken before there was one. Where it contrasts two
implementations of the same control, the answer in most cases is now
`components.css` and the modules beside it: both products import the same
button, field, chip, menu, sheet and focus policy. The contrasts are kept
because they are the evidence, not because they are current. Where a bullet has
since become wrong about what a product *does*, it says so underneath.

**Read end to end against both products on 2026-08-25**, so that the notes below
are one reading rather than a trail of separate ones. Three entries needed
nothing: *Status and toast* still describes both products exactly, and the
*Since* lines under *Confirmations and prompts* and *Footers* are still true —
mitreden's three destructive questions are three `confirmDialog()` calls, and
its footer is components.css's `.footer` carrying the Impressum and Datenschutz
the published site owes.

### Buttons

- **mitreden.** One `button` base: `font: inherit`, weight 600, radius 10px, padding
  `11px 18px`, transparent fill, 1px `--line` border. `.primary` swaps in the accent
  fill and `--accent-ink`. `.quiet` drops the border and goes `--muted`, brightening
  to `--text` on hover. Danger exists only *inside* the popup menu (`.menu
  button.danger`), never as a standalone button.
- **bildhaft.** One `.btn` base: inline-flex with a 7px gap for an icon, radius
  `--radius-pill`,
  padding `8px 14px`, **no border**, `--surface-2` fill. Modifiers `--primary`,
  `--quiet`, `--danger` (text-only, `--danger-soft` on hover), `--danger-solid`
  (filled, white text), `--sm`, `--icon` (round, 7px padding).
- **Distance: large in shape, small in intent.** Both have exactly the same three
  tiers — loud, normal, quiet — and both spell primary as accent-fill +
  `--accent-ink`. The disagreement is bordered-rectangle versus borderless-pill and
  whether a quiet button is grey text or grey fill. bildhaft additionally has an
  icon-button size that mitreden has no equivalent of (`.gear` and `.dots` are two
  separate hand-rolled near-misses of it).
- **Since:** neither base exists. Both products spell a button `.btn` from
  components.css, with `.primary`, `.quiet`, `.sm` and `.icon` beside it —
  bildhaft's `--modifier` names went, and so did mitreden's bare `button` base.
  The shape disagreement was settled rather than won: the shared button is a
  bordered rectangle at `--radius-sm` over a `--surface-2` fill, which is
  mitreden's border on bildhaft's fill, and the pill is gone from both. The icon
  button mitreden had no equivalent of is `.btn.quiet.icon`, and the near-misses
  went with it — `app.css` keeps a comment where its own `.icon` used to be.

### Text fields and search

- **mitreden.** `textarea` and `input[type=text|search|password]` share
  `background: var(--ink)` — *darker* than the panel they sit in — a 1px `--line`
  border, radius 10–11px, `font: inherit`. The search box is a plain
  `input[type=search]` with `flex: 1; min-width: 200px`, dropping to full width
  under 560px. Placeholder `#4d5464`.
- **bildhaft.** One `.field` class: `--surface-2` fill, **transparent** 1px border,
  radius 9px, and on focus the fill lifts to `--surface` while the border takes the
  accent. The composer is not a `.field` at all — it is a borderless textarea inside
  a `.composer__box` that carries the outline and shows focus with
  `:focus-within`, auto-growing to 190px.
- **Distance: medium.** Recessed-and-outlined versus raised-and-fill-lifting. Both
  are `font: inherit`, both are full-width, both put the primary action to the right
  of or below the typing area. bildhaft's composer submits on Enter with
  Shift+Enter for a newline; mitreden's textarea is explicitly multi-line — one
  sentence per line is the input format — so Enter must stay a newline there. That
  is a genuine difference in the data, not a style choice.
- **Since:** both draw components.css's `.field`, and mitreden's recessed hole —
  `background: var(--ink)`, darker than the panel — is gone; its `app.css` puts
  the change in four words, "a fill, not a hole".

  **And the last claim is now false, which is the interesting half.** mitreden's
  composer submits on Enter, with Shift+Enter for a newline, exactly as
  bildhaft's does (`src/ui/composer.ts`). The difference in the data was real and
  survives — several lines pasted at once still each become a sentence — but it
  never needed the key to differ: the format is what a *paste* means, not what
  Enter has to mean. Read as a lesson about audits, this is one: "a genuine
  difference in the data, not a style choice" was true of the difference and
  wrong about what followed from it.

### Chips and filters

- **mitreden.** `.chip`: pill, 13px, weight 500, `--line` border, transparent fill,
  `--muted` text, with a `.n` count span at `opacity: .55` and tabular numerals.
  `.chip.on` fills with the accent. `.chip.fold` is dashed and is the "+ n more"
  affordance after the twelfth chip (`CHIP_CAP = 12`). Two rows, each with an
  uppercase `.flabel` naming the axis (Gruppen / Stimmen); several chips combine
  with OR, the free-text search ANDs on top.
- **bildhaft.** No filter chips at all. The nearest things are `.list__item` in the
  sidebar (a full-width row with the same name-plus-count shape, active state
  `--accent-soft` background + `--accent-strong` text + weight 600) and `.tag` (a
  small non-interactive accent-soft pill used as a badge: "Standard", "1284
  Symbole").
- **Distance: this is the structural fork.** Both render "a named grouping with a
  count, one of which can be current". mitreden renders it as a wrapping row of
  pills that multi-select; bildhaft renders it as a vertical rail that
  single-selects. See §5 for why I do not recommend converging on the rail.

**The fork closed, and §5 was decided the other way (read 2026-08-25).** Both
products render a named grouping with a count as a sidebar row now, and the
rows are the same rows — `@lautstark/design/collections`, with `.collections__*`
in components.css (conventions.md §5, 5b). What each bullet above has lost:

- **mitreden's chip row is gone entirely.** `CHIP_CAP`, the dashed `.chip.fold`
  and the uppercase `.flabel` are not in the source any more. The Gruppen axis
  became the rail; the Stimmen axis was not moved but **deleted**, because every
  row already names the voice it was recorded in and a Sammlung is small enough
  to read (`src/ui/state.ts`). Search still ANDs on top of whichever Sammlungen
  are open, which is the one part of the sentence that survived the move.
- **The multi-select outlived the pills.** It is on the rail now, and it is not
  about arity — a mitreden sentence has been in exactly one Sammlung since
  2026-08-25 and the rail still takes Cmd or Ctrl for "and also this one",
  because the question is how many are *open* (conventions.md §4.2).
- **`.chip` itself survives, in one place and shared.** It is a components.css
  class, and mitreden's only remaining use is the row of language pills in the
  settings voice picker — a filter over a catalogue rather than over the
  library. The on-state moved with it: `aria-pressed="true"`, not `.chip.on`.
- **bildhaft's two nearest things are both gone.** `.list__item` survives only
  as a comment in `src/styles/app.css` explaining that the rows are not called
  that any more, and `.tag` went when the symbol sources became components.css
  panels whose heading carries the state — so the badge that pill was measured
  against no longer exists either.

### Dialogs and sheets

- **mitreden.** Native `<dialog class="sheet">` opened with `showModal()`. Radius
  16px, `--panel` fill, `--line` border, padding 24px, `max-width: 520px`,
  `::backdrop` `rgba(0,0,0,.6)`. Free browser behaviour: focus trap, Escape, inert
  background. One instance exists — settings — and it closes with a plain
  `Schließen` button in a `.row`.
- **bildhaft.** Hand-built `.overlay` (fixed, grid-centred, `rgba(22,20,17,.38)` +
  `backdrop-filter: blur(3px)`) wrapping a `.dialog` with radius 18px, `--bg` fill,
  `--shadow`, `max-height: min(88vh, 800px)`, and three regions: `.dialog__head`
  (title + ✕), `.dialog__body` (scrolls), `.dialog__foot` (border-top, a `.spacer`
  that pushes buttons right). Escape and click-outside are wired by hand; focus is
  moved into the dialog on mount. Four instances: settings, print, symbol picker,
  confirm.
- **Distance: medium.** Same silhouette, different plumbing and a different backdrop
  weight (.6 opaque versus .38 + blur). The head/body/foot split is bildhaft's and
  is genuinely better once a dialog has more than one action; mitreden's settings
  sheet has one and does not need it yet.
- **Since:** bildhaft's hand-built `.overlay` is gone — it is a native `<dialog>`
  shown with `showModal()`, like the other two, and the four things it could not
  hand-roll are why. The head/body/foot split went into `components.css`, and the
  behaviour underneath went into `@lautstark/design/dialog` at v1.12.0 with
  bildhaft's as the base. All three now open the same sheet and ask the same
  question through it. mitreden's half of the bullet moved too: "one instance
  exists — settings" is three or four, depending on how the shared confirm is
  counted (settings, the setup sheet, the info sheets behind the footer links,
  and `confirmDialog()`), and the head/body/foot split it "does not need yet" is
  the one it uses — `.sheet .body` is a shared region rule that reaches into
  it.

One defect here is worth naming because sighted review cannot see it: bildhaft's
dialogs carried **two buttons with the same accessible name** — the close ✕ and a
footer „Schließen" — which is ambiguous to anyone navigating by name. The ✕ is now
„Dialog schließen". Any dialog with both a corner dismiss and a footer dismiss has
this.

### Overflow (`⋯`) menus

The closest agreement in the entire comparison — and, because of that, the first
thing extracted: the behaviour is `@lautstark/design/menu` since v1.11.0 and all
three import it, so the two columns below are one implementation now. Side by
side, as they were:

| | mitreden `.menu` | bildhaft `.menu__pop` |
| --- | --- | --- |
| position | `absolute; right: 0; top: calc(100% + 6px)` | `absolute; right: 0; top: calc(100% + 6px)` |
| z-index | 10 | 30 |
| min-width | 200px | 190px |
| padding | 6px | 5px |
| radius | 11px | 9px (`--radius-sm`) |
| fill | `--panel` + `--line` border | `--surface` + `--line` outline |
| shadow | `0 14px 34px rgba(0,0,0,.5)` | `--shadow` |
| item | 14px, weight 500, left-aligned, nowrap, radius 7px, padding `9px 11px` | 14px, left-aligned, nowrap, radius 7px, padding `8px 11px` |
| danger item | `--danger` text, `rgba(229,72,77,.12)` hover | `--danger` text, `--danger-soft` hover |
| dismiss | outside click + Escape (document listeners) | outside mousedown + Escape (document listeners) |
| trigger | `⋮` text glyph in a `.dots` button | horizontal three-circle SVG in `.btn--quiet.btn--icon` |
| roles | `aria-haspopup="true"`, `aria-expanded` | `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`menuitem` |

They differ by one character of glyph, 10px of width, 2px of radius and an ARIA
role. This pattern is effectively already shared and only needs writing down.

The ARIA row is settled as of design v1.10.0, and it took longer than the table
suggests. Writing the drawing down did not write the behaviour down: all three
products kept their own copy of the open/close code, vorlaut fixed the roles and
the focus in its copy, and the fix never travelled — so mitreden opened a menu
and left focus on the trigger, which is the one arrangement under which a menu
is open to a reader and to nobody else. The agreed answer is
`aria-haspopup="menu"` on the trigger, `role="menu"` on the popup, `menuitem`
on a command and `menuitemradio` with `aria-checked` on an alternative, focus
into the first enabled row on open, arrows and Home/End to walk, and Escape to
close and hand focus back. components.css carries the half that is drawing and
names the other half in its margin.

mitreden does one thing bildhaft does not: a **second level in the same popup** —
"Stimme ändern" replaces the menu's contents with the voice list rather than opening
a submenu, on the reasoning that seventeen voices have no place in a bar but are
fine in a list you opened on purpose. That is a good rule and belongs in the shared
set.

**It never got there, and its one implementation is gone (2026-08-25).** No
product does this today and `@lautstark/design/menu` has no API for it. What
removed it was not a menu decision: a voice stopped being a property of a
sentence when it became a property of the Sammlung (§3.1, conventions.md §3.10),
so there is no voice list to open from a row. mitreden's row menu is now
downloads, *record again* where a recording is missing, and delete. The rule is
worth keeping as a rule — a list you opened on purpose is a fine place for
seventeen of something — but it is a recommendation with nothing behind it
rather than a pattern one product already proved. The table above is one
character out of date as well: mitreden's trigger is `⋯`, which is what §3.6
asked for.

### List rows

- **mitreden.** `.item`: a flex row, `padding: 15px 2px`, separated by a 1px
  `--line-soft` bottom border — no card, no fill. Contents: checkbox, a `.txt`
  column (18px sentence + a `.meta` line carrying a status dot, a state word, and
  clickable group tags), an `<audio>` element filtered to look dark, and the `⋮`.
  Under 720px the row wraps and the player takes its own line.
- **bildhaft.** `.row`: an `<article>` card, `--surface` fill, `--radius` 14px,
  `outline: 1px solid var(--line)`, 10px apart in a flex column. Head row is the
  sentence in `--text-dim` plus `.row__actions` that are **`opacity: 0` until the
  row is hovered or focused within**. Body is the wrapping slot strip.
- **Distance: medium-large.** Separator-rows versus cards, and per-row actions
  always visible versus revealed on hover. mitreden's choice is right for a list
  that is 200 rows long and scanned; bildhaft's is right for a list of a dozen rows
  that are each worked on. Note that bildhaft's hover-reveal is a desktop assumption
  it can afford (README: "Desktop is the primary target") and mitreden cannot —
  mitreden's README actively sells adding sentences from a phone.
- **Since:** bildhaft's half is unchanged — `.row__actions` is still `opacity: 0`
  until hover or `:focus-within`, and the distance argument still holds. Three
  things went from mitreden's row: the checkbox (nothing draws one; two rules in
  `app.css` still style it), the clickable group tags in `.meta` (a row does not
  name its Sammlung — the rail says which one you are in), and the `⋮`, which is
  `⋯`. One thing arrived: the sentence is click-to-edit in place, which is where
  the `prompt()` under *Confirmations* went.

### Empty states

- **mitreden.** `.empty` — left-aligned, `--muted`, 15px, `32px 2px` padding. Two
  texts: `empty_start` ("Noch nichts da. Mehrere Zeilen auf einmal gehen auch — jede
  Zeile wird ein eigener Satz.") teaches the input format; `empty_no_match` ("Kein
  Satz passt.") is the filtered case.
- **bildhaft.** `.empty-state` — centred, `--text-faint`, `40px 20px`. One text:
  "Tippe oben einen Satz und drücke `<kbd>Enter</kbd>`." Also teaches the input
  gesture. The search-empty case is a separate inline "Nichts gefunden."
- **Distance: small.** Same instinct — an empty state teaches the one thing the user
  does not yet know — and both distinguish "nothing yet" from "nothing matched".
  Only alignment and colour depth differ.
- **Since:** `.empty-state` is `.empty`, from components.css, and both products
  draw that one class. The texts converged further than the audit expected:
  mitreden's `empty_start` no longer teaches the multi-line format, it teaches
  the gesture — "Tippe oben einen Satz und drücke `<kbd>Enter</kbd>`", which is
  bildhaft's sentence, because mitreden's composer now takes Enter the way
  bildhaft's does. `empty_no_match` still separates the filtered case, and
  bildhaft gained a bold "Noch keine Sätze" over its line. How many empty states
  each product has is conventions.md §4.6, and that is the part that did not
  converge.

### Status and toast

- **mitreden.** `.status` — an inline paragraph directly under the input box, 14px
  `--muted`, `hidden` when empty so it reserves no space. It **persists** until the
  next message. Everything speaks through it: "Wird aufgenommen …", "3 hinzugefügt,
  3 aufgenommen", "Fehlgeschlagen: …". It is both the progress indicator and the
  error channel.
- **bildhaft.** `.toast` — fixed, bottom-centre, pill, inverted (`--text` fill,
  `--bg` text), `role="status"`, cleared after 3200ms. Progress is a separate
  `.spinner` inside the button that caused it.
- **Distance: large, and the two are not interchangeable.** A toast that disappears
  after 3.2 s is wrong for mitreden's long messages ("3 hinzugefügt, 3 aufgenommen,
  1 gab es schon. 1 konnte nicht aufgenommen werden: …") and wrong for a failure the
  user may need to read twice. An inline line anchored to the input is wrong for
  bildhaft, whose actions happen in dialogs far from any one anchor. The shared rule
  should be about *kinds of message*, not about the furniture — see §4.

### Confirmations and prompts

- **mitreden.** Native `window.confirm()` for every destructive action and native
  `window.prompt()` for **editing** — changing a sentence's text, setting its
  groups, bulk-adding or bulk-removing groups. The prompt strings are carefully
  written (`ask_edit_text` even explains that the id and therefore the file name
  stays put) but they render in the browser's own chrome, which no token reaches.
- **bildhaft.** A `Confirm` component built on `Dialog`, with a title, a body that
  names the thing and counts what is lost ("„Der Grüffelo“ und alle 12 enthaltenen
  Zeilen …"), and a confirm button **labelled with the action** ("12 Zeilen
  löschen") rather than "OK". Editing is done in place — the collection title is a
  click-to-edit input, symbols are swapped in a picker dialog.
- **Distance: the largest interaction gap in the two products.** It is also the one
  place where mitreden's constraint bites hardest: a styled confirm dialog is real
  hand-written JS in a no-build file, and native `confirm`/`prompt` cost nothing and
  never break. See §5 for how I would split this.
- **Since:** the constraint went with the rewrite, and so did the gap. mitreden's
  three `confirm()` calls are `confirmDialog()` from
  `@lautstark/design/dialog`, and each grew the three parts a sheet has — a
  title that asks, a body that names the thing and counts what goes, a button
  labelled with the act. The claim about `prompt()` for editing was true of the
  `ui.html` mitreden and is not true of any version since: editing a sentence
  and renaming a Sammlung both happen in place, in the field showing the value.

### Footers

- **mitreden.** The interface has **no footer**. The landing page (`docs/index.html`)
  has one: `--muted`, 14px, `border-top: 1px solid var(--line)`, licence + GitHub
  link.
- **bildhaft.** The app has one, deliberately: `.footer`, 11.5px, `--text-faint`,
  centred in the same 840px column, carrying the ARASAAC attribution (a licence
  requirement) plus "Läuft vollständig im Browser."
- **Distance: not comparable.** bildhaft's footer exists because a licence demands
  it. mitreden has no attribution obligation in the interface. A footer added to
  mitreden purely for symmetry would be furniture; the one line it might honestly
  carry is the same reassurance bildhaft ends on — that nothing leaves the machine.
- **Since:** mitreden has one. Not for symmetry: the rewrite made it a published
  website, which owes an Impressum and a Datenschutz reachable from every
  screen, and a footer is where those live. All three carry the same row now.

---

### Patterns bildhaft has that this audit predates

Four components arrived in bildhaft after §2 was written. None has a mitreden
counterpart today, so there is nothing to converge yet — they are recorded so the
audit is not silently out of date, and because two of them encode rules §4.3 now
states.

**Two of the four have a mitreden side now (read 2026-08-25).** The first has a
counterpart: below 820px mitreden's rail is a panel that slides over the work
behind a `.scrim`, opened from a control that is not conditional on the state it
toggles — the lesson rather than a copy of the markup. The second is the other
way round. mitreden's document scrolls rather than nesting a full-height
container, so the failure that bullet describes cannot reach it, but the
`backdrop-filter: blur(3px)` it names as the second cause of black repaints is
on `.sheet::backdrop` in `app.css`. And the fourth is worth a look for the
reason the bullet gives: mitreden versions a client-side database, has just
carried one across four upgrades, and calls `openDB` with no `blocked` handler —
which is the "UI hanging with no explanation" this was written down for.

- **A mobile top bar and an off-canvas navigation panel.** Below 820px the sidebar
  is a fixed panel that slides over the content behind a scrim, opened from a
  sticky opaque header. It replaced a `display: none` sidebar whose only opener was
  rendered when the sidebar was already open — so on a phone it could not be
  reached at all. Two lessons generalise: a navigation control must not be
  conditional on the state it toggles, and a persisted desktop preference should
  not decide what a phone does on load.
- **Document-level scrolling on small screens.** bildhaft had a nested full-height
  scroll container (`html`/`body`/`#root` at 100% → an inner `overflow-y: auto`).
  Mobile browsers resize the viewport under such a container whenever the URL bar
  or keyboard appears, which produced blank and black repaints. On mobile the
  document scrolls, heights use `dvh`, and `backdrop-filter` — a second known cause
  of black compositing artefacts — is dropped.
- **A failed-symbol tile.** Every path that could not produce an image URL used to
  render the same spinner, so a permanent failure was indistinguishable from work
  in progress. Resolution now reports loading, ready and error separately, with a
  timeout, and a failed symbol offers a retry. The rule: a loading state must be
  able to end.
- **An `alert` banner.** Used for one condition — another tab holding an older
  IndexedDB version, which blocks an upgrade indefinitely and stalls every read
  behind it. Worth knowing about for any product that versions a client-side
  database: without a `blocked` handler this presents as the UI hanging with no
  explanation.

---

## 3. Concept and vocabulary glossary

This matters at least as much as the pixels. Two products that use different words
for the same thing do not feel like siblings no matter how well the colours match.

### 3.1 The grouping: Gruppe or Sammlung

**The data models are already the same idea.** bildhaft's README states it outright:
"The unit of reuse is the sentence, not the collection. Collections are just a
grouping over them." Its `Sentence` rows are first-class, keyed by
`normalizedInput`, and search is flat across all of them. mitreden is built the same
way: `phrases.json` is a flat list, `tags` is a field on the sentence, search runs
over text *and* group names at once, and a group that loses its last sentence simply
stops existing (`ui.html` prunes `TAGS` on every load).

There is one real difference: **arity**. In mitreden a sentence carries a list of
tags and can be in several groups at once, and the chips combine with OR. In
bildhaft `Sentence.collectionId` is a single string, so a sentence is in exactly one
collection and the sidebar single-selects to match.

**Decided: `Sammlung`. Arity is per product — many-to-many where the model
allows it.**

*The recommendation below was `Gruppe`; it was overruled. The reasoning is kept
because point 1 is a real collision and is still open.* Point 2 does not survive
scrutiny: a song sits in several playlists and a photo in several albums, and
nobody reads that as three copies. Point 1 is answered by renaming bildhaft's
symbol sets to **Symbolquellen** — not because that is the cheaper edit, but
because it is the right one: *Sammlung* should name one thing, and a symbol set
is a source you draw from rather than a grouping you put work into.

**Amended 2026-08-24, when vorlaut joined this concept.** This section used to
end "and a sentence can be in several. Both products change", making
many-to-many a family rule that bildhaft owed a migration on. Three products in,
that is wrong — not expensive, wrong. Arity is not a house style, it is a fact
about what a product holds:

- **mitreden: many.** A sentence genuinely belongs in the morning Sammlung and
  in the nursery one, and there is one recording behind both. Its sidebar
  multi-selects for exactly this reason.
- **bildhaft: one.** Whether a sentence should live in several was asked on its
  merits and answered no. A Sammlung there is a book or a topic — "Der
  Grüffelo" — and a line translated for one book is not thereby part of another.
  The unit-of-reuse principle argues for reusing the *translation*, which
  `findByNormalized` already does across every Sammlung, and not for the row
  appearing in two places at once.
- **vorlaut: one, necessarily.** A Sammlung there is a whole layout. It cannot
  be in two Sammlungen because it *is* the contents of one.

So the rule is: many-to-many where the model allows it, and the sidebar's
selection follows the arity rather than the other way round. See
[conventions.md §4.1](conventions.md).

**Amended again 2026-08-25, and this time mitreden moved.** Its `526905c` gave
the voice to the Sammlung and gave the sentence one Sammlung with it: a Sammlung
records in one voice, so a sentence in two of them has two answers to which
voice records it and no way to choose between them. Both halves of the rule
above are now wrong, and they are wrong in different ways.

- **mitreden: one.** The morning sentence and the nursery one are two sentences
  now, each with its own recording — two different sounds rather than one row
  seen twice, and a Sammlung is handed to a device as a set of files. Nothing
  was imposed from here: the product changed what it holds and the arity
  followed, which is what "a fact about what a product holds" looks like when it
  actually happens. With all three at one, the per-product framing is doing more
  work rather than less — three answers that agree, each reached separately.
- **The sidebar's selection never followed the arity.** Multi-select is about
  how many Sammlungen may be *open at once*, which is a different question from
  how many one sentence may be *in*. mitreden's arity went to one and its rail
  multi-selects exactly as before. [conventions.md §4.2](conventions.md) carries
  the corrected version.

Two things this section says about mitreden in the present tense are
archaeology: `phrases.json`, the flat file with a `tags` field, has been an
IndexedDB store with one `collection` field for some time, and the chip row is a
rail. Neither the original argument nor this amendment rests on them.

The superseded argument below stays where it is, with one note. Point 2 rejected
*Sammlung* because "Dieser Satz ist in drei Sammlungen" reads as if three copies
exist. In mitreden three copies now do exist, on purpose — three rows and three
recordings, because they are three different sounds. The decision is unchanged
and this does not reopen it; the objection turned out to describe a model rather
than to misread a word.

The superseded argument:

Reasons, in order of weight:

1. **"Sammlung" is already taken in bildhaft's own vocabulary.** Its README calls
   METACOM "eine kommerzielle Symbolsammlung", and its settings dialog talks about
   choosing between symbol sources. A user reading "Sammlung" in the sidebar and
   "Symbolsammlung" in the settings is reading one word for two unrelated things.
   `Gruppe` collides with nothing in either product.
2. **"Gruppe" survives both arities; "Sammlung" does not.** "Dieser Satz ist in drei
   Gruppen" is ordinary German. "Dieser Satz ist in drei Sammlungen" reads as if
   three copies exist — a *Sammlung* is a container you are inside, a *Gruppe* is a
   label you carry. If bildhaft ever relaxes to many-to-many (and its own "the
   sentence is the unit" principle points that way), `Gruppe` already fits.
3. **The change is cheap in the direction it falls.** mitreden would have to rename
   a persisted field (`tags`), a CLI flag (`--tags`), a JSON key documented in the
   README, and ~15 strings in two language files. bildhaft has to rename German
   labels where they are used — `Sammlungen`, `+ Neue Sammlung`, `Name der Sammlung`,
   `Sammlung exportieren`, `Sammlung löschen`, and a handful of confirmation bodies.
   Its *code* keeps `Collection` and `collectionId`, because bildhaft's code is
   English by policy, exactly like mitreden's. Nothing persisted moves, and the
   export format string `bildhaft.collection` is internal and stays.

I want to be honest that this is the recommendation I hold least firmly.
"Sammlung" is the warmer word and it is the one that fits "Der Grüffelo". If the
author prefers it, the collision in point 1 is the thing that would have to be
solved first — probably by renaming bildhaft's *symbol sources* rather than its
groupings.

**Settled, and the word is now spent.** bildhaft uses *Sammlung* for the grouping
throughout its interface, so the word is claimed and cannot be borrowed back for
anything else in these products. That includes the obvious temptation: the family
of tools itself. Writing "Werkzeuge derselben Sammlung" in bildhaft's about text
put the same word on a group of sentences and a group of programs on one screen,
which is how the collision arrives in practice rather than in theory. The family
has a name already — Lautstark — and prose that needs to point at it should say
that, or say "die übrigen Werkzeuge". The symbol sets remain the other pressure on
this word; point 1's suggestion of *Symbolquelle* still stands and would leave
*Sammlung* doing exactly one job.

### 3.2 The thing being grouped

| | mitreden | bildhaft |
| --- | --- | --- |
| in the composer | „Neue Sätze, einer pro Zeile" | „Satz eingeben …", button „Übersetzen" |
| in search | „Sätze und Gruppen durchsuchen…" | „Alle Sätze durchsuchen …" |
| in counts | „{n} Sätze", „{n} von {all} Sätzen" | „12 Zeilen" |
| when deleting | „Satz löschen", „{n} Sätze löschen" | „Zeile löschen", „12 Zeilen löschen" |
| on import | — | „14 Zeilen importiert" |

**Recommendation: `Satz` everywhere. bildhaft changes.** bildhaft says *Satz* when
you are writing one and *Zeile* when you are counting them, which is a seam a user
can feel. `Zeile` is a print artefact — a row on a sentence strip — and it leaks a
rendering concept into the data. bildhaft's own type is `Sentence`. mitreden already
says `Satz` in all five places and needs no change.

### 3.3 Backup, export, download

Three different acts that both products currently blur.

| act | mitreden today | bildhaft today |
| --- | --- | --- |
| get the produced artefact out | „Als MP3 herunterladen" / „Als WAV herunterladen"; ZIP named `mitreden-{n}-{fmt}.zip` | „Drucken" (browser print, no file) |
| hand a subset to someone | „Sammlung exportieren" in the ⋯ beside the name; file `mitreden-{name}.json` | „Sammlung exportieren"; file `bildhaft-{name}-{stamp}.json` |
| protect against total loss | not in the interface at all; README says back up `phrases.json` yourself | „Sicherung" — Einstellungen → Daten → „Alles exportieren" |

**Recommended rule, three words, no overlap:**

- **Herunterladen** — the produced artefact leaves in the format a device wants (an
  MP3, a ZIP of them). It is not a backup and cannot be read back in.
- **Exportieren** — a *part* of the library leaves as data that the same product can
  read back. Names the part: „Gruppe exportieren".
- **Sicherung** — *everything* leaves as one file, for the case where the storage is
  gone. Never a subset, never a format conversion.

mitreden's current wording already obeys this: „herunterladen" for audio is exactly
right, and its CLI `export` is exactly the middle case. What it lacks is the third
word — there is no **Sicherung** in the interface, only a paragraph in the README
telling you to copy `phrases.json`. bildhaft calls the same act „Sicherung" in prose
but labels the button „Alles exportieren", which crosses the middle and the outer
case. Both would move slightly: bildhaft relabels one button, mitreden gains a
concept it does not have. Both filename conventions already agree —
`<produkt>-<was>-…` — and that convention should be written down.

#### The standing Sicherung

There is now a fourth thing, and it is a **Sicherung that keeps itself**: a
folder chosen once, written to unattended from then on, via
`@lautstark/sicherung`. It is not a fifth word — it is the same act as
„Sicherung", with the manual step removed — so it takes the same word and does
not get one of its own.

Two things follow, and both are why it is written down here rather than left to
each product.

**It is an addition, never a replacement.** The folder picker exists only on
Chromium on the desktop; `showDirectoryPicker` is absent from Safari and
Firefox everywhere, and from every browser on Android. The one-file
„Sicherung" download stays exactly where it is in all three products, and the
folder block appears above it only where the browser has the picker. A tablet
must never be shown a backup story it cannot have.

**The state is a sentence, and it always carries the age.** §3.4 already asks a
settings block to state its status in a sentence before it offers a control;
this is that rule in the one place where the status can change while nobody is
looking. The `.standing` component carries it. All three products say the same
five things, so that a carer who has seen one has seen them all:

| state | German |
| --- | --- |
| `off` | „Noch kein Ordner gewählt." |
| `idle` | „Ordner „«name»" · gesichert «vor 3 Minuten»" |
| `saving` | „Wird gesichert …" |
| `needs-permission` | „Zugriff auf „«name»" muss bestätigt werden — zuletzt gesichert «vor 11 Tagen»." |
| `failed` | „Sicherung fehlgeschlagen: «grund» — zuletzt gesichert «vor 11 Tagen»." |

The age is not decoration and is not optional. „Es funktioniert nicht" is a
sentence somebody can put off; „seit elf Tagen nichts gesichert" is not. The
two states that mean *nothing is being written* must both carry it, which is
why neither is allowed to degrade to a bare error string.

The filenames follow the convention above unchanged: `<produkt>-aktuell.json`
for the current copy, `<produkt>-<datum>.json` for the dated ones.

### 3.4 Settings

Both say **Einstellungen**, so the word is settled. The placement is not: mitreden
puts a `⚙` next to the title, on the reasoning it wrote down at the time that "beside
the title is where a page-wide setting belongs — not down at the list, which would
suggest it changes something about the list." bildhaft puts a text button
„Einstellungen" at the bottom of the sidebar.

**Decided 2026-08-24: the foot of the sidebar, and mitreden moves.** This is the
one rule in this document that is arbitrary and should say so. mitreden's
reasoning is good and bildhaft's placement is deliberate, and neither is wrong;
what is wrong is three products with two answers. The foot wins because two of
the three are already there, because a sidebar that ends in the way out of the
page reads the same in all three, and because the objection it has to answer —
"down at the list suggests it changes the list" — is answered by the separator
and the gap that already sit above it.

Inside, both organise the same way — a card or block per external thing you can
switch on, with its current state stated in words before any control ("Schlüssel ist
gesetzt" / „Ordner „METACOM" · 1284 Bilddateien indiziert"). That is already a
shared pattern and deserves to be a rule: **a settings block states its status in a
sentence before it offers a control.**

### 3.5 No save button

bildhaft states the principle in code and README: "Storage is IndexedDB, saved
automatically on every change. There is no save button." It goes to some trouble to
keep it — the collection title is debounced 400 ms *and* flushed on blur, precisely
so that closing the tab mid-rename does not lose the name.

mitreden holds the same principle without stating it. Adding a sentence records it
immediately; changing a text re-records immediately; picking a voice, ticking a
chip, changing the language all persist as they happen. Its own comments make the
point in a related form: "A sheet, not a wizard: a fresh install already speaks."

Both have **exactly one exception, and it is the same exception**: a settings field
whose half-typed value would be actively harmful. mitreden's API key has a
„Speichern"; bildhaft's function-word list has a „Speichern". Neither is an
oversight. So the rule to write down is not "never a save button" but:

> Everything is saved as it is done. The only place a save button is allowed is a
> settings field where a partial value would do something wrong — half an API key,
> half a word list. Wherever one exists, its scope is one field, never a screen.

One screen in the family does have one, and it is not an oversight:
conventions.md §4.7 records why Wochenwerk's appointment sheet holds its writes
until a button, and what would have to be true of a screen before that argument
reached it.

### 3.6 Summary table

Three rows were amended on 2026-08-24, when vorlaut joined the concept and the
recommendations were re-read against three products rather than two: arity
(§3.1), the selection that follows from it, and where Einstellungen lives. The
build-side rules that grew out of the same reading are in
[conventions.md](conventions.md).

Two of those three moved again on 2026-08-25: mitreden's arity is one (§3.1),
and the selection follows nothing about arity — it follows how many Sammlungen
are open at once ([conventions.md §4.2](conventions.md)). A "today" column is as
of the last date beside its row, not as of reading.

| concept | mitreden today | bildhaft today | recommended | who moves |
| --- | --- | --- | --- | --- |
| a stored utterance | Satz | Satz / Zeile | **Satz** | bildhaft |
| light or dark | dark only | light-first, dark supported | **both, in both** | mitreden — done |
| a named grouping of them | Gruppe / `tags` | Sammlung | **Sammlung** / `collections` | mitreden |
| can it be in several at once | no, since 2026-08-25 | no | **per product — many where the model allows; all three currently one** (§3.1) | nobody |
| making a grouping current | sidebar, multi-selecting | sidebar selection | **sidebar; multi-select only where several can be open at once** (§4.2) | both — done, mitreden 2026-08-24 |
| the produced artefact leaving | herunterladen | drucken | **herunterladen** | neither |
| a subset leaving as data | export (CLI only) | „Sammlung exportieren" (in the ⋯ menu beside the name) | **Sammlung exportieren** | mitreden |
| everything leaving as data | — | „Alles exportieren" (called Sicherung in prose) | **Sicherung** | both |
| the symbol sets bildhaft draws from | — | Symbolsammlung | **Symbolquelle**, to free *Sammlung* | bildhaft |
| the settings surface | Einstellungen (⚙ beside title) | Einstellungen (sidebar foot) | **Einstellungen, at the foot of the sidebar** | mitreden |
| more actions on a thing | ⋮ | ⋯ | one glyph, pick **⋯** | mitreden (one character) |
| a destructive confirmation | native confirm, „OK" | dialog, button named for the act and counting what goes | **name the act on the button** | mitreden |
| saving | implicit | implicit, stated | **implicit, stated, one exception** | mitreden states it |

---

## 4. The shared design language

What follows is the deliverable: named tokens and rules concrete enough to be
implemented independently, in whatever each product is built out of — which at
the time of writing was a React app with a build step and a single
dependency-free HTML file, and is now three Vite-built TypeScript sites. That
they could be implemented independently is the point, and it is what made
sharing them later a decision rather than a necessity.

### 4.1 The mark

One SVG path, one face, `viewBox="0 0 512 512"`. Both products already carry the
identical geometry; that is the anchor and it must not drift. The rule around it:

- The bubble is filled with the product's **`--accent`**. The eyes and the smile are
  always white — not `--surface`, not `--bg`, plain `#fff` — so the mark survives
  being printed, favicon'd, or dropped on any ground.
- **One accent hue per product, and it is the product's identity.** mitreden is pink
  `#ff8bc7`; bildhaft is orange `#ff6b35`. These must *not* converge. The family
  resemblance is carried by the shape and by every other token; the accent is what
  tells the two apart at a glance, and a sibling product that ever joins takes a
  third hue.
- The mark is never recoloured for a state, never animated, never outlined.
- The wordmark is set in the interface font, lowercase, tight tracking (−.02em to
  −.035em), and sits immediately right of the mark with a gap of roughly a third of
  the mark's width.

### 4.2 Tokens

Names are normative; **values are per product**. A product implements this table
however its stack prefers — CSS custom properties in both cases today, which both
already use.

**Ground and surfaces**

| token | meaning |
| --- | --- |
| `--bg` | the page itself. The furthest-back plane. |
| `--surface` | a raised plane sitting on `--bg`: a card, a sheet, a popup. |
| `--surface-2` | a plane sitting on `--surface`: a quiet button's fill, a field's fill, a code block. |
| `--surface-3` | `--surface-2` under the pointer. Never used at rest. |
| `--line` | the hairline that separates two planes of the same value. |

mitreden's current `--ink`/`--panel` map onto `--bg`/`--surface` exactly.
`--line-soft` is doing `--surface-2`'s job in some places and a lighter `--line`'s
job in others, and should split.

**Text**

| token | meaning |
| --- | --- |
| `--text` | what you read. |
| `--text-dim` | labels, captions, states, counts. Legible, secondary. |
| `--text-faint` | placeholders, attributions, the small print. Must still clear AA. |

mitreden's `--muted` is `--text-dim`; it has no `--text-faint` and hard-codes one
(`#4d5464`) for placeholders.

**Accent and states**

| token | meaning |
| --- | --- |
| `--accent` | the brand fill. The one saturated colour on the screen. |
| `--accent-ink` | text placed **on** `--accent`. Must clear 4.5:1 against it. |
| `--accent-strong` | the accent adjusted so it is legible **as text on `--bg`**. On a dark ground it may equal `--accent`; on a light one it must be darkened. |
| `--accent-soft` | an accent-tinted plane: the current item, an accent notice. |
| `--accent-hover` | the accent under the pointer. An explicit value, **not** `filter: brightness()` — that shifts hue on a saturated accent, and it cannot darken on a light ground, which is the direction a light scheme needs. |
| `--danger` | the destructive colour, as text and as a fill. |
| `--danger-ink` | text placed **on** `--danger`. Exists for the same reason `--accent-ink` does, and is the token most likely to be missed: a filled destructive button is usually built once, in whichever scheme its author was looking at, with `color: #fff` hardcoded. That survives a dark `--danger` on a light ground and fails a light one on a dark ground. bildhaft shipped exactly that — white on salmon, 2.48:1, on the button that deletes everything — and it was invisible in every screenshot because the button was only ever viewed in light mode. If a product has a filled destructive control and two schemes, it needs this token. |
| `--danger-soft` | a danger-tinted plane: the hover behind a destructive menu item. |
| `--danger` | destructive. Text colour, not a fill, except on a filled confirm button. |
| `--danger-soft` | a danger-tinted plane: the hover behind a destructive menu item. |
| `--ok` | a thing succeeded and stays succeeded. |
| `--warn` | a thing is out of date but not broken. |
| `--miss` | a thing was never made. Reads as absence, not as failure — it is not red. |

`--ok`/`--warn`/`--miss` are **optional**: a product declares them only if it
actually tracks per-item state. mitreden does (recorded / changed since recording /
not recorded yet); bildhaft does not, because what it generates counts as accepted.
A product that adds such a state later must use these three names and this meaning
rather than inventing its own.

**Shape and motion**

Radii follow the same rule as colour: **the names are normative, the values are
per product, and so is adoption.** The values below are bildhaft's, given as a
worked example rather than as a target.

This is not a licence to diverge for its own sake — it is an admission that the
four names do not fit every product's existing geometry. mitreden has five
distinct radii in use (999px, 16px, 11px, 10px, 9px, 7px) against these four
names. `--radius-pill` maps cleanly onto its four 999px uses; the rest do not,
and adopting `--radius`/`--radius-sm` would mean choosing which of 10, 11 or
16px becomes which. That is a change to how the product looks, arriving through
a renaming exercise, and it is worse than a row left honestly unimplemented.

So: implement the names you can map, leave the ones you cannot, and say which
is which. bildhaft implements all four because its geometry already matched
them. mitreden implements none of them yet. Both statements are true, and a
table that says "14px" for both would make one of them false.

| token | meaning | bildhaft |
| --- | --- | --- |
| `--radius` | cards, sheets, rows, the composer. | 14px |
| `--radius-sm` | fields, buttons, popups, menu shells. | 9px |
| `--radius-pill` | chips, icon buttons, toasts, anything whose height sets its shape. | 999px |
| `--radius-item` | a row inside a popup. | 7px |
| `--shadow-sm` | 1px offset, 2px blur, very low alpha | a plane that has only just left the page. |
| `--shadow` | a 2/6 pair plus a 12/32 pair | a plane that floats: popup, dialog. |
| `--font` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | **identical string in both products.** |
| `--mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | ids, keys, formats. |

No webfont, ever. No CDN, ever. The system stack is the shared rule and it is
already true on both sides; the string should simply be made identical.

Motion, where a product has any: **130ms ease** for a colour or fill change, **220ms
ease** for something that changes size or position, nothing else. Both values behind
`@media (prefers-reduced-motion: reduce)`, which clamps them to nothing. A product
with no transitions at all — mitreden today — is compliant; it must simply not
invent a third duration when it adds one.

**Spacing.** A 2px base, used at 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40. This is
descriptive, not aspirational — it is what both files already do — but writing it
down stops the next value being 13.

**Reading column.** Content sits in one centred column of **720–840px**. Text you
read runs at 15–16px with line-height 1.55. The sentence you are composing is set
larger than everything else on the page (19–22px), because it is the point.

> **Check the pairs, do not look at them.** Every foreground/background
> combination the stylesheet can produce — including hover states, which no
> screenshot shows — should be run through a WCAG contrast check per scheme,
> and any failure solved numerically along the same hue rather than nudged by
> eye. Doing this cost mitreden six failing pairs on its first light palette
> and caught bildhaft an unreadable delete button. Values borrowed from the
> sibling product must be re-checked against the borrowing product's own
> grounds: `--text-faint` passed in mitreden and failed in bildhaft on the
> identically-named `--surface-2`, because the two grounds are near but not
> equal.

### 4.3 Rules

**Focus.** One rule, one appearance, everywhere:
`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`. Never
removed, never replaced by a border change alone. Both products already do exactly
this; mitreden should collapse its four selectors into the one.

**Hover.** A hoverable surface goes up one step: transparent → `--surface-2`,
`--surface-2` → `--surface-3`. A quiet control's *text* goes `--text-dim` →
`--text`. Never a border colour change alone; never a size change.

**Accent tint means "this one".** `--accent-soft` background plus `--accent-strong`
text plus weight 600 marks the current group, the current source, the chosen symbol.
A full `--accent` fill is reserved for one thing per screen: the primary action.
(mitreden currently uses the full fill for both the primary button *and* an active
chip, which is why two very different things shout equally loudly.)

**Buttons: three tiers, no more.** *Primary* — `--accent` fill, `--accent-ink` text,
weight 600, one per view. *Normal* — `--surface-2` fill, `--text`. *Quiet* —
transparent, `--text-dim`, hovering to `--surface-2` and `--text`. Destructive is
not a fourth tier but a colour applied to a quiet or normal button (`--danger` text,
`--danger-soft` hover); only the confirm button of a destructive dialog is filled.
An icon-only button is a normal or quiet button at pill radius with equal padding.
Whether the family is bordered rectangles or borderless pills is a **per-product
choice** — but a product picks one and applies it to every button it has, including
the gear and the ⋯.

**Fields.** A field is a fill, not a hole. At rest, `--surface-2` with a transparent
border. On focus the fill lifts to `--surface`, the border takes `--accent`, and the
focus ring appears. Placeholder is `--text-faint`. `font: inherit`, always — a
sentence typed into the product must look like the same sentence when it is read
back out of the list.

**Chips.** Pill radius, `--text-dim` on transparent, with an optional count in
tabular numerals — at full opacity, a correction to the `.55` this rule first
named: fading a token re-breaks the contrast it was solved for, and the faded
count measured 2.91:1 over `--accent-soft` in the product that checked. Selected takes the accent
tint. A chip is a **filter**: it changes what is shown and never what is stored.
This is mitreden's rule, written in as many words in the `ui.html` it came from
— *filters are pills, actions are boxes* — and it should hold in all three.

**The overflow menu.** One pattern, already near-identical: anchored under its
trigger with a 6px gap and right-aligned to it, min-width 190–200px, `--surface`
plane, `--shadow`, `--radius-sm` shell, 5–6px padding, `--radius-item` rows at 14px
left-aligned and nowrapped. Destructive rows sit last, in `--danger`, over
`--danger-soft` on hover. It closes on outside click and on Escape. The trigger is
an icon button carrying `aria-haspopup` and a live `aria-expanded`; the popup
carries `role="menu"` and its rows `role="menuitem"`.

Plus mitreden's own good rule, promoted: **a long list of choices replaces the
menu's contents rather than opening a submenu.** Seventeen voices, or forty
groups, have no place in a bar, but they are fine in a list you opened on purpose.

**A row's actions live in the menu, not in the row.** A row shows its content and
one `⋯`. What it shows *about* itself — a state, a count, its groups — may be
clickable, but everything you can *do* to it is behind the one trigger. This keeps a
row from growing a new control every time the product grows a feature, and it means
one place to look. Actions must not be hidden behind hover: a touch screen has no
hover, and both products are used on one.

**Bulk actions appear only when something is selected**, in a box that is visibly
not a filter row, and their labels name the count they will act on.

**Destructive confirmations name what is lost and label the button with the act.**
Never "OK". „12 Sätze löschen", not „OK". The body states the count and what does
not come back. Where the product cannot style a dialog cheaply, a native
`confirm()` carrying the same *sentence* is acceptable — the wording is the rule,
the chrome is not.

**And it says how far it reaches, when that is further than here.** Added
2026-09-02. Every editor can keep its work in a folder, and where one does, a
deletion removes the files — so it removes them on every device the household
has. „Das lässt sich nicht rückgängig machen" is true of this browser and says
nothing about the tablet in the hallway. The three products that have the act now
answer `wipeReaches()`: *browser*, *folder*, or *unreachable*. The last is not a
warning but a refusal — with the folder out of reach a wipe empties this browser,
leaves the folder whole, and hands everything back on the next start, which is a
delete that reports success and undoes itself.

**One act per product may ask for a word to be typed, and no more.**
`confirmDialog`'s `requireTyping` disables the confirming button until the reader
types the word already printed on it — trimmed and case-folded, because somebody
typing what they were shown is the evidence being asked for and a capital letter
is not a second question. It is for the acts that reach past this browser and
cannot be undone: emptying a household's whole library, on every device they own.
**Spending it anywhere else is what breaks it.** Friction asked for on deleting
one row becomes a habit within a week, and a habit is not a check — the reader
types the word without reading the sentence, which is worse than the plain
confirmation it replaced.

**Messages.** Three kinds, three treatments:

- *Progress* — belongs to the control that started it: a spinner in the button, or a
  line anchored under the input. Disappears when the work does.
- *Outcome* — the sentence that says what happened, including what partly failed.
  Stays until something replaces it. Never auto-dismissed if it names a failure or
  reports a number the user might need. It **may carry a dismiss**, and the two are
  not the same thing: the bar is that the *product* may not clear the line on a
  timer, not that the *reader* may not close it once they have read it. "Stays
  until something replaces it" was written about a line reporting a refusal and is
  right about that one; applied to „Alltag zu Hause hinzugefügt." it left a
  sentence about last Tuesday at the top of the list, because nothing ever came to
  replace it. The ✕ is a quiet icon button inside the notice, not a control the
  notice owns — `components.css` has the one declaration it overrides, and why.
- *Aside* — a fire-and-forget acknowledgement of something that is already visible
  on screen ("Sicherung exportiert."). May be a toast that clears itself.

Both products may implement these differently — mitreden's persistent inline line is
correct for outcome, bildhaft's toast is correct for aside — but neither may use one
treatment for a kind it does not suit. bildhaft's 3.2 s toast currently carries
outcome messages that report counts; that is the mismatch on its side.

**Progress assumes a control that started it, and one screen has none.** The rule
above sends progress to "the button, or the input" because in all three products
something was pressed. vorlaut's Android viewer receiving a package over the LAN
has neither: the tablet is waiting on a network, and there is no originating
control to hang a spinner on. Its `Notice()` therefore carries a `busy` state —
an indeterminate ticker on the outcome plate, so one line says „wird empfangen …"
and then „empfangen", rather than a progress bar that exists for four seconds and
is never seen again.

That state is **deliberately vorlaut's and not the family's**, and this paragraph
is here so the next reader does not take the gap for an oversight. Two reasons.
It is a second *kind* of message on the outcome plate, which is a change to the
taxonomy above rather than a missing rule below it. And it would be the first
animation in `components.css`: §4.2 closes the motion budget at 130ms for colour
and 220ms for size or position, "nothing else", and an indeterminate loop is
neither — so it costs an amendment there too. Neither bildhaft nor mitreden has a
long operation that would spend it. If a second product grows one, that is the
evidence to reopen this with; one product is not.

**Empty states teach.** An empty list says the one thing the user does not yet know:
what to type, or how the input is read. A *filtered*-empty is a different, shorter
sentence and must never be confused with the first.

**Saving is implicit**, per §3.5.

**Counts are everywhere.** A group, a selection, a list, a search result: each says
how many, in tabular numerals, next to its name. Both products already do this; it
is one of the strongest existing family resemblances.

**Files that leave carry the product's name**: `mitreden-…`, `bildhaft-…`, followed
by what it is and, where a version matters, a date stamp.

**Prose that denies must also disclose.** A product that tells the reader what it
does not send has to say, in the same breath, what it does. Both of these shipped
in one week, from opposite directions. bildhaft's footer said it runs entirely in
the browser, which is true and let a reader conclude nothing leaves — a word goes
to ARASAAC on every lookup. mitreden's about said the voice is downloaded once and
then stays on the machine, every word true, and left the same conclusion standing
where "this is the one request we make" should have been. Neither was a false
claim. Each was a true claim occupying the place of a missing one, which is the
contrast rule above one level up: the value is fine and the pairing is what fails.

**Check it against the wire, not against the code.** Whether a claim like that is
still true cannot be read out of the source. onnxruntime assembles its wasm URL at
runtime, so no grep can find the filename, and a model fetched inside a worker
never appears in a network panel watching the page — a check that reads either one
will confidently report the opposite of the truth. Clear the storage, reload, do
the thing the product is for, and read what actually went out. Assumption is the
failure mode here and it runs both ways: mitreden deliberately ships no non-SIMD
onnxruntime fallback, and the reasonable guess is that such a browser fetches it
from a CDN. It does not. The bundle names no CDN, so the name resolves against the
product's own origin and 404s. It fails rather than phones out — better than the
guess, and only knowable by looking.

**A green test you have not seen fail is not yet a test.** Break the thing each
check protects and watch that check go red before it is allowed to count. This is
not caution, it is the only evidence that a check is wired to anything: a
mitreden offline check passed because its injected script tag anchored on a
`</head>` the generated page does not contain, and three bildhaft regression
checks passed because reverting the fix broke the build and the test server kept
serving the previous bundle. All four were green, all four were measuring nothing.

### 4.4 What is explicitly *not* shared

**The navigation shell left this list on 2026-08-24.** It read "a sidebar, a
chip row, or nothing", and it was written when two products had independently
invented a sidebar and it looked like a coincidence. Three have now, with the
same rows, the same counts and the same button under them — at which point
"not shared" describes three copies rather than a freedom anybody is using. The
sidebar is shared; what stays exempt is below, and it is narrower.

- **The accent hue.** By design.
- **Light or dark.** A product commits to a ground and states it. bildhaft follows
  the OS; mitreden is dark and sets `color-scheme: dark` so the browser's own
  widgets follow. Converging here would cost more than it buys — see §5.
- **What fills the third slot of the work head.** The row itself is shared —
  name, count, one action, `⋯` — and the action is the product's: *Drucken* in
  bildhaft, *Herunterladen* in mitreden, *Aufs Gerät übertragen* in vorlaut.
  Sharing the row does not oblige them to share the verb.
- **Density.** bildhaft is a desktop tool with card rows and hover-revealed actions.
  mitreden runs on a phone on a home network. A shared token set does not oblige
  them to the same row height.

---

## 5. Prioritised change list for mitreden

**Overtaken, and kept for the reasoning.** This list was written for the
`ui.html` mitreden and costed against shipping a container image. mitreden has
since been rewritten as a browser-only TypeScript app, and most of the list
landed with the rewrite rather than off it: the tokens, both schemes, the
sidebar shell, the `⋯`, the Sammlung vocabulary, the in-page dialogs, the
Sicherung, and a footer it turned out to owe. What is worth reading here is not
the ordering but the arguments — several of them are the only written record of
why a thing is the way it is. Every "effort" and every "container impact" below
is spent; read them as history.

Each item: **effort** (small / medium / large), **container impact**, and whether it
is *visual*, *vocabulary*, or *both*.

A note that applied to every item, and no longer does: `mitreden.py` read
`ui.html` fresh per request, so none of these needed a restart in development —
but all of them shipped in the image and reached every running NAS on the next
pull. There is no image now, and no NAS: mitreden is a static site deployed from
`main`. The advice the note carried still holds for a different reason — group
the invisible changes, let a behavioural one stand alone so a regression has one
suspect — because that is about reading a failure, not about shipping.

### Tier 1 — tokens only, no behaviour change

**1. Rename the ground tokens to the shared names.** `--ink` → `--bg`, `--panel` →
`--surface`; split `--line-soft` into `--surface-2` (where it is a fill: `.tag`,
`.asbutton`, `select`) and a lighter `--line` (where it is a separator: `.item`
bottom border, `.svc` top border).
*Effort: small. Container impact: none — pure rename inside one `<style>` block,
no markup, no API, no strings. Visual.*

**2. Tokenise the six hard-coded colours.** `#1e222c` → a `--surface-3` hover token
(eleven occurrences, all meaning the same thing); `#ffa3d2` → an accent-hover value;
`#4d5464` → `--text-faint`; `rgba(229,72,77,.12)` → `--danger-soft`; the two black
alphas → `--shadow` and a backdrop token.
*Effort: small. Container impact: none. Visual.*
This is the highest value-per-line item on the list: it turns "mitreden happens to
use these colours" into "mitreden has a palette", and it is what makes items 5 and 6
one-line changes later.

**3. Add the missing shared tokens even where nothing uses them yet:**
`--accent-strong` (on mitreden's dark ground it may simply equal `--accent`),
`--accent-soft` (a low-alpha pink wash), `--text-faint`, `--radius`/`--radius-sm`/
`--radius-pill`/`--radius-item`, `--shadow-sm`/`--shadow`, `--font`, `--mono`.
*Effort: small. Container impact: none. Visual.*

**4. Adopt the identical font stack string** — add `-apple-system`, `Roboto`,
`"Helvetica Neue"`, `Arial` to the existing four.
*Effort: small. Container impact: none — no layout shift on any platform that
already resolved to `ui-sans-serif` or `system-ui`, which is all of them. Visual.*

### Tier 2 — small visual convergences

**5. Collapse the four focus rules into one `:focus-visible`.** The rule is already
identical to bildhaft's; the selectors are not.
*Effort: small. Container impact: none. Visual.*
Watch for one behaviour change: `textarea:focus`/`input:focus` currently ring on
*any* focus including mouse click; `:focus-visible` will not ring on a mouse click
into a field. That is the intended modern behaviour and matches bildhaft, but it is
a visible difference and should be a deliberate one.

**6. Reserve the full accent fill for the primary action; give the active chip the
accent tint instead** (`--accent-soft` background, `--accent-strong` text, weight
650 — the weight bump is already there).
*Effort: small. Container impact: none. Visual.*
This is the change with the biggest look-and-feel payoff per line. Today "Satz
hinzufügen" and four selected group chips are all solid pink and compete; afterwards
there is one loud thing on the page and the filters are visibly a different class of
control. It also makes the existing written rule — *filters are pills, actions are
boxes* — legible in colour as well as in shape.

**7. Regularise the button family.** Right now there are six near-misses: `button`,
`.primary`, `.quiet`, `.gear` (pill, icon), `.dots` (9px radius, icon), `.chip`
(pill), `.asbutton`/`select` (its own fill), plus `#dlmp3`/`#bulk` with surgically
zeroed corners for the split control. Reduce to: one base, three tiers, one icon
variant, one chip, and let the split control be the base with two corners zeroed.
*Effort: medium. Container impact: none functional, but it touches nearly every
control in the interface at once — the release where a spacing regression is most
likely to be noticed by someone on a NAS. Visual.*
Keep mitreden's bordered-rectangle family; do **not** adopt bildhaft's borderless
pills. On a dark ground with a single surface level, borders are how mitreden
separates planes at all — removing them would require the whole three-surface scheme
and a much larger change than this is worth.

**8. Give the settings sheet a head/body/foot** (title row, scrolling body, a footer
with a border-top holding „Schließen"), matching bildhaft's dialog anatomy.
*Effort: small. Container impact: none — `<dialog>` and `showModal()` stay, which is
the right call: native dialogs bring the focus trap and Escape handling for free and
mitreden has no framework to rebuild them with. Visual.*

### Tier 3 — vocabulary and wording

**9. Name the act on destructive confirmations.** `ask_delete_other` currently
reads "{n} Sätze löschen?\n\nDie Sätze und ihre Audiodateien werden entfernt. Das
lässt sich nicht rückgängig machen." — the body is already exemplary. What is
missing is the button, and a native `confirm()` cannot label its button. Two
options: (a) accept the limit and keep the excellent bodies as they are, which is
defensible and free; or (b) build one small confirm dialog on the existing
`<dialog>` element and route the four `confirm()` calls through it.
*Effort: small for (a) — no change at all; medium for (b) — ~30 lines of JS and one
`<dialog>` in the markup. Container impact: (b) changes a modal that every user
meets when deleting; it must keep Escape, must keep the button order, and must not
regress the case where a bulk delete is triggered with a filter active. Both.*
My recommendation is **(b), but last** — after tiers 1 and 2 have landed and
settled. It is the single biggest step toward feeling like the same product, and
also the only item that adds real JavaScript to a file whose smallness is the point.

**10. `⋮` → `⋯` in the row trigger** (one character in `ui.html`, plus two mentions
in `README.md` and `README.de.md`).
*Effort: small. Container impact: none. Visual.*
Arbitrary but worth settling: the two products currently document two different
glyphs for the same menu in four README files.

**11. Add a `Sicherung` to the interface** — a menu entry that downloads
`phrases.json` (plus, arguably, the `config.json`), named exactly that, distinct
from the existing „herunterladen" for audio.
*Effort: medium. Container impact: real — it needs a new read-only endpoint in
`mitreden.py`, which is the first item on this list that is not confined to
`ui.html`. It is also the item that makes the least sense in a hypothetical
browser-only build of mitreden, where there is no `phrases.json` on a disk to send.
Both.*
**Done, and the hypothetical is what happened.** All three products carry a
Sicherung, written by `@lautstark/sicherung` into a folder the person picks.
There is no `phrases.json` on a disk and no endpoint: the browser holds the
library and writes the file itself, which is the arrangement this item guessed
would make the least sense and turned out to be the only one available.
This is the strongest *product* argument in the whole document, quite apart from
sibling-feel: mitreden's README already says `phrases.json` is the only thing that
cannot be recreated, and today the interface offers no way to get it. Someone
running the container on a NAS and adding sentences from a phone has no path to a
backup that does not involve a file manager.

### Tier 4 — assessed and not recommended

**A sidebar of groups, as bildhaft has.** I do not recommend it, and not only on
effort grounds.

- **Arity.** mitreden's groups are many-to-many and combine with OR — two groups
  picked at once show the sentences of both, and a sentence appears under every
  group it carries. A rail is a single-selection navigation; it cannot express "both
  of these" or "this sentence is in three places" without becoming a tree of
  checkboxes, which is the chip row again, vertical and taller.
- **What the grouping *is* in each product.** In bildhaft a Sammlung is a working
  context: you open „Der Grüffelo" and stay inside it for an hour translating a book
  — the README says so, "often translate dozens of lines in one sitting". Committing
  268px permanently to the thing you are inside is honest. In mitreden the groups
  are a lens over one long-lived list. A talker vocabulary is built over years and
  filtered by situation — Kindergarten, home, emergency — and a sentence is
  legitimately in all three. The lens changes many times a minute; the list does
  not.
- **Cardinality.** mitreden's chip row caps at twelve and folds the rest behind
  "+ n more", precisely because the group set is unbounded and grows one entry per
  picture book. A rail listing forty groups sorted by nothing is worse than a fold
  sorted by use.
- **Where it runs.** mitreden's README actively sells adding sentences from a phone
  on the home network. bildhaft's says desktop is the primary target and hides its
  sidebar entirely under 820px. A 268px rail would be dead weight in mitreden's
  primary case.

*Decided the other way: both products get the sidebar shell.* The objections above
are not wrong, they are the specification for doing it properly:

- **The rail multi-selects in mitreden**, because a mitreden sentence is in
  several Sammlungen and the chips it replaces already combined with OR. It does
  not elsewhere: §3.1 makes arity a fact about the product, and a rail that
  toggles where nothing can be in two places is a control with one reachable
  state. The selection follows the arity, not the other way round.

  **The behaviour was right and the reason was not, 2026-08-25.** mitreden's
  arity went to one and the rail still multi-selects, so the reason cannot have
  been arity. It is the open set: several Sammlungen are worked across at a
  sitting and the list shows the union of them, which is as useful now that a
  sentence cannot be in both as it was when it could. Elsewhere the second
  sentence still holds unchanged — a product that opens one at a time has one
  reachable state to toggle. [conventions.md §4.2](conventions.md). Everything
  above this line is the assessment as it stood, mitreden's many-to-many groups
  included.
- **It collapses below 820px**, exactly as bildhaft's already does, so the phone
  case mitreden sells keeps the single column it has today.
- **It folds past a dozen**, carrying over the existing `+ n more` behaviour rather
  than listing forty entries sorted by nothing.

The four things underneath were already shared and stay shared: the
name-plus-count shape, the accent tint marking a live one, an explicit "Alle"
reset, and search that matches Sammlung names as well as content. mitreden does all
four today; bildhaft's sidebar has the first two.

The superseded objection:

**A light theme.** *Decided the other way: both products support both schemes.*
The costs below are real and are the work, not an argument against it. A light
palette is the one thing a visitor judges before reading a word, so leaving the two
products on opposite ones defeats everything else in this document. The videos and
posters stay valid — dark stops being the only rendering, it does not stop being a
rendering. The original objection: `color-scheme: dark` in
`ui.html` is deliberate and is documented in the file itself; `docs/style.css`
mirrors the dark palette so the landing page looks like the program; and the two
demo videos and their poster frames (`poster-de.jpg`, `poster-en.jpg`) show a dark
interface. A light mode is not a token change — it is a second palette, a second
`icon.svg` contrast check, a re-shot video, and a landing page that no longer
matches. The family resemblance has to be carried by shape, spacing, vocabulary and
interaction instead. That is achievable and is what §4 is built to do.

**Card rows and hover-revealed row actions.** Still not recommended, and this one
stands: it is density, not identity, and the reasoning survives the new thesis. mitreden's list runs
to 200 rows before it caps (`CAP = 200`) and is scanned, not worked through; hairline
separators are the right density for that. Hover-revealed actions assume a pointer,
and mitreden is used on a phone.

**A footer in the interface.** Not recommended for symmetry's sake, and this one
stands too. bildhaft's
exists because the ARASAAC licence requires attribution on screen; mitreden has no
such obligation. If mitreden ever wants one, the honest content is the same
reassurance bildhaft ends on — that nothing leaves the machine — and not a copy of
bildhaft's.

---

## 6. Things that argue against the premise

Stated plainly, because a design document that only finds agreement is not worth
much.

1. **The two live in different lighting.** bildhaft is a light, printerly desktop
   tool; mitreden is a dark, phone-friendly workshop. Whichever way that is
   resolved, one product ends up in a ground it did not choose — and mitreden's dark
   is entangled with its landing page and its recorded demo videos, which are the
   first thing a new user sees.
2. **One is a document editor, the other is a batch tool.** bildhaft's screen is one
   collection being worked through, a dozen rows, each edited by hand, actions
   revealed on hover. mitreden's is a growing archive of hundreds of sentences,
   scanned and filtered, acted on in bulk by checkbox. These want different densities
   and different affordances, and forcing one on the other would make one of them
   worse.
3. **mitreden is bilingual and bildhaft is not.** A shared *vocabulary* in German is
   only half of mitreden's surface; every term also needs its English counterpart in
   `lang/en.json`, which bildhaft has no notion of. If the shared glossary ever grows
   teeth, mitreden's English column has no sibling to agree with.
4. **The interaction gap is a technology gap.** bildhaft can afford a styled confirm
   dialog, an inline click-to-edit title, and a drag-and-drop reorder because it has
   React and a build step. mitreden's native `confirm()`/`prompt()` are not a
   shortfall — they are what "no dependencies, one file" costs and buys. Every rule
   in §4 that could be read as "build a component" has to survive being implemented
   in ~30 lines of vanilla JS, or it does not belong here.
5. **They do not track the same things.** mitreden has a per-sentence lifecycle
   (recorded / stale / missing) with three status colours and a voice per row;
   bildhaft has no pending state at all, by design — "whatever is generated counts as
   accepted". A shared token set cannot pretend both need `--ok`, `--warn` and
   `--miss`, which is why §4.2 marks them optional.
6. **The premise that `ui.html` is shared between two products is not currently
   true.** On `main` it is served by the container only. The double-landing
   constraint is real on the `spike/piper-wasm` branch and would become real again
   if a static build returns — so every item above still answers for it — but as of
   today an interface change has one destination, and item 11 (`Sicherung`) is the
   only one on the list that would not survive the second one.

None of these sink the project. They mean the resemblance has to be built out of
mark, palette structure, focus and hover behaviour, component anatomy, and above all
*words* — not out of a shared layout.

---

## 7. The generator

§4.2 says the token names are normative and the values are per product. That was
right, and it left one question open: *who chooses the values.* For two years the
answer was "a person, by eye", and that person shipped three contrast failures —
white on salmon at 2.48:1 on the button that deletes everything, a `--text-faint`
at 2.89:1, and a replacement for it, ported from the sibling product, that still
read 4.04:1 on the ground it actually sat on.

All three are the same mistake, and it is not carelessness. Judging a ratio by eye
is not a thing people can do, and judging it *in the scheme you happen to have your
laptop set to* guarantees the other scheme goes unchecked.

So the values are now derived.

### 7.1 One input

A product declares exactly one thing about itself, in `products/<name>.json`:

```json
{ "product": "vorlaut", "accent": "#9B7BFF", "schemes": "dark", "state": false }
```

`accent` is the identity. `schemes` is the ground the product commits to per §4.4.
`state` turns on the optional `--ok`/`--warn`/`--miss` trio for products that track
a per-item lifecycle. Nothing else is a colour decision anybody makes.

### 7.2 Neutrals tint toward the accent

**The neutral planes carry the product's own hue at very low chroma.** A neutral
that holds a trace of the accent at every step reads as one material; a true grey
next to a saturated accent reads as two unrelated things stacked.

This was already true in one product and nowhere else. Measured in OKLCH:

| | light neutral | dark neutral | accent |
| --- | --- | --- | --- |
| bildhaft | H 84.6° | H 84.6° | H 39.2° |
| mitreden | H 84.6° | H −95.7° | H −11.0° |
| vorlaut | — | H −91.8° | H −68.3° |

bildhaft holds one hue across both schemes. mitreden's light values are bildhaft's,
byte for byte — they were copied — and its dark ramp is an unrelated blue, so the
product is warm in one scheme and cool in the other. vorlaut invented a third.

Only one neutral ramp in this family was ever authored deliberately. The generator
takes bildhaft's L and C ladder as the *shape* and rotates it onto each product's
own hue. bildhaft's own values come back essentially unchanged; the other two stop
contradicting themselves.

### 7.3 What is solved and what is fixed

Not every token is a threshold, and treating them all as one produces bad output:
solving for "clears 4.5:1" returns the *first* value that clears it, which is the
right answer for a placeholder and the wrong answer for body text.

- **Fixed points on the ladder:** the planes, `--line`, and `--text`. `--text` is
  what you read everything in, so it belongs at the end of the ramp, not wherever a
  threshold lands. Solved, it came out `#302c2b`; authored, it is `#1c1a17`.
- **Solved against a named ground:** `--text-dim` and `--text-faint` against
  `--surface-2` — *not* `--bg`. `--surface-2` is the fill of every field and the
  tightest ground either really sits on. This is exactly the distinction the ported
  value missed: it measured 3.92:1 where it was checked and 3.18:1 where it printed.
- **Solved against the accent:** `--accent-ink` and `--danger-ink`, at 6:1 rather
  than the 4.5 minimum, because they carry a primary action's label at small size.
  Both directions are tried and the winner kept — a saturated orange or purple takes
  near-black, a deep blue would take white, and hardcoding either is precisely how
  the 2.48:1 button happened.
- **Solved against the tighter of two grounds:** `--accent-strong`, which labels
  both `--bg` and `--accent-soft` and can pass on one while failing on the other.

`--accent` itself is never adjusted. It is what the product declared.

### 7.4 The audit, and what it is actually worth

`build.js --check` measures every pairing this document promises will clear AA and
exits non-zero on any failure. Nothing is written for a product that fails.

Be clear about what that catches. Because most tokens are *solved*, they pass by
construction — feeding the generator an absurd accent does not make the audit fire,
it makes the generator return a heavily adjusted `--accent-strong`, which is the
token behaving correctly. The audit fires on two things: a degenerate input with no
chroma to work with (pure black or pure white as an "accent"), and a regression in
the fixed points — break the `--text` anchor and all three products fail immediately
on `--text`/`--bg` and `--text`/`--surface-3`.

So it is a regression guard on the parts that are *not* solved, not a validator of
hues. That is still worth having: the fixed points are where a human decision
survives in the pipeline, and therefore the only place a human can still get it
wrong.

### 7.5 The gallery is the generator

`docs/index.html` imports the same `lib/derive.js` that `build.js` does and applies
its output directly to the page. It is not a picture of the design system; it is the
design system with a hue picker attached. Pick an accent — including one no product
uses — and the planes, the three text weights, both accent and danger families, and
every component below them are re-derived and re-checked live, with the ratios shown.

This is the part markdown could not do. The rule "a full `--accent` fill is reserved
for the primary action" was broken in a shipped product for months, and it was found
by reading CSS. On a page that renders both at once you see it immediately.

---

## 8. vorlaut

vorlaut arrived after the rest of this document and matches it better than it had
any right to, having never read it.

It already carries the identical bubble path. Its `#9B7BFF` is a third hue, which is
what §4.1 requires of a joining sibling. Its `button.primary:hover` is an explicit
value rather than `filter: brightness()`, which is §4.3's rule. And the comment above
its primary button — *"Dark type on the purple: 5.5:1 instead of 3.2:1 with white"* —
is the reasoning behind `--accent-ink`, written out longhand by someone who had not
seen the token.

The mark's face differs: vorlaut winks, and its mouth is open rather than a smile.
**This is allowed and it is the only such licence in the family.** §4.1 fixes the
geometry of the bubble and requires white features; it does not fix the expression.
A product named *vorlaut* — German for the child who talks out of turn — gets to
look like it.

### 8.1 What the conversion is

Four of vorlaut's seven token names already match. The rename is three, and then a
set of tokens it already *has* and never named.

**Renames** — `--panel` → `--surface` (6 uses), `--panel-2` → `--surface-2` (9),
`--muted` → `--text-dim` (30). `--bg`, `--line`, `--text` and `--accent` are already
correct. All of it is in `static/ui.css`; nothing in `ui.html`, `app.py` or
`texts.py` refers to a token.

One trap a search-and-replace will not catch: the `#langPick` chevron is a data-URI
SVG with `--muted`'s hex written into it as `%239aa3b2`, because a data URI cannot
read a custom property. It needs a comment saying so, or it silently desyncs.

**Tokens present but unnamed** — `#303540` on `button:hover` is `--surface-3`;
`#1b1b20` on the accent fill is `--accent-ink`; `#ac91ff` is `--accent-hover`.
`--accent-strong` equals `--accent` on a dark ground, which §4.2 explicitly permits.

**Danger, currently four copies of one idea** — `#e88` as text, and the trio
`#3a2224` / `#7a3a3f` / `#f0d7d9` written out twice, once for the save-conflict
banner and once for the empty-set notice. The second one's comment already says it
is *"the same warning colour as for the save conflict"*: the sharing is stated in
prose and implemented by duplication, which is what a token is for. It collapses to
`--danger`, `--danger-soft`, `--danger-ink`.

**The one that is not mechanical** — vorlaut has no `--text-faint` and sets no
placeholder colour at all, so placeholders currently fall back to the browser's
default. It needs a solved value, and against `--surface-2`.

### 8.2 What stays

- `background: #fff` on `.thumb` and `.symbol`. That is the pictogram canvas, not a
  plane. AAC symbols are drawn for white and need it in either scheme — the same
  reasoning that keeps the mark's eyes plain `#fff` rather than `--surface`.
- `--pick-label`. It is an i18n string passed through a custom property, not a
  colour, and it has nothing to do with any of this.
- `pre.log`'s `#101216`. It is a plane *below* `--bg`, which this document has no
  name for. Either it gains one or the log keeps its literal.

### 7.6 How a change travels

One mechanism: a version pin in a `package.json`. `@lautstark/design` is a
`github:` dependency pinned to a tag, the way `@lautstark/bildquelle` and
`@lautstark/stimmquelle` already are.

Every product imports the CSS out of `node_modules`. Two of them once could
not: vorlaut served plain ES modules and kept a committed copy, and mitreden
inlined the tokens into a hand-built `ui.html`. Both pages retired, and the
`--sync` flag that fed them retired with them — it had been pointing at files
that no longer existed, which nothing noticed, because no check ran it.

There is deliberately no `prepare` script. `tokens/` is committed, so a consumer
reads static CSS and nothing runs on their machine at install time. This family
allowlists install scripts, whitelists what `static/` may serve, and audits what
leaves the browser; a token set is static CSS and has no business asking for an
exemption. CI regenerates and diffs instead, which is why the header names a
version and not a commit — a sha changes every commit and would make "are the
committed tokens current?" impossible to answer by regenerating.

**Two designs were tried and thrown away**, and both failed the same way. The
first had this repository push outward into the products, which needs a personal
access token with write access to them, stored here and readable by every
workflow here. The second had each product clone this repository on a weekly
schedule and push a branch, which removed the credential but spent about fifty
CI runs a year to find nothing — these files change roughly twice.

Both were elaborate answers to a question npm already answered. The lesson is not
about tokens or schedules: a delivery mechanism should be sized to how often the
thing is delivered, and this thing is delivered almost never.

---

## 9. The components file

§4.3 wrote the components down as prose, and every product implemented the
prose again by hand. That produced the evidence this section acts on: vorlaut
and mitreden carry the identical `button.primary` rule, retyped; bildhaft
carries the same values under `.btn--primary`, plus a base the others lack (a
pill radius, disabled at opacity .4); and the one-line focus policy travelled
from bildhaft into mitreden by hand, in a commit that says it is doing so.
Hand-copying is how a rule drifts: three products, three class names, one
button.

So the components that have demonstrably been copied are one file now,
`components.css`, imported beside the token file and travelling the same way:

```css
@import '@lautstark/design/tokens/<product>.css';
@import '@lautstark/design/components.css';
```

It is plain CSS written entirely against the token names — no literal colour,
no JavaScript, no framework assumption, because bildhaft is React, the other
two are vanilla DOM, and a class vocabulary is the one thing all three can
consume. Under any accent the generator accepts, the file renders
contrast-checked by construction, since every colour in it is a token the
audit already measured.

**What is in it.** The focus policy; the three button tiers with the
destructive colouring, `.filled` for the confirm of a destructive dialog, and
the icon variant; fields and their labels; filter chips; the overflow menu and
its anchoring geometry; the sheet skeleton with bildhaft's head/body/foot
anatomy (§5 item 8 already adopted it for mitreden); empty states; the notice
line and the toast; the two motion durations behind `prefers-reduced-motion`;
the footer shell with its `.linklike` treatment; the segmented control; and
the folded panel. §2
called the footers "not comparable" and it was right at the time; then
mitreden's rewrite grew legal pages, needed a footer after all, and built it
by copying bildhaft's values with a comment saying so, which is this file's
admission bar met exactly. It is centred by decision. The content stays per
product: bildhaft's attribution is a licence obligation, and what a footer
may claim is §4.3's disclosure rule.

**What is not.** Anything §2 found to be a real difference rather than an
accident. List rows — separator-rows against cards is density, and density is
per product. What fills the third slot of the work head. Product layout:
vorlaut's tile grid,
mitreden's phrase list, bildhaft's print styles. And the dialog backdrop
weight, which §2 left unresolved (.6 opaque against .38 with blur) and a
shared file must not settle by side effect.

**The vocabulary is the agreement's, not any one product's.** A base class and
plain modifier words, the way vorlaut and mitreden already speak: `.btn`,
`.btn.primary`, `.btn.quiet`, `.btn.destructive`, `.btn.destructive.filled`,
`.btn.icon`; `.field` and `.lbl`; `.chip` with its `.n` count, selected on
`aria-pressed="true"` rather than a class, because a filter a screen reader
cannot hear toggling is not a filter; `.menu` inside a `.menu-anchor`;
`.sheet` with `.head`, `.body` and `.foot`; `.empty`; `.notice` and
`.notice.bad`, taking an optional trailing `.btn.quiet.icon` as its dismiss;
`.toast`. Everything is opt-in by class — importing the file
restyles nothing by itself except `:focus-visible`, which is the one rule that
was already true everywhere and should not be optional.

Adoption is per product, as token adoption was, and it has now happened
twice. bildhaft renamed its BEM classes (`.btn--primary` became
`class="btn primary"`); mitreden added the base class its bare `button`
selectors never needed and moved `.chip.on` to `aria-pressed`; both deleted
the rules the file owns, and both replaced their settings tabs with panels.

vorlaut is the one left, and its migration carries a trap worth naming
before it starts rather than during: vorlaut's panel bodies are
`<div class="field">`, and `.field` here is the text-input style. Adopting
without renaming would give every panel body in the product an input's fill,
border and padding — which would read as the adoption having been a mistake
rather than as one name colliding. It is the same error mitreden made in
miniature, with a paragraph marked `class="sub body"` whose `body` existed
only as a JavaScript hook, and the same check finds both: enumerate the
elements carrying a shared name whose role in the markup is not the
component's. Reading stylesheets cannot find either, because neither name is
in one.

The gallery imports the file. That is not a convenience; it is §7.5 applied to
components: a gallery that redrew the button with private classes would be a
picture of the components exactly as a markdown table is a picture of the
tokens. `docs/index.html` links `components.css` ahead of its own chrome, so
the button it shows under any accent the picker can produce is the shipped
button.
