# Working in this repository

Several agents work here at once, and on 2026-08-25 two of them spent an
afternoon on the same branch without either noticing. The first three rules
below are `Lautstark/vorlaut-diy-talker`'s, which has carried them for longer
and does not have that problem. The rest are this repository's own, because a
design system that generates its own files fails in ways a normal repository
does not.

## 1. Take a worktree, named after your branch

```bash
git worktree add -b claude/<task> .claude/worktrees/<task> main
```

No generated names, so `git worktree list` is the whole dashboard. The checkout
at `~/Code/design` belongs to whoever is passing through — do not assume it is
still on the branch you left it on, and do not leave your work in it.

## 2. Say who you are, first

Before the first edit:

```bash
git config branch.$(git branch --show-current).description "Agent A - what you are doing"
git config --get-regexp 'branch\..*\.description'    # read them all back
```

## 3. Read what you are about to merge

```bash
git log --oneline main..$(git branch --show-current)
```

**Every time.** Two agents picked `claude/vorlaut-board-mock` on the same
afternoon — one drawing the viewer's screens, one drawing the editor's — and the
one who merged it had not looked, so seven commits of unfinished editor design
landed on `main` without their author's say. One command would have shown it.

Never `git checkout -b claude/foo || git checkout claude/foo`: the fallback
turns "make me a branch" into "join whatever exists under that name".

## 4. The token files are output, not source

`tokens/*.css` are **generated**. Every value follows from one input — the
product's accent — and the contrast pairings are solved and checked at
generation time. Editing a hex by hand survives until the next `npm run build`
and silently drops the guarantee it was solved for; the header of each generated
file says so, and it is the first thing anyone reaching for a nicer shade should
read.

To change a value, change the rule that produces it in `build.js`, then:

```bash
npm run build     # regenerate
npm run check     # every pairing, both schemes, all three products
npm test
```

`npm run check` must pass before anything is merged. It is the only thing
standing between a plausible-looking colour and text at 2.9:1 on somebody's
tablet.

## 5. `components.css` before a new component

The button tiers, the field, the chip, the overflow menu, the sheet, the empty
state, the outcome notice, the footer and the Sammlung list are already in
[`docs/components.css`](docs/components.css). That file exists because the
products were retyping each other's rules, and a fourth set of lookalikes is the
drift it was written to stop.

It happens anyway. A pass at vorlaut's screens redefined `.notice`, `.empty`,
`.sheet` and the footer before noticing all four were already there — caught
only because the notice rendered in an accent it had never been given. **Grep
the file before writing a rule, not after.**

Two names to leave alone: the file owns `.sheet > .head`, so nothing else may be
a page-level `.head`; and `.collections` is the *sidebar* row, not any list of
things.

Product layout — a tile grid, a phrase list, print styles — is identity and
stays in its own product. Only what the products demonstrably duplicated
belongs here.

## 6. Mocks are for arguing with

`docs/mocks/` holds HTML mocks of screens that are expensive to iterate on in
their real form — Compose especially, where a round trip is a rebuild and an
emulator. They import the real `tokens/*.css` and the real `components.css`, so
what you are looking at is the output rather than a picture of it.

A mock is worth its keep only if its content is real. A sparse grid of
placeholder squares makes any spacing look fine and tells you nothing; use real
words and real symbols. Symbols in `docs/mocks/symbols/` are ARASAAC
(CC BY-NC-SA, attributed in that directory's README) and are committed so the
mocks render offline, which the family's no-CDN rule requires here too.

**Never METACOM.** It is licensed per person, this repository is public, and
`bildquelle/src/metacom.ts` states the rule the whole family works under: no
METACOM image byte is ever uploaded, transmitted, or written to any server.

## 7. Land your own finished work

Trunk-based, no pull requests.

```bash
npm run check && npm test
git push -u origin "$(git branch --show-current)"
git log --oneline main..$(git branch --show-current)   # rule 3, every time
git -C ~/Code/design status -sb                        # must say main, and be clean
git -C ~/Code/design merge --no-ff "$(git branch --show-current)"
git -C ~/Code/design push origin main
```

`--no-ff` always. If the main checkout is on somebody else's branch or is dirty,
wait. Then remove the worktree and delete the branch, so rule 1's dashboard
stays true.
