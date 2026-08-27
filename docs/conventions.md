# How the Lautstark tools are built

Companion to [design.md](design.md). That document is how the products **look**;
this one is how they are **built** — the data model behind a Sammlung, where a
preference is kept, which library talks to IndexedDB, and which way a dialog
resolves. It exists so that moving between mitreden, bildhaft and vorlaut never
means working out how it is done here.

Three products, one tool with three outputs: [mitreden] gives a sentence a
voice, [bildhaft] gives it symbols, [vorlaut] puts it on a key you can press.

[mitreden]: https://github.com/Lautstark/mitreden
[bildhaft]: https://github.com/Lautstark/bildhaft
[vorlaut]: https://github.com/Lautstark/vorlaut-diy-talker

## How to read this

Every rule is **the decision, the reasoning, and who currently diverges**. A rule
with nobody diverging is a description; a rule with somebody diverging is work
that has not been done, and naming who owes it is the point — an agreement
nobody is behind on is an agreement nobody had to keep.

Section 4 is the opposite list: differences that are **correct** and must not be
tidied up. It is there because the failure this document is written against runs
in both directions. A convention nobody wrote down gets re-invented three times;
a difference nobody justified gets "fixed" once, by somebody being helpful, and
the reason it existed is discovered afterwards.

design.md settles the vocabulary — the word is **Sammlung**, and §3.6 carries
the full glossary. Nothing here re-decides it.

**The Android viewer is out of scope, deliberately.** `Lautstark/vorlaut-app`
renders a package on a tablet and shares nothing here: this document is about
three browser products, and what they share is CSS and a handful of ES modules.
It is named rather than left out so that a reader can tell it was excluded and
not forgotten — and because it is not ungoverned. `exchange/SPEC.md` in vorlaut
holds its side of the contract, and is the one document in the family with real
versioning discipline, for the reason the rule about the rules gives: a package
on somebody's tablet is a file on a device nobody here controls.

### The divergence lists go stale in hours, not months

Every "Diverging:" line is an audit, and an audit is a photograph. While the
three products are moving at the rate they are, the shelf life of one is
measured in hours: §1.4 named vorlaut for keeping no `updatedAt`, which was true
when it was written at 12:52 on 2026-08-24 and false by 14:06, when vorlaut
grew a list of Sammlungen and the ordering with it. Nobody was wrong; the
document was 74 minutes old.

So a divergence line is a lead, not a fact. Read it against the code before
acting on it, and when it turns out to be spent, say so on the page rather than
deleting it quietly — a list that is only ever corrected in silence gives no
sign of how much of the rest of it is also a photograph. Three of the entries
below now carry the date they were settled and what settled them, which is what
that looks like.

### One rule about the rules

**Every decision here is made on merits, and nothing is justified by the cost of
moving to it.** These products have one user, who is the person writing them,
and whose own data is disposable. So there are no migrations, no deprecation
paths, and no tolerating an old shape "during a transition": where a design is
right, it is adopted and the old one deleted in the same change. A convention
argued from what it would cost to adopt is not a convention, it is an excuse
with a table around it.

That condition will not hold forever, and this paragraph is what to re-read when
it stops. Two things are already outside it, and they are outside it for the
same reason.

The **`.obz` exchange format** — once a package reaches somebody's tablet it is
a file on a device nobody here controls, so `exchange/SPEC.md` keeps its
versioning discipline and its compatibility rules.

**A person's IndexedDB**, from the day a product is advertised. The sentence
above transfers to it without a word changed: a database in a carer's browser is
on a device nobody here controls, and nobody here can put back what an upgrade
drops from it. The disposable data this rule is written around is the author's
own; a child's communication board is not it, and *"you should have configured a
backup"* is not a sentence that can be said to the person who lost one. So a
schema change carries the data across or refuses to touch it — it does not clear
the stores and start again. vorlaut settled this on 2026-08-27 (ADR 0015: one
step per version, inside the `versionchange` transaction, or abort and leave the
database exactly as it was found), and bildhaft settled it identically the same
day (ADR 0001, with `docs/schema-upgrades.md` weighing the ways out). mitreden
keeps its Sammlungen the same way and has the same premise expiring.

Both are entries on a short list of exceptions, not arguments against the rule,
and the list is short on purpose: the reason either one is on it is a device
nobody here controls, so nothing gets on it by being merely inconvenient to
change. The rest of the paragraph stands. There are still no deprecation paths
and no tolerating an old shape "during a transition", the migration an upgrade
runs is a step that finishes rather than a compatibility mode that lingers, and
everything else internal is fair game.

---

## 1. The Sammlung

### 1.1 Identity is a UUID

`crypto.randomUUID()`, minted once, opaque, never derived from the name and
never re-derived.

**Why.** A key derived from a name has to answer three questions that a UUID
does not have: what happens when the name is edited, what happens when two names
reduce to the same key, and what happens when the reduction truncates mid-word.
mitreden answers all three — `normTag`, `freeKey`, and an idempotence rule
(`normTag(normTag(x)) === normTag(x)`) that every caller storing a key and later
looking it up silently depends on. That is real care spent on a problem that
only exists because the identity was made out of a mutable field. A UUID also
makes renaming free, which matters when the name is a live input (§1.6): a
derived key either goes stale on every keystroke or has to be deliberately
frozen, and both are worse than not deriving it.

**Diverging: nobody**, as of 2026-08-25. mitreden's key was `normTag(name)` and
it is `crypto.randomUUID()` now. The collision this section predicts was not
hypothetical there: `createCollection`, given a name, looked the derived key up
and handed back whatever it found, and an import names the Sammlung after the
file it came from — so two files whose names agreed for 24 characters produced
one Sammlung, and the second import's sentences went silently into the first
one's. That is the argument for this rule, and it is a better one than renaming
being free.

### 1.2 Which Sammlungen are open are persisted, in the app's own settings record

Not in `localStorage`, not in memory: in the same IndexedDB settings record as
every other preference.

**Why.** Coming back to the one you were in is the whole of what "open" means; a
Sammlung that has to be re-found on every visit is a filter, not a place. It
goes with the other preferences because a preference living in two stores is one
that gets restored by one of them and overwritten by the other — and because
`localStorage` is the wrong store for anything the rest of the state is not in:
it is synchronous, it is a different eviction policy, and it survives a database
being cleared, which means "start again from nothing" leaves a pointer to a
Sammlung that no longer exists.

**Diverging: nobody**, as of 2026-08-25. mitreden's `OPEN` was module state, so
every reload landed on whichever Sammlung happened to be first.

**And it is the set, not one of them.** This section was written in the singular
against a family where two products can only have one open, and mitreden can
have several — its rail multi-selects (§4.2, which is about the open set and not
about arity; corrected here 2026-08-25). Restoring one of
two would be worse than restoring none, because a person would read the second
as having been closed rather than as not having been restored.

### 1.3 The sidebar-collapse preference is persisted in the same place

**Why.** It is a choice about the shape of the window, which is not one to
re-make every visit; and having decided §1.2, a second answer for a second
preference is how a settings record stops being the settings.

**Diverging: nobody**, as of 2026-08-25. mitreden kept it in `localStorage`
under `mitreden.rail` and it is in the settings record now.

The language and the colour scheme are still in `localStorage` in all three, and
that is not this rule left half-done. Both have to be readable *before the first
paint* or the page shows the wrong answer and corrects itself, which rules out
the database the sentences live in. A sidebar arriving a frame late costs
nothing. The test is whether the preference is needed before the store can
answer, not which store is nicer.

vorlaut was named here for having no collapse at all. It has one, in the
settings record beside every other preference, and it arrived with the sidebar
this section describes. Another photograph — see the note at the top.

### 1.4 Ordering is last-edited first

`updatedAt` descending, so the Sammlung being worked on rises.

**Why.** Creation order answers a question nobody asks. What a sidebar is for is
getting back to what you were doing, and after a handful of Sammlungen creation
order reliably puts that at the bottom. It also gives `updatedAt` a reader,
which is what stops it being a field that is written and never used.

**Diverging: nobody**, as of 2026-08-25. mitreden ordered by creation and now
keeps an `updatedAt`.

**What moves it is the half worth stating.** A rename is the one edit nobody
actually does; what "last worked on" means is a sentence added, recorded or
corrected. So the stamp moves on those too — mitreden's storage bumps every
Sammlung a written or deleted sentence belongs to, in the same transaction.
Moving it on renames alone would have satisfied the rule as written and answered
nothing, while looking right.

