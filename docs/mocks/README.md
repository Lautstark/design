# vorlaut — mocks

`vorlaut-board.html` is the board screen, drawn with `tokens/vorlaut.css` and
nothing else. It exists so the screen can be argued about before it is built in
Compose, where every round trip costs a rebuild and an emulator.

Open it directly — it needs no server:

```
open docs/mocks/vorlaut-board.html
```

Change `--rows` / `--cols` on `<body>` to see another board shape. The layout
takes them from there and has no breakpoint of its own, which is the same
promise the Compose grid makes.

## What it is showing

A 3×5 board — the size `boot_data.ts` starts a tablet Sammlung at — with a
sentence of three entries already in the bar, and one degraded button
(`Wasser`) whose picture the package promised and did not contain.

Colour on this screen comes from the Fitzgerald key and from nowhere else.
Every surface around it is a neutral token, so that a tint always means a word
class rather than decoration. The key's ten hexes live in vorlaut's
`boot_data.ts` (`WORD_CLASSES`).

## The symbols

ARASAAC, fetched once from the public API and committed so the mock renders
offline — the family's stated no-CDN rule applies here too.

> Author: Sergio Palao. Origin: ARASAAC (<https://arasaac.org>). Licence:
> CC BY-NC-SA 4.0. Owner: Government of Aragón (Spain).

**Not METACOM**, deliberately. METACOM is licensed per person and
`bildquelle/src/metacom.ts` states the rule this repository has to respect:
*no METACOM image byte is ever uploaded, transmitted, or written to any
server.* This repository is public, so METACOM could not live here whatever
was on the machine that built the mock.

The words are real and the pictograms were checked against their German
keywords by hand. The first search hit was wrong for several of them —
`will` resolved to a pictogram meaning *ich will **nicht***, and `mehr` to a
map of a disability workshop. A board of placeholder squares would have hidden
that, and would also have made any spacing look fine.

## The other three screens

`vorlaut-sammlungen.html`, `vorlaut-sammlungen-leer.html`,
`vorlaut-warnungen.html`, `vorlaut-pin-waehlen.html`, `vorlaut-pin-eingeben.html`.

These are the adult's screens. The board gives up everything it can to the
grid; these give up nothing, because reading is the whole task.

They import `components.css` and use it. The first pass at `screens.css`
redefined `.notice`, `.empty`, `.sheet` and the footer before noticing all four
were already in that file — which is the drift `components.css` was written to
stop, arriving from a fourth product. What is left in `screens.css` is
vorlaut's own layout: a Sammlung row carrying a picture and a warning count,
and the warning rows. Product layout is identity, not vocabulary.

Two names are deliberate. The page header is `.appbar` and not `.head`, because
`components.css` owns `.sheet > .head` and says its vocabulary is small,
reused, and has to be scoped. And a Sammlung row is `.sammlung` and not
`.collections__item`, because that is the family's *sidebar* row — a name and a
count down the side — where this is the main surface of a viewer whose whole
job is choosing between Sammlungen.

The wording is German throughout, matching the board. vorlaut is bilingual on
the web (`TEXTS` in `boot_data.ts` carries `de` and `en` behind a picker) and
the Android viewer currently is not: its chrome is hardcoded English over
German package content. Whatever these screens become, they need the pair.

## The two editors

`vorlaut-editor.html` is a different kind of mock from the five above. Those
draw a screen that exists; this one draws a proposal, and it is here rather
than in the product because the argument is about pixels and a round trip
through two TypeScript editors is the expensive way to have it.

The builder has two editors — a five-key talker and a tablet — written months
apart, and side by side they read as two products sharing a sidebar. The
proposal is that they are one: **the same cell, the same grid, the same
property row**, with the differences cut down to the ones the targets force.

Three decisions, each argued at the rule in `editor.css`:

1. **The word is always a field, and the field is in the cell.** A label at
   rest, an input when focused, in place. Kept from the talker, where every key
   is live; the tablet had put the words in a panel eleven cells away.
2. **Everything else waits until asked.** Kept from the tablet: a dashed
   outline and a plus, and nothing else. The picture and the play button appear
   under the pointer; the properties appear in one row under the grid.
3. **One grid, including the hole.** The talker is drawn the way the device is
   and the way `obf.ts` already exports it — two rows of three with the
   speaker's corner empty. So both editors are literally the same component.

The talker's set key is the one thing not forced into an ordinary cell. It
carries a screen's name, picture *and* colour, and on the device it says where
you are as well as moving on. It keeps a colour rail and an eyebrow, and hands
its one extra property to the row — the same slot a tablet button gives its
word class. One position, one question, the product's own answer in it.

Nothing here is built. `--rows` and `--cols` sit on each `.grid`, so any board
in it can be re-shaped in place.

### One button, one sheet

`vorlaut-editor-sheet.html` is the second answer to the same question, and the
simpler one: pressing a button opens a modal holding everything about it.

It replaces the property row in `vorlaut-editor.html` rather than joining it.
The row could only ever hold what fits on one line, which is why the picture
and the sound had to stay in the cell and why a dense board had to give its
tools up; a sheet has room at every board size, so eleven columns and three
columns become the same handgrip.

What it costs is the fast path — fifteen buttons is fifteen open-type-close
cycles instead of fifteen presses and some typing — and the foot answers that
with a way to step to the next key without closing.

Three cases, one skeleton: a tablet button, a talker speech key, and the
talker's set key. The left column is identical everywhere; the right carries
only what that target has, which is four rows on a tablet and one on a talker.

**It also corrects the action list**, which described a distinction that does
not exist. „In die Satzleiste“ against „Sofort sprechen“ reads as silent
against loud, and the viewer speaks both — `BoardViewModel` calls `utter()` for
`Append` *and* for `SpeakImmediately`. The only difference is whether the word
joins the sentence, and the four kinds now say so. No format change is needed
for that; the one thing that would need one is „danach leeren“, which is
representable as `actions: [":speak", ":clear"]` and which SPEC.md §7.4
deliberately leaves undefined.

The file opens with **the board before anything is open**, because that is what
the sheet changes most. The cell stops being a field and goes back to being a
button: with the sheet carrying the word, an input on the board would be a
second way to do one thing, and a press would have to choose between focusing
it and opening the sheet. The two in-cell tools and the property row go with
it. Nothing is left on the board that is not the board.

A page has no cell on a tablet, so the current tab carries a `⋯` that opens the
page's own card. The talker needs none: there the set key *is* a cell.

