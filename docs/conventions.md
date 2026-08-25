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
it stops. What is already outside it is the **`.obz` exchange format** — once a
package reaches somebody's tablet it is a file on a device nobody here controls,
so `exchange/SPEC.md` keeps its versioning discipline and its compatibility
rules. Everything internal is fair game.

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

**Diverging: mitreden.**

### 1.2 Which Sammlung is open is persisted, in the app's own settings record

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

**Diverging: mitreden** — its `OPEN` set is module state, so a reload lands on
whichever Sammlung happens to be first.

### 1.3 The sidebar-collapse preference is persisted in the same place

**Why.** It is a choice about the shape of the window, which is not one to
re-make every visit; and having decided §1.2, a second answer for a second
preference is how a settings record stops being the settings.

**Diverging: mitreden** (`localStorage`, key `mitreden.rail`).

vorlaut was named here for having no collapse at all. It has one, in the
settings record beside every other preference, and it arrived with the sidebar
this section describes. Another photograph — see the note at the top.

### 1.4 Ordering is last-edited first

`updatedAt` descending, so the Sammlung being worked on rises.

**Why.** Creation order answers a question nobody asks. What a sidebar is for is
getting back to what you were doing, and after a handful of Sammlungen creation
order reliably puts that at the bottom. It also gives `updatedAt` a reader,
which is what stops it being a field that is written and never used.

**Diverging: mitreden** (creation order; it keeps no `updatedAt` at all).

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

**Diverging: nobody**, as of 2026-08-24. vorlaut was named here for `"Board 1"`,
focused but not selected; it names for the day and selects, and did so from the
commit that gave it a list of Sammlungen to name at all — the same one that
spent §1.4's entry. It uniquifies by minting a fresh id rather than by ` (2)`,
because two of its Sammlungen may genuinely share a name and the identity is
never the name (§1.1); what the rule is about is the suggestion, not the
uniqueness.

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

**Diverging: mitreden** (native `confirm()`; see also §3.1).

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

**Diverging: vorlaut** (its `.obz` import replaces the open Sammlung).

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
The membership index is the one that pays here, and it pays because of §4.1:
mitreden is the product whose arity is *many*, a sentence is in the morning
Sammlung and the nursery one at once, and that is precisely the shape a
multiEntry index is for and a filter over everything is worst at. The other
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

**Diverging: nobody**, on having one.

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

**Diverging: mitreden.**

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

**One rule about the promise, learned the hard way:** a confirm resolves from
the buttons, with a `settled` guard, and uses the `close` event only for the
dismissal paths. Resolving from `close` alone is tidier and hangs forever on any
host that closes the dialog without firing it — the caller waits for the life of
the page, and what the person sees is a button that did nothing.

**Diverging: mitreden** (native `confirm()` for destructive acts and native
`prompt()` for editing).

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

### 3.6 The overflow menu is `⋯`, and it holds what acts on the whole Sammlung

Anchored to its trigger, `role="menu"`, focus moves into it on open and returns
to the trigger on Escape or on choosing. Contents, in order: export, then
delete, marked destructive.

**Why.** The two acts that apply to a Sammlung as a whole are rare enough that
neither earns a permanent button and consequential enough that neither should be
hard to find; a menu beside the name is where a thing's own acts belong.
design.md §3.6 settles the glyph.

**Diverging: nobody** on the glyph. On the contents, **vorlaut** keeps its
export in a settings panel.

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

One live region per page — `role="status"`, which is `aria-live="polite"` — and
it is **in the tree from the first paint, never hidden and never removed**. What
changes is its text. Every act that reports an outcome writes there: what
succeeded, what failed, how many arrived.

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

**Diverging: nobody**, as of 2026-08-25. mitreden and vorlaut each met this and
each fixed it. bildhaft's toast set its text, appended the node, and removed it
again 3.2 seconds later, so every acknowledgement the product made — an
exported Sammlung, a saved picture, a failed import, "Alle Daten gelöscht" —
was silent until this rule was written. That it survived longest in the product
whose users are the reason the family exists is the argument for the rule
living here rather than in three commit messages.

---

## 4. Differences that are correct

Do not converge these. Each follows from what the product holds.

### 4.1 Arity — how many Sammlungen a thing can be in

**Settled: many-to-many where the model allows it. Per product, not a house
style.**

- **mitreden: many.** A sentence belongs in the morning Sammlung and in the
  nursery one, with one recording behind both. Its sidebar multi-selects for
  exactly this reason (§4.2).
- **bildhaft: one.** Asked on its merits and answered no: a Sammlung there is a
  book or a topic, and a line translated for one book is not thereby part of
  another. The unit-of-reuse principle its README states argues for reusing the
  *translation* — which `findByNormalized` already does across every Sammlung —
  not for the row appearing in two places.
- **vorlaut: one, necessarily.** A Sammlung there is a whole layout. It cannot
  be in two, because it *is* the contents of one.

design.md §3.1 previously made many-to-many a family rule with bildhaft owing
the change; it was amended on 2026-08-24. Arity is a fact about what a product
holds, and a rule that overrides it makes one product's model into the others'
decoration.

### 4.2 Multi-select in the sidebar follows from arity

mitreden only, where Cmd- or Ctrl-click adds a second Sammlung to the open set.
Elsewhere a rail that toggles would have one reachable state.

### 4.3 What deleting takes with it

mitreden keeps the sentences and drops only the membership: a sentence is the
irreplaceable half and outlives any grouping over it. bildhaft and vorlaut
delete the contents, because nothing else refers to them and leaving them would
leave rows nothing can reach.

Both are right for their model. What must stay the same is §1.7 — the question
says which of the two is about to happen.

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
settles, which only mitreden's arity uses but which all three would otherwise
have had a chance to get differently.

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
sentence whose results replace the list; mitreden's is a drawer with a scrim
below 820px; vorlaut's is neither. "The sidebar list" is a shared thing living
inside three sidebars that are not.

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