vorlaut was named here too, and the entry was true the moment it was written:
this document audited a vorlaut that had one board, and one board has no order.
It grew a list the same afternoon — `updatedAt`, this rule, and a strictly
increasing stamp so that two writes inside one millisecond still have an order —
about an hour after the audit was filed. Left standing as long as it was because
a divergence list only means anything while somebody re-reads it against the
code.

### 1.5 A new Sammlung is named for the day, and the name is selected

`"Sammlung vom 24.08.2026"`, uniquified with ` (2)`; then focus the title input
**and select it**, so the first keystroke replaces the date.

**Why.** A new notebook gets a date. It is a true answer for the many Sammlungen
nobody will name, and it sorts and reads sensibly when there are several. The
selecting is the half that is easy to leave out and is the whole difference
between a suggestion and a thing that has to be deleted first: an unselected
default name is a small chore charged on every creation.

**Diverging: nobody**, as of 2026-08-25. vorlaut was named here for
`"Board 1"`, focused but not selected; it names for the day and selects, and did
so from the commit that gave it a list of Sammlungen to name at all — the same
one that spent §1.4's entry. It uniquifies by minting a fresh id rather than by
` (2)`, because two of its Sammlungen may genuinely share a name and the
identity is never the name (§1.1); what the rule is about is the suggestion, not
the uniqueness.

**bildhaft was doing neither half, and this line said nobody was.** Its
`handleNewCollection` created the Sammlung, repainted, and stopped — no focus,
and `select()` appeared nowhere in the product. So the invented name was a chore
to delete on every single creation, which is the exact cost the paragraph above
describes. Fixed 2026-08-25.

**And the reason nobody caught it is worth more than the fix.** Both other
products cover this, and both assert `toBeFocused()` and stop — which is the
test that passes against precisely this bug, because focus without selection is
indistinguishable from focus with it until somebody types. A rule with two
halves needs a test with two halves, and the honest one here is behavioural:
type a character and assert what the field ends up holding. bildhaft's new
`e2e/collections.spec.ts` does that; the other two still do not, and would not
notice if either of them lost `select()` tomorrow.

That is the same shape as §3.4's second call site: a check that stops at the
first thing it can see. There, one violation was found and the search ended;
here, one half of a rule is asserted and the other is assumed.

### 1.6 Renaming is typing in the title, never a dialog

The name in the work head **is** the field (`.title-input`): debounced while
typing, flushed on blur, Enter blurs.

**Why.** Renaming a thing you are looking at should be typing over its name. A
dialog for it invents a state nobody needs — the name typed and then abandoned —
and asks for two more decisions (where the entry point goes, what Cancel means)
that the field answers by not having them.

**Diverging: nobody.** All three agree, and arrived here separately.

### 1.7 Deleting asks through a `<dialog>` that names what goes

The question names the Sammlung **and counts what is inside it**; the confirm
button is labelled with the act — `"12 Zeilen löschen"`, not `"OK"`. Every other
way out of the dialog does nothing at all.

**Why.** A row in the sidebar shows a name, so the name alone does not say
whether three evenings' work is behind it — the count is the only thing in the
question that could change somebody's mind. And a button reading "OK" asks the
reader to hold what it refers to in their head; a button reading what it will do
cannot be misread. design.md §3.6 settles the wording; the count and the dialog
are this document's half.

**Diverging: nobody**, as of 2026-08-25 — and it had been true for some time
before anybody wrote it down here. mitreden moved to `confirmDialog` when it
took §5's dialog layer, and this line went on naming it for long enough to be
worth the note: a divergence list is only as good as the last time somebody read
it against the code.

### 1.8 A row in the sidebar carries a count

Name, then how many things are inside.

**Why.** It is the fact that tells two similarly named Sammlungen apart, and it
is what makes §1.7's count credible before the question is asked rather than a
number that appears for the first time at the moment of deletion. The argument
against it — that at the moment of reading a list the question is only *which*
one — is true of the first read and wrong from the second onwards.

**Diverging: nobody**, as of 2026-08-24. vorlaut was named here for drawing the
name alone, which reversed an earlier decision of its own; its rows carry the
count, and the count is what §1.7's question is asked with. All three draw it
through `@lautstark/design/collections` now (§5 5b), so it is one row rather
than three that could drift apart again.

### 1.9 There is always one

A thing being made always belongs to a Sammlung, so one always exists: the first
visit creates it, and deleting the last one creates the next.

**Why.** mitreden's `ensureCollection` puts it best — it removes a whole class
of question the interface would otherwise have to ask. Without it every path
that writes has to answer "where does this go" with no good answer, and the
empty state has to teach two things at once.

**Diverging: nobody.**

### 1.10 Import adds; it never replaces

A Sammlung arriving from a file joins the ones already here, with fresh ids
where the format carries none. Whole-library restore is the exception and is a
different act, behind its own question.

**Why.** The two acts are asked for in different words — "open this" and "put my
machine back" — and only one of them is destructive. Replacing on import makes
the file's contents and the library's contents mutually exclusive for no reason
anybody asked for: the person has both, and wanted both. The argument for
replacing is that merging has to decide what an arriving Sammlung and a stored
one with the same id *are*; that question is answered by not asking it — the
arriving one becomes a new Sammlung, and nothing stored is touched.

**Diverging: nobody**, as of 2026-08-25. vorlaut's `.obz` import replaced the
open Sammlung and now makes a new one, named after the file it came from.

---

## 2. Storage

### 2.1 IndexedDB through `idb`

`idb@^8`, a typed schema, real object stores with indexes — not one JSON array
under a key.

**Why.** Two things, and the second is the one that bites. A store per kind with
indexes is what makes "the sentences in this Sammlung" a query rather than a
filter over everything, and it is what makes a count cheap enough to put in a
row (§1.8); a JSON array under a key means every read is a whole-library read
and every write is a whole-library write. And the raw API has a trap that each
product otherwise learns separately: a transaction stays open only while
requests are outstanding on it, so awaiting anything that is not an IndexedDB
request — a digest, a fetch, a timer — commits it underneath code that believes
it is still inside one. `idb` does not remove the rule, but it is one place
where the rule is understood rather than three.

**Diverging: nobody**, as of 2026-08-24.

vorlaut moved on 2026-08-24, from hand-rolled request callbacks and a single
`content` store holding the registry as one record with every layout beside it
under a `layout:<id>` key. It has a store per Sammlung and a store per layout
now, and the index this rule asks for is on `updatedAt`, with the two readers
that make it worth having: §1.4's order is a walk from one end of it and the
next stamp is one cursor step to the other. The typed schema paid for itself
twice on the way in — a `StoreName` member named a store that was not in the
database, so any call using it would have thrown at run time, and `updatedAt`
was optional while being an index key, which does not mis-sort a record, it
leaves it out of the index. Neither is a thing a hand-rolled store could have
said. There was no migration and no carrying-across: the upgrade drops every
store it finds, which is the rule about the rules above.

mitreden moved the same day, and was the more interesting half: it had used
`idb` since the day its storage was written, so nothing about the library was
missing — the whole library simply sat in a `meta` store as two JSON arrays,
one under `phrases` and one under `collections`. It had the dependency it
declared and none of the indexes, which is the case this rule exists to name.
The membership index is the one that pays here, and it paid twice over at the
time: mitreden's arity was *many*, a sentence was in the morning Sammlung and
the nursery one at once, and that is precisely the shape a multiEntry index is
for and a filter over everything is worst at. **As of 2026-08-25 it is an
ordinary index on one field** — arity went to one (§4.1), and the version 4
upgrade replaced the multiEntry index with a plain one. What this rule is about
survives the change unaltered: the lookup is an index, not a scan of the whole
library. The other
reader is §1.8's count, which had meant loading every sentence to tally.

Its storage layer also carries the answer to a question the rule does not ask
and every adopter will meet: an index key has to be *in* the record, and the
two things mitreden sorts and looks up by — the normalised text, and the order
the Sammlungen were made in — were not fields the program had. They live in the
stored record and are stripped on the way out, so the types above the storage
layer are unchanged and no Sicherung carries them. That last part is worth
copying rather than the mechanism: a bookkeeping field that leaks is a field
nobody meant to publish, sitting in a file somebody keeps for years.

### 2.2 Every write that changes what a Sicherung holds says so, at the write

