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

**Diverging: mitreden** (`localStorage`, key `mitreden.rail`) and **vorlaut**
(has no collapse at all).

### 1.4 Ordering is last-edited first

`updatedAt` descending, so the Sammlung being worked on rises.

**Why.** Creation order answers a question nobody asks. What a sidebar is for is
getting back to what you were doing, and after a handful of Sammlungen creation
order reliably puts that at the bottom. It also gives `updatedAt` a reader,
which is what stops it being a field that is written and never used.

**Diverging: mitreden** and **vorlaut** (creation order; neither keeps an
`updatedAt` yet).

### 1.5 A new Sammlung is named for the day, and the name is selected

`"Sammlung vom 24.08.2026"`, uniquified with ` (2)`; then focus the title input
**and select it**, so the first keystroke replaces the date.

**Why.** A new notebook gets a date. It is a true answer for the many Sammlungen
nobody will name, and it sorts and reads sensibly when there are several. The
selecting is the half that is easy to leave out and is the whole difference
between a suggestion and a thing that has to be deleted first: an unselected
default name is a small chore charged on every creation.

**Diverging: vorlaut** (`"Board 1"`, focused but not selected).

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

**Diverging: vorlaut** (name only; this reverses an earlier decision there).

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

**Diverging: vorlaut** (hand-rolled request callbacks) and **mitreden** (uses
`idb`, but keeps collections and phrases as two JSON arrays under keys in a
`meta` store, so it has the library it declared and none of the indexes).

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

**Diverging: vorlaut** (its transfer button is in the page header).

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

**Diverging: mitreden and bildhaft.**

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

Everything in 1–2 belongs in **`@lautstark/design`**, beside `./theme`, which
already ships behaviour rather than only CSS, and beside `components.css`, which
already styles `.menu`, `.menu-anchor` and `.sheet`. Putting the JS next to the
CSS that draws it is the smallest true home.

| # | what | where | rough effort |
| --- | --- | --- | --- |
| 1 | menu helper | `@lautstark/design/menu` | **S** — half a day |
| 2 | dialog layer | `@lautstark/design/dialog` | **M** — one to two days |
| 3 | `touched()` + `slug`/`safeName` | with the storage work | **S**, as a rider |
| 4 | backupFolder panel | `@lautstark/sicherung/ui` | **M** — needs a text seam |
| 5 | the Sammlung shell | new package | **L** |

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

**4. The backupFolder panel.** Less duplicated than three ~150-line files
suggest: `@lautstark/sicherung/ui` already owns the real logic — which actions
apply to which status, and the "vor 3 Minuten" formatting. What is copied three
times is the rendering and the wording around it, so the extracted panel has to
take its strings from the caller. Worth doing once the pattern for that is set
by #2.

**5. The Sammlung shell.** The registry, the sidebar list with counts, the
active item, create-with-a-date-name, the debounced title rename, the delete
confirm, "there is always one", collapse-and-remember — parameterised by an
adapter saying what is inside one and what its counts mean. Structurally this is
what vorlaut's `core/editor.ts` already does inside one product.

Last because it is the largest and its interface is the least settled, not
because it is blocked: §4.1 and §4.2 settle the arity question it depends on,
and design.md §4.4 no longer exempts the shell.

**Related, and not an extraction.** §2.1 asks two products to move to `idb` with
real stores. Nothing shared comes out of it, so it is not on this list, but #5
wants it done first — a shared shell that has to work against both a store-per-
kind and a JSON-array-under-a-key would be carrying the difference it exists to
remove.

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
