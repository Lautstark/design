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

Query parameters, so every state can be shot from one file:

| | |
|---|---|
| `?s=ich,will,Apfel` | start with a sentence in the bar; `?s=long` overflows it |
| `?c=fill` (default), `?c=border`, `?c=off` | the three word-class settings the editor exports |
| `?state=speaking`, `?state=degraded` | the two states that are neither |

## What it is showing

A 3×5 board — the size `boot_data.ts` starts a tablet Sammlung at. Two of the
fifteen buttons are not ordinary: `Wasser` is degraded, its picture promised by
the package and not contained in it, and `bitte` has no picture at all, which
is not a fault but a button somebody wrote as a word.

**The board does not follow the theme.** It has a dark case and light contents
in either scheme, and `board.css` carries the only two literal surfaces in this
repository outside `tokens/`. The reason is in that file's header and is
measurable: white tiles on the light theme's `--bg` sat at 1.05:1, which is a
rounding error rather than a contrast, and the whole screen swam.

Colour inside the case comes from the Fitzgerald key and from nowhere else, so
a tint always means a word class rather than decoration. The key's ten hexes
live in vorlaut's `boot_data.ts` (`WORD_CLASSES`). How much of it a button
shows is not the viewer's choice — the editor writes `background_color`,
`border_color` or neither, and `?c=` switches between the three.

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

Two things the sheet nearly took away and gets back. **Hearing a button**
without opening anything: one play tool, under the pointer, on every board size
— the earlier draft hid it past seven columns because two tools were competing
with the word, and with the picture in the sheet there is only one left. And
**the speaker's corner** is drawn as a speaker rather than captioned as one.

**The grid size is not a page setting and has left the editing bar.** It sat
next to the page tabs, where everything else belongs to the page; it belongs to
the Sammlung, and sharing it across pages is exactly what makes a button sit
under the same thumb wherever you are. It is asked when a Sammlung is made — as
pictures rather than a pair of numbers, since what is being chosen is how much
fits on a page — and changed afterwards from the ⋯ beside the name. Growing
stays free, shrinking still asks.

Four things the sheet settles, three of them from how real AAC software already
answers them. AsTeRICS Grid is the reference each time — the closest open-source
relative, and ARASAAC hosts its German documentation.

**The label is optional.** A button with a picture and no word is an ordinary
symbol-only button, and nothing in `SPEC.md` needs it: §7.2 only asks that a
button have *something*. The reverse is first-class too, and is the part that
is easy to get wrong — AsTeRICS sets a text-only button at 35% of cell height
against 15% with a picture, so the word takes the room the picture would have
had rather than floating in an empty cell. There is no "kein Symbol"
placeholder for the same reason: an empty slot on a board is furniture
announcing an absence.

**A label that does not fit clamps to two lines and then ellipses.**
`TextConfig` offers three answers — shrink, truncate, ellipsis — and defaults
to one line and shrink. Two lines wins here: a cell at eleven columns is 91px,
shrinking a sentence to fit one line of that makes type nobody can read, and
truncating loses the end with no sign anything is missing.

**Word-class colour is a preference, not a rule.** Fläche, Rahmen or aus, one
answer per Sammlung, beside the grid size — `colorSchemesActivated` next to a
`colorMode` of background, border or both. "Aus" is not colourless: the page
keeps its own, because that says *where* you are rather than *what* a word is.

**A cell is not a button.** It holds two: one filling it, which opens the
sheet, and one in the corner, which plays. A control inside a control is
invalid markup and unreachable to a keyboard, which is what the first draft had.

**A page gets a card of its own, and it is the button sheet's twin.** Its name
and its delete lived in four different places between the two editors — a field
and a red button in a row under the tablet's grid, a field in the talker's set
tile and a red button below it. Both belong to the page, so both are in one
card with the same foot as a button's: delete left, done right. The tablet's
carries the start page, the talker's carries a picture, and that is the whole
difference.

Reached from the `⋯` on the current tab in both. On the talker the set key
opens the same card, because that cell *is* the page — which is not the two
doors conventions.md §3.2 forbids. That rule is about two places in the *chrome*
pointing at one sheet; this is one object drawn twice, and both drawings lead to
itself.

With that, the last thing on either board that is not a cell is gone.

**One bug worth keeping the note for.** The tabs wore a colour rail down the
side, written `border-left-color: var(--screen)`. On a tablet tab, which has no
page colour any more, `--screen` is unset and the declaration carries no
fallback — so it goes invalid at computed-value time, which does not mean
"nothing", it means **inherit**. In the dark scheme that inherited the near-white
text colour, and every tablet tab grew a white rail nobody drew. Every `var()`
naming an optional value in this file now carries a fallback.