One `touched()` notifier next to the writes, not at the call sites.

**Why.** The alternative fails silently and identically in all three: somebody
adds the thirteenth mutator next year, having never heard of the backup, nothing
goes red, and a child's talker quietly stops being saved. Putting the notifier
at the writes makes the rule local to the thing it is about — a new mutator is
in the same file as the line that says what a mutator does.

**Diverging: nobody.**

### 2.3 What a Sicherung carries, and what it must not

Everything irreplaceable, and nothing derived, credentialled or licensed: never
an API key, never a path into a licensed collection or a count of what is in it,
never output that a rebuild would reproduce.

**Why.** A chosen folder is very likely inside a sync client, so what goes in it
leaves the machine — to somebody's cloud, then to every device sharing the
folder. A key there is a paid credential handed to whoever has the folder, and
anything derived from a per-person licensed collection is that licence leaving
with it. The list of what counts as derived is per product; the rule is not.

**Diverging: nobody.**

---

## 3. The page, and its plumbing

### 3.1 The page is a sidebar shell

Sammlungen down the side, the open one in the middle. Below roughly 820px the
sidebar becomes a layer over the work with a scrim, rather than a column beside
it; on a desktop it collapses and remembers (§1.3).

**Why.** All three arrived at it independently, which is weak evidence on its
own and strong evidence when the rows, the counts and the button underneath them
match too. What it buys is that the three open looking like one application, and
that the level above the work — which is the level people lose track of — is
always on screen and always in the same place.

design.md §4.4 listed the navigation shell as explicitly *not* shared until
2026-08-24. That line was written when two products had independently invented a
sidebar and it read as a coincidence; three is not a coincidence, and "not
shared" had come to describe three copies rather than a freedom anybody was
using.

**And the narrow screen is part of the rule, not a footnote to it.** This
section said "below roughly 820px" from the day it was written, and the
divergence line under it said *on having one* — a hedge that quietly scoped the
audit to whether a sidebar existed and left the breakpoint, the layer and the
scrim unexamined. Two products broke at 820px into a drawer over a scrim; the
third became a row across the top of the work at 620px, and nothing in this
document said so, because nothing had asked.

The row was not a lapse. It was argued in the stylesheet, and its argument —
that hiding the list would strand somebody on whichever Sammlung they opened on
— is true, and is not an argument for a row: a drawer answers it too. What the
row cost was measurable, and measuring it is what settled this: 234px of an
812px phone was furniture before the work began. A layer costs nothing until it
is asked for.

Three things go with the layer, and the third is the one that is easy to leave
out. The `‹` that collapses a column is hidden, because down there there is no
column. The remembered collapse (§1.3) must be *ignored*, not consulted:
otherwise a sidebar put away on a laptop arrives on the phone as a drawer that
cannot be opened — `display: none` beats the open state, and the `☰` does
nothing. And choosing a Sammlung dismisses the layer, because it is in the way
of the thing that was just asked for.

**Diverging: nobody**, as of 2026-08-25 — on having one, and now on what it does
when the window is narrow.

### 3.2 Einstellungen is at the foot of the sidebar

**Why — and this is the one rule here that is arbitrary.** mitreden's reasoning
for a `⚙` beside the title is good and written down: beside the title is where a
page-wide setting belongs, not down at the list, which would suggest it changes
something about the list. bildhaft's placement is deliberate too. Neither is
wrong; what is wrong is three products with two answers, and a document that
records the better argument and leaves the split standing has done nothing.

The foot wins because a sidebar that ends in the way out of the page reads the
same in all three, and because the objection it has to answer is answered by the
separator and the gap already above it.

**And §3.10 takes the objection away rather than paying for it.** mitreden's
argument was that a settings entry at the foot of the list suggests it changes
something about the list. In vorlaut today it does: that sheet holds the open
Sammlung's voice and the language the built device shows its own menu in, so
somebody who read the entry as belonging to the list would have read it
correctly. That is not a cost of the placement, it is two controls in the wrong
sheet — and §3.10 is what moves them. Once they have moved, nothing behind the
entry answers differently from one Sammlung to the next and the objection has
nothing left to point at. One sentence was carrying two arguments, about where
the entry sits and about what is behind it; separating them is what settles
this section, and it settles it *for* the foot.

**Diverging: nobody**, as of 2026-08-25. mitreden's `⚙` is at the foot of its
rail. Another line that had been spent before it was read — the same lesson as
§1.7.

### 3.3 The work head is one row

`title-input · count · the product's one whole-Sammlung action · ⋯`

bildhaft puts *Drucken* in the third slot, mitreden *Herunterladen*, vorlaut
*Aufs Gerät übertragen*. The slot is shared; the verb is the product's.

**Why.** It puts the name, the size and the acts on the thing next to each
other and next to the thing itself. An action on the whole Sammlung that lives
in the page header instead is one the reader has to connect to its object by
inference — and in a page that can switch Sammlung, that inference is exactly
the one that goes wrong.

**Diverging: nobody**, as of 2026-08-24. vorlaut's transfer button was in the
page header when this was written; it now sits in the work head's third slot,
which is also where its device preview went, and there is no page header left
for it to sit in — §3.1's rule that the topbar is hidden on desktop took the
header away, and the two acts had nowhere else to go.

### 3.4 Dialogs are native `<dialog>` with `showModal()`

No `window.confirm`, no `window.prompt`, no hand-built overlay. The platform
gives the top layer, the focus trap, the inert background and Escape; what a
product adds is dismissal by pressing outside, because `::backdrop` is a
pseudo-element and takes no clicks.

**Why.** The hand-built version traps nothing — Tab walks out of the sheet and
into the list behind it — and a native prompt is drawn in the browser's own
chrome, which no token reaches, so it is the one surface in the product that
cannot follow the scheme. design.md §2 records both.

**What the platform gives, and what a reader would not learn from this page.**
`showModal()` is doing more than centring a box: it puts the dialog in the top
layer, makes everything behind it inert, traps Tab inside it, and closes on
Escape. That is the whole reason the rule is "use the native element" rather
than "trap focus carefully" — none of it has to be remembered, and a hand-built
overlay gets none of it. `@lautstark/design/dialog` adds the two the platform
does not: dismissal by pressing outside, because `::backdrop` is a pseudo-element
and takes no clicks, and focus landing on **cancel** rather than on whatever
`showModal()` would have found first, so that the default target of a confirm is
never the destructive one.

**One rule about the promise, learned the hard way:** a confirm resolves from
the buttons, with a `settled` guard, and uses the `close` event only for the
dismissal paths. Resolving from `close` alone is tidier and hangs forever on any
host that closes the dialog without firing it — the caller waits for the life of
the page, and what the person sees is a button that did nothing.

**Diverging: nobody**, as of 2026-08-25. mitreden had a native `confirm()` for
destructive acts and a native `prompt()` for editing; it has neither now, and
there is no `window.confirm`, `window.prompt` or `window.alert` left in any of
the three.

vorlaut was recorded here as compliant and was not. Its set delete asked
through `window.confirm` — one call site, in `src/editor-diy/editor.ts`, left
behind when the rest of the product moved to `confirmDialog` — so the one
surface in the family that no token reaches was still being drawn in the
product this line said had nothing to fix. It failed §1.7 twice on the way:
the question named the set and counted nothing inside it, which is the only
fact in it that could change somebody's mind, and the confirming button said
"OK". It is a `<dialog>` now, as of 2026-08-25, counting the keys with
something on them rather than the four slots, which are always four. Left
standing as long as it was for the reason §1.4 gives — a divergence list only
means anything while somebody re-reads it against the code, and a line saying
somebody complies is the one nobody thinks to re-read.

**And there was a second one, which is the more useful half of the story.** A
later sweep found `window.confirm` still on vorlaut's whole-library restore, in
`src/shell/settings.ts` — the act that replaces every Sammlung in the browser,
asked in the browser's own chrome with "Fortfahren?" and naming none of what it
would take. It failed §1.7 the same way the set delete did: a person with one
Sammlung and a person with nine got the same sentence, when the number is the
only thing in the question that could change a mind. It is a `<dialog>` that
counts, as of 2026-08-25.

Two call sites, two audits, and **each audit found one and stopped**. That is
worth naming, because it is not the same mistake as a stale line: finding a
violation feels like the answer to "does this rule hold?", and the sweep ends
there. The first hit is not the last one — grep the whole family, read every
hit, and only then write the line.

