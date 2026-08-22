# design

The look the Lautstark products share, and the thing that generates it.

Three products — [mitreden](https://github.com/Lautstark/mitreden),
[bildhaft](https://github.com/Lautstark/bildhaft),
[vorlaut](https://github.com/Lautstark/vorlaut) — are one tool with three outputs.
You type a sentence; one gives it a voice, one gives it symbols, one puts it on a
key you can press. They should look like siblings, and this is where that is
decided.

**[The gallery →](https://lautstark.github.io/design/)**
· **[The rule set →](docs/design.md)**

## What is here

- **[docs/design.md](docs/design.md)** — the agreement. Token names, the three
  button tiers, fields, chips, menus, dialogs, empty states, and a vocabulary
  glossary so the same thing has the same name in every product.
- **[docs/index.html](docs/index.html)** — the gallery. Every component drawn with
  live tokens, a light/dark switch, and an accent picker.
- **[docs/lib/](docs/lib/)** — the generator. Colour maths, the derivation, and the
  emitter. No dependencies.
- **[products/](products/)** — one small JSON file per product.
- **[build.js](build.js)** — writes each product's token file.

## One input

A product declares one thing about itself: its accent.

```json
{ "product": "vorlaut", "accent": "#9B7BFF", "schemes": "dark", "state": false }
```

Everything else follows. The planes, the hairline, the three weights of text, the
five accent tokens, the danger family — derived, and every value that has to clear
a contrast ratio is *solved* for it rather than picked by eye.

That last part is the point. Between them these products shipped white-on-salmon at
2.48:1 on the button that deletes everything, a `--text-faint` at 2.89:1, and a
replacement for it — ported from a sibling — that still read 4.04:1 on the ground it
actually sat on. Nobody was careless. Judging a contrast ratio by eye is not a thing
people can do, and judging it in whichever scheme your laptop happens to be set to
guarantees the other scheme goes unchecked.

## The gallery is the generator

[docs/index.html](docs/index.html) imports the same modules `build.js` does and
applies their output straight to the page. It is not a picture of the design system;
it is the design system with a hue picker on it. Pick an accent — including one no
product uses — and every component, every token and every contrast ratio re-derives
live.

Try it on a hue you are considering for a fourth product. If it looks wrong there,
it will look wrong shipped.

## Running it

Node, no install, no build step.

```bash
node build.js --check
```

Audits every product and exits non-zero on a failure, writing nothing. This is what
CI runs.

```bash
node build.js
```

Writes each product's token file, provided that product is checked out beside this
repository. A product that fails the audit is never written.

```bash
python3 -m http.server 8899 --directory docs
```

Serves the gallery at [localhost:8899](http://localhost:8899). Any static server
will do; the page is three files and imports nothing from the network.

## How a change reaches the products

By npm, for anything with a build step — as a `github:` dependency, which is how
this family already shares code (`@lautstark/bildquelle`, `@lautstark/stimmquelle`):

```json
"@lautstark/design": "github:Lautstark/design#v1.0.0"
```

```css
@import '@lautstark/design/tokens/bildhaft.css';
```

Vite resolves the bare specifier, so there is no plugin and no copy step. The pin
is a real pin, `npm update` is the whole update story, and `prepare` regenerates
`tokens/` from source on install rather than trusting what was committed — which
costs nothing, because the generator has no dependencies.

Not by a CDN. All three products run offline, and a stylesheet fetched from a
remote host at page load would cost them that. npm is a build-time fetch that
leaves a local file; a `<link>` to another origin is a runtime dependency. Those
are different things.

**For what cannot import**, the product fetches. vorlaut has no `package.json`
and no build step, so a workflow in *its* repository clones this one (public, so
anonymously), runs the generator, and pushes a branch you open a pull request
from. See
[vorlaut/.github/workflows/design-tokens.yml](https://github.com/Lautstark/vorlaut/blob/main/.github/workflows/design-tokens.yml).

Nothing here reaches into another repository, and there is no secret anywhere.
An earlier version of this repo did push outward, which needed a personal access
token with write access to two other repositories, stored here and readable by
every workflow in this repo — a long-lived cross-repository credential for a file
of colour values. Inverting it costs a scheduled run and removes the credential
entirely.

The pulling workflow pushes a branch rather than opening the pull request itself.
Actions is not permitted to open pull requests in these repositories, and
granting that to every workflow to save one click is a poor trade — and a robot's
pull request arrives with no CI run against it anyway, because GitHub will not
run workflows on one. Opening it by hand is what makes the product's own tests
run.

| product | how | where |
| --- | --- | --- |
| bildhaft | npm | `@import` in `src/main.tsx` |
| mitreden | npm, once its rewrite lands | `src/` |
| mitreden | inline | `ui.html`, by hand until that page retires |
| vorlaut | pull | `static/tokens.css`, weekly, no secret |

## What is not shared

The accent hue, by design — it is what tells three otherwise identical-looking
programs apart. Whether a product follows the OS or commits to one ground. Its
navigation shell. Its density. And no code: not a component, not a stylesheet, not a
utility. What travels between the repositories is the document and the generated
file.

## Licence

MIT.