The rail is gone either way: the tabs wear what the five-key editor has always
worn, a dot beside the name and the whole border in the screen's colour while
it is current. It looked like the editor it describes; a rail did not.


## The way out of the board

`vorlaut-exit.html` — four candidates, switchable, and holdable so the feel can
be judged rather than described. They answer one complaint: the first version
put the way out under the vorlaut mark in a 62px tile at the left of the bar,
and the person who commissioned it read the commit and still had to ask what
the icon was for.

| | costs | at rest | risk |
|---|---|---|---|
| **A · Kante** | 18px of bar | a 6px pill in a column of its own | reads as a handle, which is the point |
| **B · Ecke** | nothing | invisible | nobody finds it unaided |
| **C · Punkt** | nothing | one 9px dot | easy to miss, easy to explain |
| **D · Zwei Finger** | nothing | invisible | safest against a stray hand, needs teaching |

All four share the feedback, and the feedback is the actual affordance: a ring
begins filling the moment a finger lands, so *keep holding* is learned rather
than read. None of them may push the bar's controls along — three cost no width
at all, and A's 18px is shown honestly in the switcher so the comparison is
between affordances rather than between layouts.

## The PIN

`vorlaut-pin-waehlen.html`, `vorlaut-pin-eingeben.html`,
`vorlaut-pin-falsch.html` — four boxes, one digit each, auto-advancing, with
backspace stepping back out of an empty box and paste filling all four.

One field with four characters in it asks the person to count what they typed.
Four boxes say how many are wanted before a digit is entered and how many are
in. The confirm stays disabled until all four are there, so there is no such
thing as submitting a short PIN.

Masked, with the digit showing for 700ms as it is entered. The threat model is
a child in the room: long enough to confirm the finger landed, short enough
that somebody across the table reads four dots. A wrong PIN marks every box
rather than any one of them — the PIN is wrong, not a digit — and empties the
row so the next attempt starts clean.

## Eine Zeile in der Sammlungsliste

`vorlaut-sammlung-zeile.html` is a proposal rather than a screen, like the two
editors above. The question is what the *sidebar* row can say: it carries a
name and a count, and the count means Sets on the DIY talker and Tasten on a
tablet with nothing on the row saying which.

Six candidates over one list, at the real 268px, with the longest name open —
because the open row is bold and therefore the one with least room. Nothing is
implemented and `docs/lib/collections.js` is untouched; the page renders the
real `.collections` from `components.css`, and the five new class names in
`sammlung-zeile.css` are the whole proposal.

Two things the page found that the idea it started from did not survive.

**A drawn grid stops being a grid at 17px.** vorlaut's size presets draw one
`<i>` per cell at 62px and caption them, and the obvious move was to shrink
that into the row. Measured, a cell is 2.6px wide at 3 × 5 and 0.6px at 6 × 11,
so the two large presets are indistinguishable — and because the 1px gaps stay
whole pixels while the cells shrink, the mark *covers less* the finer the grid
gets: 78% of its box for the talker, 57% at 3 × 5, 15% at 6 × 11. The Sammlung
with the most buttons would get the faintest mark.

**And the mark cannot whisper.** Drawn dimmed the way the preset row draws it,
against this package's own tokens and with its own `contrast()`, it is 2.36 : 1
light and 2.77 : 1 dark on a quiet row and 2.15 / 2.53 on the open one — all
four under the 3 : 1 a graphic carrying information has to clear. The same
arithmetic took an `opacity: .8` off the second line and the number pair, which
were at 3.20 and 3.83 against a 4.5 : 1 bar. Everything in the row is now drawn
at full strength, and that is not a preference.

**B is chosen** — the device on a second line, with the count on the name's
baseline rather than centred in the block. The page keeps the losing candidates
and the reasoning that ranked them, because what they cost is the record of why
B was picked; the foot of the page says so and then leaves the earlier
recommendation standing.

Choosing B made the API addition smaller than the one this page set out to
propose. A drawn mark would have needed a *model* — target and grid together, so
the shared row could compute a shape from it. A second line of text needs only
the line: one optional string, drawn exactly as passed, which is the rule
`collections.d.ts` already states for `name` ("Exactly what to draw […] Nothing
here derives a display name"). So vorlaut's German stays in vorlaut's `TEXTS`,
the shared row never learns a vocabulary, and mitreden and bildhaft pass nothing
and render precisely what they render today. Described in words only; nothing is
implemented.