The claim that was wrong here was mine to begin with: "there is no
`window.confirm`, `window.prompt` or `window.alert` left in any of the three"
was written after checking *one* of the three, because the divergence line above
it named only that one. A line can be stale, which the top of this document
covers. It can also be **wrong on the day it is written**, which nothing here
covered until now, and it is the more expensive kind: a stale line was true once
and gets re-checked eventually, while a line that was never true reads as
settled and is the last place anybody looks.

### 3.5 One settings panel is open at a time

The settings sheet is a column of folded `<details class="panel">`, each with
its state in its own heading. They are one exclusive group: opening one closes
the rest.

**Why.** The state in the heading is the whole reason the panels are folded —
which voice, whether Azure has a key, which folder is connected — and it is
readable at a glance only while the column is a list of headings. Left
independent, a sheet of nine panels becomes a scroll through everything
anybody has ever opened, and a person looking for one setting reads past four
they are not interested in.

**How.** `name="settings"` on every `<details>` in the sheet. A named group is
the platform's own accordion — it behaves like a radio group — so this is an
attribute rather than a script, in the same spirit as `showModal()` doing the
focus trap. A browser too old for it degrades to independent panels, which is
where all three were anyway.

**Diverging: nobody**, as of 2026-08-24. vorlaut had it; mitreden and bildhaft
adopted it the same day, one attribute each — five characters of markup in
mitreden's `index.html`, one `attrs` entry in the builder bildhaft makes its
panels with. All three carry a test that opens a second panel and asserts the
first closed, because nothing else in a suite references an attribute like this
one and a green suite is what let two of them go without it for so long.

### 3.6 The overflow menu is `⋯`, and it holds what belongs to the whole Sammlung

Anchored to its trigger, `role="menu"`, focus moves into it on open and returns
to the trigger on Escape or on choosing. Contents, in order: export, then
whatever this Sammlung is itself set to, then delete, marked destructive.

**Why.** What applies to a Sammlung as a whole — the acts on it, and what it is
set to — is rare enough that none of it earns a permanent button, and
consequential enough that none of it should be hard to find. A menu beside the
name is where both belong, and for one reason rather than two: each is answered
by *which* Sammlung the menu is beside, which is §3.10's test read off the page
instead of out of a store. design.md §3.6 settles the glyph.

**Amended 2026-08-25: settings as well as acts, and the heading with them.**
This section said *acts* alone from the day it was written, and a settings
surface is not one — read strictly, what is true of one particular Sammlung had
nowhere on the page to be, which is how it ends up in the app's sheet instead
(§3.10). vorlaut's tablet editor has been stretching the sentence for as long
as it has existed and the document never noticed: `collectionMenuExtras()`
hands the shell a *Raster* card from `editor-app/editor.ts` — grid size, the
shared first column, the colour of a word class — and the card's own note says
why it belongs to the Sammlung and not to the page, because a key that lies in
the same place on every page is a fact about the whole layout. That was right,
and it is the shape the rest of it takes. So the menu holds what a Sammlung
*is* as well as what can be done to it, and the ordering above is what keeps
the two legible: the exports first, the settings under them, the delete last
wherever it appears.

**The keyboard contract, which no product implements and all three have.** A
menu is not a `<div>` of buttons that happens to be visible: `@lautstark/design/menu`
moves focus into the list on open, walks it with the arrows and Home/End,
returns focus to the trigger on Escape or on choosing, and claims Escape at
capture — so a menu inside a dialog closes the menu on the first press and the
dialog on the second, rather than both at once. A disabled item is skipped
rather than landed on, which is the difference between "the first item" and
"the first enabled item" in a menu whose export is disabled while the Sammlung
is empty.

It is written here rather than left to the package because the package is what
makes it true today, and a fourth product hand-rolling a menu would pass review
looking correct. The behaviour is the convention; the package is how it is kept.

**Diverging: nobody**, as of 2026-08-27, on the glyph or the contents. vorlaut
kept its export in a settings panel; everything it writes is in the `⋯` now,
above the delete. A talker Sammlung has four entries there — the document, the
app package, the device's own `.obz`, and the build written into a folder — and
a tablet Sammlung has the one act that is its own, the app package. The settings
panel holds only the way *in*: importing is not an act on one particular
Sammlung.

**The third one is closed, and not by anyone arguing it.** This section carried
an open question from 2026-08-25. The sweep for §3.10 had found vorlaut's
*Gerät* panel writing the open Sammlung's build into a folder — an act on one
particular Sammlung, sitting in a sheet — and it was named here rather than
counted as a divergence, because its own note says it exists for the machine
where the cable is not working, and an act whose whole purpose is that the
ordinary route has failed is a poor test of a rule about where the ordinary
route lives.

The panel is gone. `editor-diy/folder_build.ts` registers the folder write
through `collectionMenuExtras()`, so it is an entry in the `⋯` like the three
beside it, and what is still called *Gerät* in vorlaut is a row in the transfer
sheet naming which talker is about to be written to — a summary of what the
press will do, not a thing to press. Nothing that acts on one particular
Sammlung is left in a sheet of the app's own.

The exception was never argued to a conclusion; it stopped existing when the
screen around it was rebuilt for other reasons. That is the ordinary fate of
one, and the reason to write it down rather than resolve it in silence: it had
somewhere to be found when the ground moved under it.

### 3.7 A folder the browser has taken access to is a warning, not a note

Two different things in this family hand a product a folder: `@lautstark/sicherung`
for the backup, `@lautstark/bildquelle` for a licensed symbol collection. Both
store a handle, and both meet the same state — **the handle is still there and
the browser has withdrawn the permission on it.** Chromium does this between
visits; it is ordinary, and it is not an error.

