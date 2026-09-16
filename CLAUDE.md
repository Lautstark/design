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

## 8. A release is a commit subject, not a command

**Since 2026-09-16 nobody cuts a release here.** Every push to `main` runs
`.github/workflows/release.yml`, which calls the family's reusable workflow in
`Lautstark/.github`: `npm run check && npm test`, a check that the tarball is
complete, then semantic-release, which reads the commit subjects since the last
`v*` tag and decides —

| subjects since the last tag contain | bump |
|---|---|
| `feat!:`, or a `BREAKING CHANGE:` trailer | major |
| `feat:` | minor |
| `fix:`, `perf:` | patch |
| only `docs:`, `test:`, `ci:`, `build:`, `chore:`, `refactor:` | none |

On a bump it writes the version into `package.json` **and** `package-lock.json`
(the two that came to say 1.17.0 and 1.15.0 at the same time when a person did
this by hand — `tests/version.test.js` still holds them together), prepends the
notes to `CHANGELOG.md`, commits the three as `chore(release): x.y.z`, tags that
commit, publishes `@lautstark/design` to npmjs.org with provenance and writes a
GitHub release with the same notes. `release.config.mjs` is the whole
configuration.

What that changes for anybody working here:

- **The prefix is the version.** A `fix:` that widens a token pairing ships as
  a patch to every product on its next Renovate run; a `feat:` that adds a
  class to `components.css` ships as a minor. A change a product must react to
  — a removed class, a renamed token — is `feat!:` with a `BREAKING CHANGE:`
  trailer saying what to do, and that is the only thing that stops it landing
  in the products unread.
- **The notes go in the commit body**, where the tag annotation used to carry
  them. `v1.17.0`'s paragraph about a card at 1.10:1 belongs in the `fix:`
  commit that solved it; semantic-release copies the body into the changelog
  and the release.
- **Do not run `npm version`**, and do not edit the version in `package.json`.
  A hand bump either collides with the next release commit or, worse, lands a
  number the changelog cannot account for.
- **`--check` stays where it is.** The audit and the committed-tokens diff in
  `check.yml` did not move and were not weakened; the release workflow runs
  `npm run check` again as its gate before it will tag anything.

The `github:Lautstark/design#vX.Y.Z` pins resolve for every tag before
2026-09-16 and keep working. Anything newer comes from npm as a caret range,
and the products no longer need `npm install` by hand to see it — Renovate
brings a minor or a patch to them on its own once their tests pass.

Until the `@lautstark` scope exists on npmjs.org the workflow stops before
semantic-release, green, with a notice; `@lautstark/sicherung`'s RELEASING.md
has the one-time account setup, which is the same for every package.
