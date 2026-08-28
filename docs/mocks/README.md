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

## The adult's screens

`vorlaut-sammlungen.html`, `vorlaut-sammlungen-leer.html`,
`vorlaut-warnungen.html`, `vorlaut-pin-waehlen.html`,
`vorlaut-pin-eingeben.html`, `vorlaut-pin-falsch.html`.

Six files and fewer screens than that: the first two are one screen full and
empty, the last three are one sheet in three states, and `vorlaut-warnungen.html`
is a sheet over the first. This heading used to say three and the list under it
had five, which was about the state the app was in. Everything outside the
Tafel is there to do three things — add a file, look at what is on the device,
remove one — and it had grown four surfaces, three doors to two places, and a
primary action that scrolled away as soon as a fourth Sammlung arrived.
vorlaut-app `45ca73e` (`v0.6.0`) cut that down, and these files follow it.

The board gives up everything it can to the grid; these give up nothing,
because reading is the whole task.

### What the app settled, and these files now show

**The foot does not scroll.** Sammlung hinzufügen was a list item under the
last row, so with four Sammlungen you scrolled to find the thing the screen
exists for. It is the right half of a fixed foot now — and Einstellungen is the
left half, which is the easier part of the change to miss because it barely
shows in a diff. It stays at the foot, where design.md §3.6 keeps it, but as a
Quiet-tier button rather than 13.5sp of dim text with 6dp under it: measured on
a tablet, 30dp of touch target becoming the 48dp both controls have now. The
rule is `.fussleiste` in `screens.css`, and not `.footer` — `components.css`
owns that name for the centred plate of fine print at the bottom of a web page,
which is the same word for a different object.

**A Sammlung row has no picture.** It led with a 56dp pictogram, decoded off
the archive per row on a worker. What that picture could show is whichever
button happens to sit first in the root board rather than a cover anybody
chose, and four AAC line drawings on white tell four rows apart far less well
than four names do. So the row leads with the name, `.sammlung .face` is gone
from `screens.css`, and `rememberFace` went with it in the app. Nothing left
`symbols/`: all three pictograms this mock used are still drawn by
`vorlaut-board.html`, both editors and `vorlaut-exit.html`.

**The `⋯` carries one item, Entfernen.** It held three, and two of them said
what the row and the chip already said — the row opens by being tapped, and the
warnings open by their count. What is left is the one act with nowhere else to
be. It keeps the `⋯` rather than promoting Entfernen to a visible control,
because §4.3 is about where the *next* action goes.

**Warnungen is a sheet, not a route.** It had its own app bar, its own intro
and its own way back, for an aside nobody answers on the spot. SPEC.md 9.3 asks
that the warnings stay reachable after the import — the person importing is
usually not the person who later notices a button has gone quiet — and a sheet
is reachable. `vorlaut-warnungen.html` therefore draws the Sammlungen list with
the sheet over it rather than a screen of its own; it keeps its name because it
is still the warnings, and it keeps the `.warn` rows, which survived the route
unchanged. The silhouette is ConfirmDestructive's, value for value, which is
`components.css`'s `.sheet`.

**There is a third row flag, `öffnet sich`.** Which Sammlung opens on the next
start decides what the child is handed, and it was written down nowhere — which
left the one question an adult has before passing the tablet over unanswerable
from the screen that exists to answer it. `Flag()` gained `accent` beside
`quiet` for it: not quiet, because it is the fact somebody is looking for; not
the danger fill, because nothing is wrong. Accent, then quiet, then the warning
count — the order the app adds them in, so the fact you are looking for sits
nearest the name.

One thing in these files runs ahead of the released app, and only one. The
empty state's wording in `vorlaut-sammlungen-leer.html` is vorlaut-app's `main`
rather than `v0.6.0`: the sentence named `.obz`, which is the extension of the
two exports that are *not* for this app, and the fix landed after the tag. The
file says so in a comment, so a later reader does not mistake a lead for a
regression.

They import `components.css` and use it. The first pass at `screens.css`
redefined `.notice`, `.empty`, `.sheet` and the footer before noticing all four
were already in that file — which is the drift `components.css` was written to
stop, arriving from a fourth product. What is left in `screens.css` is
vorlaut's own layout: a Sammlung row and what is wrong with it, the foot the
list stands on, and the warning rows. Product layout is identity, not
vocabulary.

