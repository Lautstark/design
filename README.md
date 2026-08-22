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

Not by a package, and not by a stylesheet over the network. All three products run
offline — bildhaft entirely in the browser, mitreden on a phone on a home network,
vorlaut with nothing behind it at all — and a CDN request would cost them that. Two
of the three deliberately have no dependencies to add one to.

So the token file is **generated and committed into each product**, carrying a
header naming the commit it came from. When this repository moves, CI regenerates
and opens a pull request against each product. Merging it is how a product adopts
the new version — which keeps the decision where §4.2 puts it, with the product.

Each output goes where that product's stack wants it:

| product | file | why |
| --- | --- | --- |
| bildhaft | `src/styles/tokens.css` | imported by `app.css` |
| vorlaut | `static/tokens.css` | linked ahead of `ui.css` |
| mitreden | inlined into `ui.html` | the repository is one Python file and the page it serves; a second request would be a dependency it does not have |

## What is not shared

The accent hue, by design — it is what tells three otherwise identical-looking
programs apart. Whether a product follows the OS or commits to one ground. Its
navigation shell. Its density. And no code: not a component, not a stylesheet, not a
utility. What travels between the repositories is the document and the generated
file.

## Licence

MIT.