It is still the state in which *the thing is not working*: nothing is being
backed up, or no symbol resolves. So it is drawn as a warning
(`components.css`'s `.notice.bad`), never as another line of grey prose beside
the descriptive ones, and it says three things in this order:

1. **What is true** — the folder is remembered, nothing has been lost.
2. **What the browser did** — it reset access, and it does that between visits.
   Without this the message reads as the product having mislaid something.
3. **What one press does** — re-confirms the stored handle. No re-picking. The
   button takes `requestPermission()` on what is stored and only falls back to
   a picker when there is nothing stored.

And the heading above it carries a *state* — "Zugriff bestätigen" — not the
instruction. A summary is one line and truncates; design.md §2 settles that a
heading says what a section is set to.

**Diverging: nobody**, as of 2026-08-24. All five surfaces draw it.

**And the rule is not what holds it.** A rule that five surfaces have to
remember is a rule four of them will forget — that is what happened here, and it
is what happened to two of design.md's decisions before that. What holds it is
that the packages answer the question:

- `@lautstark/sicherung/ui` v1.2.0 — `needsAttention(status)`, beside the
  `actionsFor()` that already said *what to offer* in each state. True for
  `needs-permission` and `failed`: the two where nothing is being written and
  nothing resumes by itself. `off` is false, because nobody has chosen a folder
  and nothing is owed.
- `@lautstark/bildquelle` v1.5.0 — the same name over its own status. True for
  `permission-needed` and `error`; false for `no-folder`, which is somebody who
  has not set METACOM up and may never want to, and false for `loading`, which
  ends on its own.

So a product draws the warning by *reading* rather than by *judging*, and a
sixth surface gets it right by construction. What stays with the product is the
words, because two of the three are bilingual and the third is German by
policy — and the sentence has to cover the three things above, in that order.

Both packages carry a test that anything needing attention also offers something
to press. A panel that says something is wrong and hands nobody a button is the
failure the pair exists to make impossible.

### 3.8 What the page reports, it reports out loud

A live region is `role="status"` — which is `aria-live="polite"` — and it is
**in the tree from the first paint, never hidden and never removed**. What
changes is what is *inside* it.

**One for outcomes, and one more for each context that cannot reach it.** The
outcome region is the page's single answer to "what just happened": what
succeeded, what failed, how many arrived, and every act that reports one writes
there. Two things earn a second region, and both for the same reason — the first
one is unreachable, not merely inconvenient:

- **A condition**, something true for a while and drawn while it lasts, like a
  source that cannot be read. It is not an outcome, and sharing one region means
  each overwrites the other. bildhaft has this: a toast and the host its banners
  are drawn into.
- **A modal.** `showModal()` makes everything behind it inert, so the page's own
  status line is not somewhere a reader can be told anything while a sheet is
  open. A dialog that reports an outcome of its own needs its own region.
  mitreden has this: the Azure probe line, which answers "does this key work?"
  inside the settings sheet.

Beyond those two, no. A region per message is how this goes wrong, and it goes
wrong in the way below rather than by being noisy: three regions that each
arrive with their text announce nothing at all, three times.

**Why.** A live region announces a *change* in something the reader was already
watching. It follows that the two natural ways to write one both produce
silence, and neither of them looks wrong:

- **Setting the text and then inserting the node.** The region arrives already
  carrying its message, so there is no change to notice.
- **Toggling it with `[hidden]`, or removing it between messages.** It leaves
  the accessibility tree and re-enters carrying the next one, which is the first
  case again, once per message.

The words are on screen and correct the whole time. Nothing goes red, no
screenshot differs, and no ordinary test touches it — an assertion on the text
passes identically either way, because the text *is* there. That is why this is
a written rule rather than a thing careful people get right: all three products
built the region, and all three built it one of these two ways.

**How it is held.** Each product carries an `e2e/announce.spec.ts` asserting the
two properties the mechanism actually needs — that the region is present and
empty *before* any message, and that after one it is still **the same element**
rather than a fresh node in its place. A test that only asserts the text is the
test that let this through three times.

For a condition region the second property is about the *contents*: the banner
lands inside the host rather than in place of it, and the host keeps its role.
And the banners themselves carry no role — a region nested inside a region
announces twice, which is the failure on the other side of this one.

**And empty, it has to cost nothing**, or the next person removes it again for
the reason bildhaft had. mitreden's and vorlaut's are inline elements with no
content, so they take no room by construction. A styled container does not:
`components.css` gives `.toast` a fill and a padding, so an empty one is a bare
pill at the foot of the screen. The answer is to strip the paint from the empty
state (`.toast:empty`), never to take the node out.

`components.css` also carries `.toast[hidden] { display: none }`, which is the
second bullet above written into the shared package. It is there for a real
reason — an author `display` rule beats the browser's own `[hidden]`, so the
file that takes the attribute's meaning away has to give it back — but the
attribute must not be used on the region itself.

**Diverging: nobody**, as of 2026-08-25 — after a second pass, and the second
pass is the point. mitreden and vorlaut each met this and each fixed it. bildhaft's toast set its text, appended the node, and removed it
again 3.2 seconds later, so every acknowledgement the product made — an
exported Sammlung, a saved picture, a failed import, "Alle Daten gelöscht" —
was silent until this rule was written. Its banner host had the same defect one
floor down and was found by fixing the toast: the same file, the same shape, and
still not noticed until somebody went looking for the second instance of a bug
they had just fixed. Two regions in one product is what this section allows;
neither of them announcing is what it is against.

mitreden's probe line was the third instance, and it was found the same way as
the second — by re-reading a line that said nobody diverges. It was toggled with
`probe.hidden = !azure`, so with no key stored the region left the tree and came
back carrying its next message. It very nearly did not matter: the answer
arrives from a promise, so by then the region was visible and empty and the
change was noticed, and only the synchronous "asking …" was lost. Being right by
timing rather than by construction is exactly what this rule exists to replace,
and it is why the fix is to empty the text rather than to keep the toggle and
argue that it works. That it survived longest in the product
whose users are the reason the family exists is the argument for the rule
living here rather than in three commit messages.

### 3.9 An import graph is not a dependency graph

A test that reads the imports proves one kind of dependency, and it is not the
kind that usually crosses a boundary. Element ids, text keys and event
subscriptions are dependencies written as strings, and no module graph contains
them. So what holds those is not a test at all, it is lifecycle: **a
component's markup is mounted with the component and lives only while it is on
screen**, so a reference into it from somewhere that has no business holding one
throws the first time it is used instead of quietly resolving forever.

**Why.** vorlaut carries `tests/unit/layers.test.ts`, and it is a good test: it
holds that nothing outside an editor's directory may import out of one, and it
exists because three shell modules — the save loop, the symbol picker and the
voices — had each reached for one editor's renderer, one line each, and each of
those lines made the shell unable to draw anything else. Then a second editor
was written, which is the event the test was put there for, and five couplings
between the shell and the first editor came out of the work. Not one of them was
an import:

- `core/save.ts` reaching for `$("releaseBtn")` inside `load()` — a button only
  the DIY editor mounts, named from a shell module.
- the function that verifies a save, shaped around one editor's layout, so that
  it compared `{"sets":[]}` for every tablet Sammlung and was satisfied.
- the sidebar counting what is inside every Sammlung with whichever editor
  happened to be installed.
- the composition root naming one editor at module level.
- a subscription to a shell notifier that outlived the markup it wrote into —
  found by running the page, not by reading it.

The file was green through all five and would be green through the next five.
That is not a defect in it; it is the distance between what it asserts and what
it gets read as. A test that names a boundary is taken to be holding the
boundary, and that is the specific way this one costs something — the seam
looked watched, so nobody went and looked at it.

**What to do about it is not a cleverer test.** A string coupling can be
approximated by pattern-matching and never decided, and each cleverer version
buys one more pattern at the price of a reader believing the rest are covered.
The answer is the lifecycle above: vorlaut's `core/editor.ts` puts an editor's
markup on the page when a Sammlung that needs it is opened and takes it off
again, so a shell module reaching for another editor's element throws on the
first Sammlung that uses it rather than on some later one, and a listener that
outlives its own markup becomes a teardown the mount can ask for. That turns an
invisible coupling into a loud one, which is the most a structure can do about a
dependency written as a string.

**Diverging: mitreden**, on the mitigation rather than on the test. Its page is
one `index.html` carrying fifty-odd ids, all of them present from the first
paint to the last, and `el()` throws only on an id that was never there — so an
element reached for from the wrong layer resolves every time, for as long as the
markup is one file, and nothing in the product can tell the difference between a
reference that belongs and one that does not. bildhaft's sidebar is the shape
this asks for: props in, node out (§5, #5). Neither of them has a second
implementation of anything for a layers test to guard yet, which is the point —
this is the rule for the day one of them does, and the couplings it is about are
the ones that would be in place before that day arrives.

### 3.10 A setting of the app is not a setting of whatever is open

Three products disagreed about where a setting belongs, one product at a time,
and the disagreement had one shape each time: a control that looks like a
preference but edits the thing you happen to have open.

The worked example is vorlaut's voice. `chooseVoice()` in `src/shell/voices.ts`
is `state.layout.voice = id` and then `await save()`, and what it writes is the
**open Sammlung's** `layout.json` — every recording in that Sammlung is spoken
again on the next release, which the hint under the list says out loud. It sits
in the sheet at the foot of the sidebar (§3.2), between the colour scheme and
the Azure key. Open a different Sammlung, reopen the sheet, and the panel shows
a different answer, because it is reading a different file.

That is the test, and it is worth stating as a test rather than as a list of
which settings go where:

> **Does this setting's answer change when a different thing is selected? If it
> does, it is not a setting of the app.**

From which:

- **The app's settings hold defaults for the next thing made.** They apply
  forward and never reach back. mitreden is still the worked case, one level up
  from where this was written: `settings.voice` is the voice the next
  *Sammlung* is made with — `createCollection` copies it in at creation, and
  `saveVoice` writes the settings record and nothing else — so changing it
  leaves every Sammlung that already exists recording in the voice it was given.
  Only an explicit *record again* moves what has been made, which is somebody
  pressing a button rather than a preference reaching backwards. **Corrected
  2026-08-25:** this said the next *sentence*, and quoted `build()` recording
  each one with `item.voice ?? voiceId`. The voice moved to the Sammlung
  (§4.1, mitreden `e5a6449`) and `build()` now asks a sentence's Sammlung which
  voice it records in. What the bullet claims did not move; the level the
  default lands on did.
- **A thing holds what is true of that thing**, reachable from its own `⋯`
  (§3.6). Which thing that is differs per product, and this rule will not say
  which: naming one would settle another product's model from here.
  **Corrected 2026-08-25.** The reason given used to be §4.1 — "the thing that
  gets recorded carries its own", and naming the Sammlung as owner "would
  settle arity from the wrong end". mitreden then named the Sammlung as the
  owner of the voice, and its arity followed it (§4.1). The caution was right
  and its reason was backwards: ownership is a fact about the model, and arity
  is downstream of it rather than a constraint on it.
- **Within one thing there is one voice and one symbol source** — "one thing"
  being the level that product records at. In vorlaut that is the whole
  Sammlung, because a Sammlung there *is* a layout: a child's device speaking in
  three voices is a defect, and `exchange/SPEC.md` §5.1 lets a package declare
  exactly one symbol collection. **In mitreden it is the Sammlung too, as of
  2026-08-25**, where it used to be the sentence: a Sammlung records in one
  voice, and each sentence keeps a note of the voice it was actually recorded in
  so that staleness stays decidable. That note is a record, not a second answer
  to the same question — `build()` alone writes it.
- **A setting that changes only what you see, and nothing you made, is exempt.**
  bildhaft's active symbol provider is the case. A slot stores a concept key and
  a choice *per provider*, overrides are keyed `${provider}:${token}`, and the
  picture is resolved at render time — so switching source redraws the page and
  disturbs nothing that was made, and switching back finds every manual
  correction still there. A view setting is not a content setting.

**Where the three stand**, in §4's shape. Only one of the three positions is
forced:

- **vorlaut: forced, and it is the one carrying the obligation.** It alone
  *bakes* symbols into a file that leaves the machine. The DIY talker ships no
  symbol library and a tablet package has to open on a device that never heard
  of METACOM, so §5.1 is vorlaut's to keep — and `symbolSource()` in
  `src/data/app_package.ts` keeps it, deriving the source from what the keys
  actually reference and refusing a Sammlung that draws on two rather than
  picking a winner. The voice is the same shape: what leaves is audio, already
  spoken, so the choice has to belong to the thing it will be baked into.
- **bildhaft: not forced, and deliberately the other way.** It references and
  resolves, and its export notice promises what that buys — the file "kann
  unabhängig davon geteilt werden, welche Symbolsammlung die Empfängerin oder
  der Empfänger besitzt". The per-provider choice and the per-provider override
  key are what make that true rather than hopeful: nothing in an exported file
  names one library as *the* answer, so there is nothing for a per-Sammlung
  symbol setting to be.
- **mitreden: already there, and that is a choice too.** Nothing forces
  `settings.voice` to be forward-only. It is forward-only because a recording is
  a thing that was made, and the button that re-speaks the library is where
  changing your mind about the whole of it belongs. A Sammlung's own voice has
  no editing surface yet — `createCollection` takes one and nothing in the
  interface changes it afterwards (read 2026-08-25). When it gets one it belongs
  on the `⋯` beside the name (§3.6) and not in the settings sheet, where a
  control answering differently per Sammlung is exactly the divergence below.

**Diverging: nobody**, as of 2026-08-27. vorlaut was the one, on 2026-08-25, on
two panels of one sheet: the voice (`state.layout.voice`) and the language the
built device shows its own menu in (`state.layout.language`) were both written
from the settings sheet at the foot of the sidebar and both landed in the open
Sammlung's layout — the second under a comment that already said it "is
different from one Sammlung to the next", which is this section's test written
out in the template that failed it.

It is fixed, and not by the move this paragraph prescribed. Both are still
panels rather than menu entries. What changed is the door: they are in a
Sammlung sheet now, opened from the `⋯` beside the name (§3.6), with the tablet
editor's *Raster* card and the per-Sammlung symbol source that has since joined
them. Reading that back as a correction to the rule rather than to the product:
this section's test is about what a control answers to, not about what shape it
takes. A panel whose answer changes when a different row in the sidebar is
selected is not a setting of the app — and it stops being one the moment it is
reached from the row rather than from the app, without having to stop being a
panel.

**Diverging: nobody else**, read against the code the same day rather than
inferred from vorlaut — §3.4's lesson about an audit that stops at its first
hit. mitreden's five panels and bildhaft's five are about the installation
throughout. bildhaft's print settings are the near miss and they pass rather
than escape: they live in `AppSettings`, they are the same for every Sammlung,
and they put nothing on a sentence.

---

## 4. Differences that are correct

Do not converge these. Each follows from what the product holds.

### 4.1 Arity — how many Sammlungen a thing can be in

**Settled: per product, not a house style. All three currently answer one.**

That the three answers agree is not the rule and does not become one. The rule
is that the question was put to three models and answered three times
separately, which is why mitreden could change its answer on 2026-08-25 without
bildhaft or vorlaut being consulted or moved. A fourth product holding something
a sentence could be in two of would say *many* here and be right.

- **mitreden: one. Amended 2026-08-25** (mitreden `e5a6449`, read against
  `src/core/types.ts` and `src/db/repo.ts` the same day). This said *many* — a
  sentence in the morning Sammlung and in the nursery one, with one recording
  behind both — and the recording is what overturned it. The voice moved from
  the sentence to the Sammlung: a Sammlung records in one voice, so a sentence
  in two of them has two answers to which voice records it and no way to choose
  between them. `Phrase.collection` is one id, or none. The morning sentence and
  the nursery one are two sentences now, each with its own recording, which is
  right rather than wasteful — they are two different sounds, and a Sammlung is
  handed to a device as a set of files. The sidebar's multi-select did *not*
  follow the arity down; §4.2 says why it never depended on it.

  What used to be a merge is a second row. Adding a sentence whose text is
  already in another Sammlung mints a row with its own id: a *move* would
  silently empty the Sammlung it came from, and a *refusal* would leave a
  Sammlung unable to hold a sentence that belongs in it. Where the twin was
  recorded in the very voice the new Sammlung records in, the clip is copied
  rather than made again; where the voices differ it is a genuine second
  recording, which is the point rather than the cost. A twin in the *same*
  Sammlung is still a merge, and now a no-op.
- **bildhaft: one.** Asked on its merits and answered no: a Sammlung there is a
  book or a topic, and a line translated for one book is not thereby part of
  another. The unit-of-reuse principle its README states argues for reusing the
  *translation* — which `findByNormalized` already does across every Sammlung —
  not for the row appearing in two places.
- **vorlaut: one, necessarily.** A Sammlung there is a whole layout. It cannot
  be in two, because it *is* the contents of one.

Existing mitreden libraries were carried across rather than dropped
(`f75949c`): a sentence in several Sammlungen kept its id and stayed in the
first — the one it was originally added to — while each further Sammlung got a
row of its own with a copy of the clip, so nothing was re-recorded and nothing
was deleted. A sentence in none stayed in none. That is a deliberate exception
to "One rule about the rules" above, and argued on merits rather than on cost:
the Sicherung carries no audio because audio is reproducible, and reproducing a
whole library is exactly the bill somebody would want to see the new arrangement
before agreeing to. Anything older than the shape it carried across is still
dropped outright.

design.md §3.1 previously made many-to-many a family rule with bildhaft owing
the change; it was amended on 2026-08-24. Arity is a fact about what a product
holds, and a rule that overrides it makes one product's model into the others'
decoration.

**That argument is untouched by 2026-08-25, and this change was made under it
rather than against it.** The two cases look alike from a distance — a section
that used to name three different answers now names one, three times — and a
reader has to be able to tell them apart. What moved here is what mitreden
*holds*: a sentence stopped carrying its own voice, so it stopped being the kind
of thing that can sit in two Sammlungen, and the arity followed the model. It
was not imposed. No section of this document or of design.md asked for it, the
other two products were neither told nor changed, and this section's own closing
argument was read before the decision rather than discovered after it. A family
rule overriding a product's model is the failure named above; three products
agreeing, each for a reason of its own, is not.

### 4.2 Multi-select in the sidebar

mitreden only, where Cmd- or Ctrl-click adds a second Sammlung to the open set.
Elsewhere a rail that toggles would have one reachable state, which is why the
other two pass one id and ignore the additive flag. mitreden's reason for having
it is its own: sentences are worked on across several Sammlungen at a sitting,
and the union of the open set is the view that supports that.

**Amended 2026-08-25.** This was headed "follows from arity", and the derivation
was wrong. Multi-select is about how many Sammlungen may be *open at once*;
arity is about how many one sentence may be *in*. They are independent, and
mitreden's arity change is the proof: arity went to one and the multi-select
stayed exactly as it was. `src/ui/rail.ts` is still the one caller passing more
than one id in `open`, still acts on `additive`, and the list still shows the
union of whatever is open — read 2026-08-25 at mitreden `e5a6449`, which says
the same thing in its own words. It was useful when a sentence could be in the
morning Sammlung and the nursery one, and it is useful now that it cannot.

The wrong derivation was not free. It made §4.2 read as a consequence of §4.1,
so anybody amending §4.1 would have taken the behaviour down with it as
housekeeping.

### 4.3 What deleting takes with it

mitreden keeps the sentences and drops only the membership: a sentence is the
irreplaceable half and outlives any grouping over it. bildhaft and vorlaut
delete the contents, because nothing else refers to them and leaving them would
leave rows nothing can reach.

Both are right for their model. What must stay the same is §1.7 — the question
says which of the two is about to happen.

**Re-read 2026-08-25 against mitreden's arity going to one (§4.1), because "a
grouping over it" was written when there could be another one. It holds.**
`dropCollection` deletes the Sammlung and strips the `collection` field from
each of its sentences in a single transaction; the rows stay, and so do their
clips. Whether membership is one field or an entry in a list is not something
this section ever rested on, and the argument for keeping the sentences is
stronger now, not weaker: each row is one recording of its own, so a deletion
that took the sentences would take audio that only exists there.

What is new is that deleting a Sammlung is now the ordinary way a sentence
becomes uncollected, where before it could land in the other one it was in.
Uncollected is a real state and stays one: a sentence with no Sammlung records
in the settings voice, which is the same answer a Sammlung without a voice gets.
One consequence to know before somebody reports it as a bug — an orphaned
sentence keeps its clip but is compared against the settings voice from then on,
so it can read *stale* where it read *ok*. Nothing is deleted and nothing is
re-recorded unasked. The sentence outlives the grouping; the mark over it need
not.

### 4.4 Nothing duplicates a Sammlung

**Amended 2026-08-24.** This section said the opposite: that duplicate existed
in vorlaut alone and was justified there by `exchange/SPEC.md` §8. Re-read, that
argument does not hold up. §8 says what a copy *must do if one is made* — mint a
fresh id, because a copy that kept its original's silently overwrites that
original on the viewer — and none of the three products has a use for making
one. vorlaut's was built because the rule existed, which is a feature satisfying
a table rather than a person.

The rule itself is untouched and still matters: it is why an id is minted in the
storage layer and never derived from a name or a position, so that nothing here
*can* hand two Sammlungen one identity. What went is the button.

### 4.5 And what design.md exempts

The accent hue, the ground (light or dark), density, and what fills the third
slot of the work head — see design.md §4.4. Nothing here overrides that list.

### 4.6 The empty state is three answers, and all three are right

**Settled 2026-08-25**, after a sweep for the drift this document had not looked
for. What a product shows when there is nothing yet follows from what "nothing"
means there, and the three do not mean the same thing:

- **mitreden** distinguishes two empties. A Sammlung with no sentences says how
  to add one; a *search* with no matches says so instead. They look alike and
  are not: one is a place waiting to be filled, the other is a question that
  came back empty, and telling somebody how to type a sentence is the wrong
  answer to the second.
- **bildhaft** swaps the row list for a panel that names the act — a sentence
  goes in and symbols come out, and the empty state is where that is said.
- **vorlaut** has none, and cannot. A Sammlung there *is* a layout, and a
  layout is a fixed set of slots: an empty one is a board of empty keys, which
  is already the thing you edit. There is no state in which there is nothing to
  show.

The shape of the argument is §4.1's. vorlaut's absence is not a gap to fill, and
mitreden's second empty is not a flourish the others owe — the number of empty
states a product has is a fact about its model.

**What is shared** is the class: `components.css` owns `.empty`, so the two that
have one draw it the same. That is the line this section is drawing — the *look*
converges, the *count* does not.

---

## 5. Extractions, in the order to do them

Sizes assume the release-and-pin loop the family already has: a tag, a bump in
three `package.json`s, and `pins.js` noticing when one is behind. They are the
work itself, not a migration — an extraction replaces the copies in the same
change that publishes the shared one.

Everything in 1, 2, 5a and 5b belongs in **`@lautstark/design`**, beside
`./theme`, which already ships behaviour rather than only CSS, and beside
`components.css`, which already styles `.menu`, `.menu-anchor`, `.sheet` and now
`.collections`. Putting the JS next to the CSS that draws it is the smallest
true home.

The numbering is not tidy on purpose: 5a and 5b are what came out of #5 once it
was designed on paper, and #5 itself is struck through below with the reasoning
that killed it. Renumbering them 6 and 7 would leave nothing pointing at the
question, which is the part worth keeping. #4 is struck through the same way and
for a related reason — designing it on paper is what showed there was nothing
left to extract, and what the real risk turned out to be instead.

| # | what | where | rough effort | |
| --- | --- | --- | --- | --- |
| 1 | menu helper | `@lautstark/design/menu` | **S** — half a day | done |
| 2 | dialog layer | `@lautstark/design/dialog` | **M** — one to two days | done |
| 3 | `touched()` + `slug`/`safeName` | with the storage work | **S**, as a rider | done |
| ~~4~~ | ~~backupFolder panel~~ | — | — | **not doing** |
| 5a | the name field | `@lautstark/design/rename` | **S** | done |
| 5b | the Sammlung rows | `@lautstark/design/collections` | **S** | done |
| ~~5~~ | ~~the Sammlung shell~~ | — | — | **not doing** |

**1. The menu helper.** `menuOn` / `closeMenus` / `ItemOpts` / `AddItem` are
already near-identical files in mitreden and vorlaut; bildhaft's `actionMenu` is
the same behaviour wearing a different shape, and its own comment says `checked`
exists only so the three describe an item with the same word. First because it
is the smallest thing that proves the whole loop — extract, tag, bump three
products, delete three copies — on a component where the three already agree
about the answer.

**2. The dialog layer.** `openDialog` + `confirmDialog`, taking bildhaft's as
the base: it has the top-layer handling, the backdrop-press test done on
`mousedown` against the dialog's own rect, the single `close` exit, and the
`settled` guard. Highest value of the five, because it removes a bug class
rather than duplication — vorlaut rebuilt a poorer version of this and hit
exactly the hang that guard prevents. It carries mitreden's move off native
`confirm`/`prompt` (§3.4), which is the reason it is two days and not one.

**3. `touched()` and `slug`/`safeName`.** Ten lines and forty lines. Neither
earns a package; they ride along with the storage work §2.1 implies and should
not be a task of their own.

**~~4. The backupFolder panel.~~ Not doing, 2026-08-24.** The entry above was
right that it is less duplicated than three ~150-line files suggest, and
measuring it after #2 showed how much less. Comments stripped, the three files
are 67, 61 and 77 lines of code, and **twelve lines are identical across all
three — half of them closing braces.** The two most similar, mitreden's and
vorlaut's, share 27 lines and differ on 74.

The reason is that the extraction already happened, in pieces and under other
names. `@lautstark/sicherung/ui` took the action table at v1.1.0, `ago()` with
it, and `needsAttention()` at v1.2.0; `components.css` styles the panel by
`status.kind` verbatim. What is left is a product's own words and its own way of
getting nodes onto a page — bildhaft builds and hands back a node, the other two
paint into markup that is already there — and design.md §4.4 puts that on the
identity side of the line. `@lautstark/sicherung/ui`'s own header says the same
in more detail, and says why the package refuses to render text: bildhaft has no
`t()`, deliberately, because it turns *German* sentences into pictograms. A
shared panel would hand it exactly the indirection it exists to refuse, in
exchange for twelve lines.

What was actually worth doing came out of designing it: **one contract really
was written three times with nothing checking the three agree** — that
`needs-permission` and `failed` both carry the age of the last real copy. Both
mean no backup is being written and it will not resume by itself, and the age is
what makes that a deadline rather than a complaint somebody can put off. All
three now have a test over their own `sentence()` holding it. That is the risk
the extraction was for, met at a cost the extraction could not have matched.

One thing that test learned the hard way is worth carrying: vorlaut's first
version ran only in whichever language the runner picked, so taking `{age}` out
of the German string left it green. A product with two languages has to assert
in both.

**5a. The name field.** `@lautstark/design/rename`. Renaming is typing in the
title (§1.6), and the timing under that was written three times: debounce, write
on the way out, and a repaint that must not assign over somebody mid-word. Done
2026-08-24, and it is #2-shaped rather than #1-shaped — `refresh()` is the only
way the field can be assigned, so the guard holds by construction instead of
being remembered at each repaint. Three separate failures came out of reading the
three copies against each other: mitreden's blur re-armed its debounce instead of
writing, so a name clicked away from was lost unless nothing navigated in the
next beat; bildhaft's blur wrote unconditionally, which in vorlaut would have
been a sidebar reorder and a backup announcement per visit to the field; and
bildhaft's guard was a value comparison that only held because it echoed each
keystroke into its own state first.

**5b. The Sammlung rows.** `@lautstark/design/collections`, with `.collections`
in components.css beside it. The rows — name, count, ellipsis, tabular figures,
the accent behind the open one — were the part of the three sidebars that
genuinely matched. Done 2026-08-24. It carries `aria-current`, which two of the
three were missing, so the one fact the list exists to convey was not there for
anyone not looking at the accent; and it owns the Cmd-or-Ctrl chord §4.2
settles, which only mitreden uses — it is the one product that opens more than
one Sammlung at a time (§4.2) — but which all three would otherwise have had a
chance to get differently.

The class names became `.collections__*` rather than the `.list__item` two of
the three already shared. Standardising on the majority name would have moved
one product instead of three, and it was still wrong: this package's own gallery
uses `.list` and `.item` for a demo of *sentence* rows, so a `.list` rule in
components.css reached straight into a different component that happened also to
be a list. bildhaft's sidebar makes the same point at run time — its search
results are a `.list` too. A name generic enough to collide once will do it
again.

### ~~5. The Sammlung shell~~ — and why it is not being extracted

The row above this one used to be a single **L**: the registry, the sidebar list
with counts, the active item, create-with-a-date-name, the debounced rename, the
delete confirm, "there is always one", collapse-and-remember, behind an adapter
saying what is inside a Sammlung. It was designed on paper first, and the paper
is the reason it is not being built. This is the most useful thing in §5, because
without it somebody re-proposes the shell in six months from the same audit that
suggested it the first time.

**The adapter does not come out small.** Written honestly it is `list`,
`create`, `rename`, `remove`, `count`, `activate`, `collapsed.read`,
`collapsed.write` — eight methods — plus a bag of strings and a flag for arity.
It can be made to *look* like five by saying "pass your existing repo object"
for the first four, since all three have one; that changes the field count and
not what a product has to supply, so it is not an answer.

**Three things do not fit in an adapter at all.**

*The sidebars are not the same object.* bildhaft's holds a search over every
sentence whose results replace the list; the other two do not. This used to be a
three-way split — vorlaut's was neither a drawer nor a searchable rail — and
half of it closed on 2026-08-25 when §3.1's narrow-screen behaviour was settled
and all three became drawers below 820px. What is left is bildhaft's search,
which is a real difference and enough on its own: "the sidebar list" is still a
shared thing living inside sidebars that are not the same.

That this argument got *smaller* without changing the answer is worth noticing.
Converging the drawer was worth doing on its own merits, and it moved the shell
question by nothing at all, because what stops the shell was never the part that
was easy to agree on.

*The three disagree about who owns the DOM.* bildhaft's sidebar is already
`sidebar(handlers) → {node, render(state)}` — props in, node out, which is the
shape an extracted shell would have. vorlaut and mitreden reach into
`getElementById` for a page they do not own and repaint imperatively. A shared
shell has to pick one, and picking bildhaft's means the other two restructure
their page wiring — work the **L** did not include. §3.1 settles that the page
*is* a sidebar shell and says nothing about this.

*There is a live layering disagreement underneath it.* Create-with-a-date-name
is one of the eight things the shell was to own, and it lives in the **repo** in
mitreden and bildhaft and in the **shell** in vorlaut — whose own comment
explains why it had to move up there, since the storage layer has no language to
name anything in. That is a disagreement about where the seam goes, not about
packaging, and an adapter written over it would freeze one product's answer into
the other two.

**What was actually shared is 5a and 5b**, which are both **S**, both landed
independently, and neither needed the arity question, the DOM-ownership question
or the layering question answered first. What is left of the old #5 after them —
create, the delete confirm, "there is always one", collapse-and-remember — is
four call sites per product, and they are mostly wording and storage, which is
exactly where §1.3, §1.7 and §4.3 already record the differences as correct.

**If somebody wants to revisit this**, the thing that would change the answer is
not more agreement about rows. It is the DOM-ownership question being settled in
§3, and mitreden's storage moving to §2.1. Those are worth doing on their own
merits; the shell is not the reason to do them.

**Related, and not an extraction.** §2.1 asked two products to move to `idb`
with real stores; both did, on 2026-08-24, and that rule now has nobody
diverging. Nothing shared came out of it, which is why it was never on this
list. It used to be filed here as something the Sammlung shell wanted done
first — and now that it is done, it is worth saying plainly that it did not
change the answer above: all three products keep their libraries in indexed
stores and the shell is still not extractable, because what stopped it was
never the storage. It was the three sidebars, the DOM-ownership question and
the layering disagreement. One of the two things that would reopen this has
happened; the other has not.

---

## 6. What this changed in design.md

design.md is an audit of two products, written before vorlaut joined this
concept. Four of its decisions were re-read against three and amended on
2026-08-24; each amendment says so where it stands, so a reader who knows the
old text can see what moved and why.

1. **§3.1 and §3.6 — arity.** Was: many-to-many in both, bildhaft to migrate
   `collectionId` to a list. Now: per product, many where the model allows
   (§4.1 here).
2. **§3.6 and §5 — multi-select in the sidebar.** Follows from 1: mitreden only,
   not a family rule.
3. **§3.4 and §3.6 — where Einstellungen lives.** Was: `⚙` beside the mark, with
   bildhaft to move. Now: the foot of the sidebar, with mitreden to move (§3.2
   here).
4. **§4.4 — the navigation shell.** Was exempt from sharing. Now shared; the
   exemption narrows to density and to what fills the third slot of the work
   head.

**And again on 2026-08-25**, when mitreden's model moved under two of them.
1 and 2 are left as they stand: they record what the earlier amendment said,
which is not the same as what is true now.

5. **§3.1 and §3.6 — arity, a second time.** Was, after 1: per product, many
   where the model allows, with mitreden the one product saying many. Now: still
   per product, and all three answer one — a mitreden sentence carries one
   Sammlung because the Sammlung carries the voice (§4.1 here).
6. **§3.6 and §5 — the selection loses its derivation.** 2 above said
   multi-select follows from 1, and design.md said the sidebar's selection
   follows the arity "rather than the other way round". It follows neither way:
   multi-select is about how many Sammlungen may be open at once (§4.2 here).
   No product's behaviour changed — mitreden's arity went to one and its rail
   still multi-selects, which is what showed the derivation was never load-
   bearing.

---

## 7. A generated file may only contain what its inputs determine

No version, no commit sha, no date, no build number — nothing that changes when
the thing it is derived from has not.

**Why.** Because the only way to know a committed generated file is current is
to regenerate it and compare, and anything extrinsic in the output makes that
comparison always fail. The check then goes red permanently, and a check that is
always red is one people learn to scroll past — so the mechanism meant to catch
a stale file is the first casualty of the stamp, and the staleness it was there
to catch goes with it.

This is written down because `@lautstark/design` broke it twice, in opposite
directions, and neither break was noticed by anybody reading. `tokens/*.css`
carried the generating commit's sha first, which made every commit produce a
different file; that was replaced by the package version, which was stabler and
still not an input — a release bumps it without changing anything the tokens are
derived from, so the audit went red on the push after every release and stayed
red through six of them. The fix both times looked like regenerating and
committing. The actual fix was to stop stamping: the header names the generator
and the accent it derived from, both intrinsic, and nothing else.

**Where a file came from, when that is the real question.** `git log -1` on the
file, in the repository that generates it; and in a consumer, the pin in
`package.json`, which is authoritative and cannot disagree with what is
installed. A stamp inside the file can disagree, and did, for six releases.

**What this does not say.** Content is not the same as provenance: a generated
file should absolutely name its generator and its inputs — `tokens/vorlaut.css`
says it comes from Lautstark/design and follows from the accent `#9B7BFF`, and
both of those are facts about what produced it rather than about when. The rule
is about time-varying stamps, not about comments.

**Diverging: nobody.** `@lautstark/design` enforces it on itself in
`tests/generated.test.js`, which fails on the emitter rather than one release
later on the committed files. Any product that grows a generator wants the same
test; bildquelle's lemma tables are the next candidate.