Two names are deliberate. The page header is `.appbar` and not `.head`, because
`components.css` owns `.sheet > .head` and says its vocabulary is small,
reused, and has to be scoped. And a Sammlung row is `.sammlung` and not
`.collections__item`, because that is the family's *sidebar* row — a name and a
count down the side — where this is the main surface of a viewer whose whole
job is choosing between Sammlungen.

The wording is German throughout, matching the board, and so is the app's.
`app/src/main/res/values/strings.xml` is the German base and `values-en/`
carries the English; the header comment on the base file says why, and it is
not a shrug — these are German boards, built by German-speaking families, on a
device handed to a German-speaking child, and bildhaft made the same call for
the same kind of reason. What the viewer does not have is the *picker*: on the
web `TEXTS` in `boot_data.ts` carries `de` and `en` behind one, while the
Android viewer follows the device locale. The header says it should end up
there too.

## The two editors

`vorlaut-editor.html` is a different kind of mock from the screens above. Those
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

## Ein Paket auf das Tablet

`vorlaut-senden.html` and `vorlaut-empfangen.html` are the two halves of one
proposal, and like the two editors above they draw something that does not
exist. Today a tablet Sammlung reaches a tablet as a file somebody carries:
the editor downloads `<name>-app.zip`, and the rest is a cable, a stick, or a
share sheet. The proposal is that the editor can hand it straight over on the
home network, and that the viewer can be told to listen.

The exchange rule this has to respect is directional, and it is easy to read
backwards. `exchange/SPEC.md` §5.2 permits a METACOM licensee to bake their own
symbols into a package **for the person they support** and put it on that
person's device — that is the sanctioned case, not the forbidden one. What §5.2
forbids is the package's bytes leaving the *viewer* afterwards: no export, no
sharing, no backup upload. A viewer that only ever receives gives none of that
up, which is the shape drawn here.

**The address is the whole design problem.** It is four numbers, and the two
halves of the proposal show the same four numbers in the same grouping: read
large on the tablet, typed into four boxes in the editor, dimmed in the same
two places on both. What has to be copied is picked out on the screen it is
copied from.

Four boxes rather than one field is `pin.css`'s argument, reused: one field
with four numbers in it asks somebody to count what they typed. The differences
are what the content forces — three digits to a box, nothing masked, and the
two boxes that rarely change stepped back to an outline once an address has
been sent. They stay editable, because `192.168` is a habit and not a rule: a
Fritzbox hands out `192.168.178.x`, most other routers `192.168.0.x`, and a
network on `10.x` is ordinary. Hard-coding the first half would work in most
German homes and strand the rest.

`vorlaut-empfangen.html` takes `?state=`: `liste` (default), `wege` — the two
ways a Sammlung can arrive, asked before the file picker rather than instead of
it — `warten`, `laeuft`, `fertig`.

**`laeuft` does not name the Sammlung, and the first draft of this page did.**
It said „Kernvokabular" wird empfangen … , which the receiver cannot say: the
body is raw bytes, so the name is *inside* them and unreadable until the
importer has been through the whole archive. All the device has while bytes are
arriving is a Content-Length. The fix could have gone either way — one agreed
request header carrying the name would have bought the sentence back — and it
went this way deliberately. A name in a header is a *claim* by the sender; the
name in the package is the *fact*. Showing the claim during the transfer and
the fact a second later is a way to put a sentence on screen that the next
sentence contradicts, and it would give one fact two sources that can disagree.
So the screen says „Ein Paket wird empfangen …" with the size, and the outcome
line names the Sammlung once it has been read. The wire carries no name.

Two things it deliberately does not draw. There is **no progress bar**, and
that is now the family's answer rather than a gap. `Notice()` in vorlaut-app
grew `busy` and `onDismiss` at 4acc32e; of the two, only the ✕ came up to
`components.css`, at 13c429d. `busy` was refused, and design.md §4.3 records
why: §4.3 sends progress to "the control that started it", so a busy outcome
line is a second *kind* of message rather than a missing rule under the
existing one, and §4.2 closes the motion budget at 130ms for colour and 220ms
for size or position — an indeterminate loop is neither. So this screen says
"wird empfangen" on the same plain plate it later says "ersetzt" on, and the
plate carries the ✕. And there is **no confirmation before sending**: the package is already
built at that point, and sending it to the wrong tablet in your own house costs
one wrong Sammlung in a list that has a Entfernen.

**The scaffolding is not the proposal.** `vorlaut-empfangen.html` needs the
Sammlungen screen's fixed foot to draw the door in its frame, and carried it in
a local `<style>` while `vorlaut-sammlungen.html` still showed the older layout,
where the button was the last item in the list and every row had a 56dp
picture. That mock has caught up, so the rule moved to `screens.css` as
`.fussleiste` and there is one copy of it.

**It was measured, and it works — behind a permission the browser has only
just begun to ask for.** The blocker named here was the wrong one, twice over,
and being wrong about it changes what these two pages owe.

*Mixed content is not what stops this.* Chrome does not apply mixed-content
blocking to a private address. From `https://lautstark.github.io/vorlaut-editor/`
a `fetch()` POST to `http://192.168.0.176:8765/` went through and answered 200,
with only a warning in the console — 3 MB confirmed end to end in the page, and
a 48 MB body arriving complete at the receiver. The control says the carve-out
is real and specific rather than an accident of the profile: the same POST to
`http://example.com/` is refused outright, `blocked=mixed-content`, *This
request has been blocked; the content must be served over HTTPS*. Chrome
151.0.7922.174 on macOS, fresh profile, no flags.

*Private Network Access is not the mechanism either*, and the header this
section was written around is dead. Chrome 151 never sends
`Access-Control-Request-Private-Network` — its preflight carries
`Access-Control-Request-Method` and `-Headers` and nothing more — and a
receiver that deliberately omits `Access-Control-Allow-Private-Network` is
accepted exactly the same. Nothing on the tablet needs to know the words
*private network*.

*What decides it is a permission.* `navigator.permissions.query({name:
'local-network-access'})` answers `granted` in Chrome 151 as it ships, which is
why the transfer passes unremarked. Local Network Access is PNA's successor and
it is a user permission, not a header handshake. Run the same Chrome with
`--enable-features=LocalNetworkAccessChecks` and the query answers `prompt`,
the request stalls, and the receiver sees no byte — until somebody clicks
**Allow**, after which the same 3 MB lands, 200, in about two seconds. A
permission granted through DevTools instead of the prompt does *not* satisfy
it: the request still dies with `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`
and *Permission was denied for this request to access the `local` address
space*. The click is the thing.

*And past the click the receiver's side is plain CORS.* With the checks on and
the permission granted, three receivers were tried — one answering
`Access-Control-Allow-Private-Network`, one `Access-Control-Allow-Local-Network-Access`,
one neither — and all three took the POST and answered 200. vorlaut-app needs
`Access-Control-Allow-Origin`, `-Methods` and `-Headers`, and nothing else.

**The case that fails is a browser that enforces the checks without asking.**
Samsung Internet 30 (Chromium 143.0.7499.194), on the tablet this is for — an
SM-X130 on Android 16, same wifi — refused in 450 ms with no prompt at all:
`net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, *Permission was denied for
this request to access the `unknown` address space*. That is not a tablet
problem; the tablet is the receiver and never runs the editor. It is a warning
about the **sender**: a Chromium with the checks on and no permission UI is a
dead end, and neither end can do anything about it.

So — **works on Chrome: today silently, tomorrow behind one Allow.** What that
cost these pages is one state, and `vorlaut-senden.html` now draws it: „Der
Browser hat den Weg nicht freigegeben", beside the older „keine Antwort an
dieser Adresse". They are deliberately two cases and not one message. On screen
the two failures look the same and their fixes are opposite — one is a number
to re-read, the other is a permission in the address bar — so somebody who
dismissed the prompt and was told „steht auf dem Tablet eine andere?" would
check a correct number until they gave up. The refusal keeps the address
standing, because it is right, and its foot offers Speichern rather than
„noch einmal senden": a second attempt meets the same refused permission until
it is taken back in the browser.

Two things stay untested and are worth settling before this is built.
**Safari and Firefox were not tried** — neither implements LNA, and whether
either exempts a private address from mixed-content blocking at all is
unknown, while the editor runs on whatever browser the adult has. Chrome on
Android was not tried either, for want of a tablet whose Chrome had ever been
opened; it matters only if somebody edits on one tablet and sends to another.
And the fallback, if a sender turns out to be a refusing kind, is not another
transport: nothing a page can do rescues it, so the sending half would have to
stop being a page. Serving the editor over plain `http` would put both ends in
one address space and ought to sidestep the checks entirely — untested, and
academic while GitHub Pages will not serve it that way. Speichern stays either
way: the path that always works does not leave.
